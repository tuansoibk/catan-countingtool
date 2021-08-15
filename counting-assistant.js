import { PlayerHand } from "./models/player";

export class CountingAssistant {

    constructor() {
        this.playerHands = new Map();
        this.orderedPlayerHands = [];
        this.bank = new PlayerHand('bank');
        this.bank.lumber.count = 19;
        this.bank.brick.count = 19;
        this.bank.wool.count = 19;
        this.bank.grain.count = 19;
        this.bank.ore.count = 19;
        this.lastPlayerName = 'lastPlayer';

        // 1. step handler reads input step array from the beginning and decide if it can consume any step
        // 2. step handler makes the decision by evaluating the first step in the array
        // 3. step handler can consume more than 1 step, but the decision whether to consume or not must be decided solely based on the first step
        // 4. step hanlder returns an array of remaining steps by removing all consumed steps (first step must be consumed)
        this.stepHandlers = [
            this.placeSettlementOnSetup,
            this.takeStartingResources,
            this.takeResources,
            this.buildSettlement,
            this.buildRoad,
            this.buildCity,
            this.buyDevCard,
            this.tradeWithPlayer,
            this.tradeWithBank,
            this.stealResource,
            this.discardResources,
            this.takeResourcesWithYearOfPlenty,
            this.stealResourcesWithMonopoly,
            this.useDevCard
        ];
    }

    /**
     * Calculates players' resources based on all steps taken in the game.
     * @param {array of all game steps} steps 
     */
    calculate(steps) {
        while (steps.length !== 0) {
            steps = this.#calculateAndConsumeSteps(steps);
            this.#debug();
            this.demistifyStolenCards();
            this.#debug();
        }
    }

    #calculateAndConsumeSteps(steps) {
        for (let stepHandler of this.stepHandlers) {
            let remainingSteps = stepHandler.call(this, steps);
            if (remainingSteps.length < steps.length) {
                return remainingSteps;
            }
        }

        // if a step can't be processed by any handler, just remove it
        return steps.slice(1);
    }

    placeSettlementOnSetup(steps) {
        let match = /(\w+)\s*?placed a settlement_(\S+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        let color = match[2];
        if (!this.playerHands.has(name)) {
            let newPlayer = new PlayerHand(name, color);
            this.playerHands.set(name, newPlayer);
            this.orderedPlayerHands.push(newPlayer);
        }

        return steps.slice(1);
    }

    takeStartingResources(steps) {
        let match = /(\w+)\s*?received starting resources:(.+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        if (this.playerHands.has(this.lastPlayerName)) {
            // at this point of times, all the players have been added to the list
            // let's rearrange them as per their oder on the screen (based on the name of the last player)
            let lastPlayer = this.orderedPlayerHands[this.orderedPlayerHands.length - 1];
            while (lastPlayer.name !== this.lastPlayerName) {
                this.orderedPlayerHands.pop();
                this.orderedPlayerHands.unshift(lastPlayer);
                lastPlayer = this.orderedPlayerHands[this.orderedPlayerHands.length - 1];
            }
        }

        let name = match[1];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).addResourcesFromText(match[2]);
        }
        else {
            console.warn('Take starting resource: unrecognised player name: ' + name);
        }
        this.bank.removeResourcesFromText(match[2]);

        return steps.slice(1);
    }

    takeResources(steps) {
        let resourceTakingPattern = /(\w+)\s*?got:(.+)/;
        let match = resourceTakingPattern.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        // because of below 2 rules, we'll have to collect all resources-taking steps in 1 roll to decide if a player can get a resource or not
        // - if in a roll, 2 or more players over-produce a resource (there is not enough resource cards in the bank for that type of resource)
        //   --> no one will receive any resource of that type
        // - if in a roll, only 1 player over-produce a resource, he will receive all remaining resource cards of that type

        // we could expect that all resource-taking steps are clustered into a single block and there is no other step between them
        // first, calculate who gets which resources and how many
        let resourceTakingSteps = [];
        for (let step of steps) {
            match = resourceTakingPattern.exec(step);
            if (match != null) {
                resourceTakingSteps.push(step);
            }
            else {
                break;
            }
        }
        // let's use a map of array to store resource count
        // each array store a total count of a resource type, then pairs of player name and number of resources he could take
        // for example: 'lumber': [3, ['Hagai', 2], ['Schwab', 1]] --> total lumber to take = 3, Hagai takes 2, Schwab takes 1
        let resourceCounts = new Map([
            ['lumber', [0]],
            ['brick', [0]],
            ['wool', [0]],
            ['grain', [0]],
            ['ore', [0]]
        ]);
        for (let step of resourceTakingSteps) {
            match = resourceTakingPattern.exec(step);
            let name = match[1];
            let tempPlayer = new PlayerHand();
            tempPlayer.addResourcesFromText(match[2]);
            for (let [resourceName, counts] of resourceCounts) {
                let gainedResource = tempPlayer.resources.get(resourceName);
                if (gainedResource.count > 0) {
                    counts[0] += gainedResource.count;
                    counts.push([name, gainedResource.count]);
                }
            }
        }

        // second, check if bank has enough resource
        for (let [resourceName, counts] of resourceCounts) {
            let total = counts[0];
            let bankResource = this.bank.resources.get(resourceName);
            if (total > 0) {
                if (total <= bankResource.count) {
                    // enough resource
                    for (let i = 1; i < counts.length; i++) {
                        let playerName = counts[i][0];
                        let count = counts[i][1];
                        if (this.playerHands.has(playerName)) {
                            this.playerHands.get(playerName).addNamedResource(resourceName, count);
                        }
                        else {
                            console.warn('Take resource: unrecognised player name: ' + playerName);
                        }
                    }
                    this.bank.removeNamedResource(resourceName, total);
                }
                else if (counts.length === 2) {
                    // only one player get it
                    let playerName = counts[1][0];
                    if (this.playerHands.has(playerName)) {
                        this.playerHands.get(playerName).addNamedResource(resourceName, bankResource.count);
                    }
                    else {
                        console.warn('Take resource: unrecognised player name: ' + playerName);
                    }
                    this.bank.removeNamedResource(resourceName, bankResource.count);
                }
                else {
                    // there are two or more players => no one will get any
                    // do nothing
                }
            }
        }

        return steps.slice(resourceTakingSteps.length);
    }

    buildSettlement(steps) {
        let match = /(\w+)\s*?built a settlement/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResources(1, 1, 1, 1, 0);
        }
        else {
            console.warn('Build settlement: unrecognised player name: ' + name);
        }
        this.bank.addResources(1, 1, 1, 1, 0);
        
        return steps.slice(1);
    }

    buildRoad(steps) {
        let match = /(\w+)\s*?built a road/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResources(1, 1, 0, 0, 0);
        }
        else {
            console.warn('Build road: unrecognised player name: ' + name);
        }
        this.bank.addResources(1, 1, 0, 0, 0);
        
        return steps.slice(1);
    }

    buildCity(steps) {
        let match = /(\w+)\s*?built a city/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResources(0, 0, 0, 2, 3);
        }
        else {
            console.warn('Build city: unrecognised player name: ' + name);
        }
        this.bank.addResources(0, 0, 0, 2, 3);
        
        return steps.slice(1);
    }

    buyDevCard(steps) {
        let match = /(\w+)\s*?bought devcard/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResources(0, 0, 1, 1, 1);
        }
        else {
            console.warn('Buy dev card: unrecognised player name: ' + name);
        }
        this.bank.addResources(0, 0, 1, 1, 1);
        
        return steps.slice(1);
    }

    tradeWithPlayer(steps) {
        let match = /(\w+)\s*?traded:\s*?(.+)\s*?for:\s*?(.+)\s*?with:\s*?(\w+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name1 = match[1];
        let name2 = match[4];
        let resources1 = match[2];
        let resources2 = match[3];
        if (this.playerHands.has(name1)) {
            this.playerHands.get(name1).removeResourcesFromText(resources1);
            this.playerHands.get(name1).addResourcesFromText(resources2);
        }
        else {
            console.warn('Trade with player: unrecognised proposed player name: ' + name1);
        }
        if (this.playerHands.has(name2)) {
            this.playerHands.get(name2).removeResourcesFromText(resources2);
            this.playerHands.get(name2).addResourcesFromText(resources1);
        }
        else {
            console.warn('Trade with player: unrecognised accepted player name: ' + name2);
        }
        
        return steps.slice(1);
    }

    tradeWithBank(steps) {
        let match = /(\w+)\s*?gave bank:\s*?(.+)\s*?and took\s*?(.+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        let resources1 = match[2];
        let resources2 = match[3];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResourcesFromText(resources1);
            this.playerHands.get(name).addResourcesFromText(resources2);
        }
        else {
            console.warn('Buy dev card: unrecognised player name: ' + name);
        }
        this.bank.removeResourcesFromText(resources2);
        this.bank.addResourcesFromText(resources1);
        
        return steps.slice(1);
    }

    stealResource(steps) {
        let match = /(\w+)\s*?stole.*?(lumber|brick|wool|grain|ore|myth)\s*?from:*\s*?(\w+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name1 = match[1];
        let name2 = match[3];
        let yourPlayer = this.orderedPlayerHands[this.orderedPlayerHands.length - 1];
        let stepHash = this.#hash(steps[0]);
        if (name1 === 'You') {
            yourPlayer.addNamedResource(match[2], 1);
            if (this.playerHands.has(name2)) {
                this.playerHands.get(name2).removeNamedResource(match[2], 1);
            }
            else {
                console.warn('You steal from other: unrecognised player name: ' + name2);
            }
        }
        else if (name2 === 'you') {
            if (this.playerHands.has(name1)) {
                this.playerHands.get(name1).addNamedResource(match[2], 1);
            }
            else {
                console.warn('Other steals from you: unrecognised player name: ' + name1);
            }
            yourPlayer.removeNamedResource(match[2], 1);
        }
        else {
            if (this.playerHands.has(name1) && this.playerHands.has(name2)) {
                this.playerHands.get(name1).stealResource(this.playerHands.get(name2), stepHash);
            }
            else if (!this.playerHands.has(name1)) {
                console.warn('Steal resources: unrecognised stealing player name: ' + name1);
            }
            else {
                console.warn('Steal resources: unrecognised stolen player name: ' + name2);
            }
        }
        
        return steps.slice(1);
    }

    discardResources(steps) {
        let match = /(\w+)\s*?discarded:(.+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        let resources = match[2];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).removeResourcesFromText(resources);
        }
        else {
            console.warn('Discard resources: unrecognised player name: ' + name);
        }
        this.bank.addResourcesFromText(resources);
        
        return steps.slice(1);
    }

    takeResourcesWithYearOfPlenty(steps) {
        let match = /(\w+)\s*?took from bank:\s*?(.+)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        let resources = match[2];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).addResourcesFromText(resources);
        }
        else {
            console.warn('Year of Plenty: unrecognised player name: ' + name);
        }
        this.bank.removeResourcesFromText(resources);
        
        return steps.slice(1);
    }

    stealResourcesWithMonopoly(steps) {
        let match = /(\w+)\s*?built a settlement/.exec(steps[0]);
        if (match == null) {
            return steps;
        }
        
        return steps.slice(1);
    }

    useDevCard(steps) {
        let match = /(\w+)\s*?built a settlement/.exec(steps[0]);
        if (match == null) {
            return steps;
        }
        
        return steps.slice(1);
    }

    demistifyStolenCards() {

    }

    #debug() {

    }

    #hash(content) {
        var hash = 0;
        if (content.length == 0) {
            return hash;
        }
        for (var i = 0; i < content.length; i++) {
            var char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash;
    }
}
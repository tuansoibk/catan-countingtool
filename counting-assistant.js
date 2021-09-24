import { PlayerHand } from './models/player.js';

const MAX_RESOURCE_COUNT = 19;

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
        let stepsToCalc = steps.map((step, i) => `step ${i}: ${step}`);
        while (stepsToCalc.length !== 0) {
            stepsToCalc = this.#calculateAndConsumeSteps(stepsToCalc);
        }
    }

    #calculateAndConsumeSteps(steps) {
        for (let stepHandler of this.stepHandlers) {
            let remainingSteps = stepHandler.call(this, steps);
            if (remainingSteps.length < steps.length) {
                console.log('Consumed steps:');
                for (let i = 0; i < steps.length - remainingSteps.length; i++) {
                    console.log(' - ' + steps[i]);
                }
                this.#debug();

                return remainingSteps;
            }
        }

        // if a step can't be processed by any handler, just remove it
        return steps.slice(1);
    }

    placeSettlementOnSetup(steps) {
        let match = /([\w#]+)\s*?placed a settlement_(\S+)/.exec(steps[0]);
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
        let match = /([\w#]+)\s*?received starting resources:(.+)/.exec(steps[0]);
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
        let resourceTakingPattern = /([\w#]+)\s*?got:(.+)/;
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
        let match = /([\w#]+)\s*?built a settlement/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    buildRoad(steps) {
        let match = /([\w#]+)\s*?built a road/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    buildCity(steps) {
        let match = /([\w#]+)\s*?built a city/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    buyDevCard(steps) {
        let match = /([\w#]+)\s*?bought devcard/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    tradeWithPlayer(steps) {
        let match = /([\w#]+)\s*?traded:\s*?(.+)\s*?for:\s*?(.+)\s*?with:\s*?([\w#]+)/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    tradeWithBank(steps) {
        let match = /([\w#]+)\s*?gave bank:\s*?(.+)\s*?and took\s*?(.+)/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    stealResource(steps) {
        let match = /([\w#]+)\s*?stole.*?(lumber|brick|wool|grain|ore|myth)\s*?from:*\s*?([\w#]+)/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    discardResources(steps) {
        let match = /([\w#]+)\s*?discarded:(.+)/.exec(steps[0]);
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

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    takeResourcesWithYearOfPlenty(steps) {
        let match = /([\w#]+)\s*?took from bank:\s*?(.+)/.exec(steps[0]);
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
        let match = /([\w#]+)\s*?stole (\d+): (lumber|brick|wool|grain|ore)/.exec(steps[0]);
        if (match == null) {
            return steps;
        }

        let name = match[1];
        let count = 1 * match[2];
        let resource = match[3];
        if (this.playerHands.has(name)) {
            this.playerHands.get(name).addNamedResource(resource, count);
        }
        else {
            console.warn('Monopoly: unrecognised player name: ' + name);
        }
        this.playerHands.forEach((player) => {
            if (player.name !== name) {
                // NOTE: the model can be broken here, if players get stolen have stealing/stolen cards in there hand
                player.removeNamedResource(resource, player.resources.get(resource).count);
            }
        });

        // demistifying can only be done after resources were used
        if (this.demistifyStealingCards() || this.normaliseZeroCard()) {
            this.#debug();
        }
        
        return steps.slice(1);
    }

    useDevCard(steps) {
        let match = /([\w#]+)\s*?built a settlement/.exec(steps[0]);
        if (match == null) {
            return steps;
        }
        
        return steps.slice(1);
    }

    demistifyStealingCards() {
        // iterate through each player and try to detect stealing cards that can be demistified
        let toContinue;
        let demistified = false;
        do {
            toContinue = false;
            let res = false;
            for (const player of this.orderedPlayerHands) {
                res |= player.demistifyStealingCards(this.orderedPlayerHands);
            }
            demistified |= res;
            toContinue = res;
        } while (toContinue); // if a stealing card is demistified, repeat the same steps to dimistified chained stealing cards

        return demistified;
    }

    normaliseZeroCard() {
        let normalised = false;
        for (const player of this.orderedPlayerHands) {
            normalised |= player.normaliseZeroCard();
        }

        return normalised;
    }

    #debug() {
        console.log('----------------------------------------------------------------------------------------------');
        console.log(`   ${'Player'.padEnd(19)} ` +
            `${'LUMBER'.padEnd(8) } ` +
            `${'BRICK'.padEnd(8) } ` +
            `${'WOOL'.padEnd(8) } ` +
            `${'GRAIN'.padEnd(8) } ` +
            `${'ORE'.padEnd(8) } ` +
            `${'STEALING'.padEnd(8) } ` +
            `${'STOLEN'.padEnd(8) } ` +
            `${'TOTAL'.padEnd(8) } `
        );
        for (const player of this.orderedPlayerHands) {
            console.log(` - ${player.name.padEnd(20)} ` +
                `${player.lumber.count.toString().padEnd(8) } ` +
                `${player.brick.count.toString().padEnd(8) } ` +
                `${player.wool.count.toString().padEnd(8) } ` +
                `${player.grain.count.toString().padEnd(8) } ` +
                `${player.ore.count.toString().padEnd(8) } ` +
                `${player.stealing.length.toString().padEnd(8) } ` +
                `${player.stolen.length.toString().padEnd(8) } ` +
                `${player.totalResources.toString().padEnd(8) } `
            );
        }
        console.log(` - ${'BANK'.padEnd(20)} ` +
                `${this.bank.lumber.count.toString().padEnd(8) } ` +
                `${this.bank.brick.count.toString().padEnd(8) } ` +
                `${this.bank.wool.count.toString().padEnd(8) } ` +
                `${this.bank.grain.count.toString().padEnd(8) } ` +
                `${this.bank.ore.count.toString().padEnd(8) } ` +
                `${this.bank.stealing.length.toString().padEnd(8) } ` +
                `${this.bank.stolen.length.toString().padEnd(8) } ` +
                `${this.bank.totalResources.toString().padEnd(8) } `
            );
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
import { ResourceCard } from './resource-card.js';
import { StolenCard } from './stolen-card.js';

export class PlayerHand {
    
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.lumber = ResourceCard.lumber(0);
        this.brick = ResourceCard.brick(0);
        this.wool = ResourceCard.wool(0);
        this.grain = ResourceCard.grain(0);
        this.ore = ResourceCard.ore(0);
        this.resources = new Map ([
            ['lumber', this.lumber],
            ['brick', this.brick],
            ['wool', this.wool],
            ['grain', this.grain],
            ['ore', this.ore]
        ]);
        this.stealing = [];
        this.stolen = [];
        this.totalResources = 0;
    }

    addResources(lumber, brick, wool, grain, ore) {
        this.lumber.add(lumber);
        this.brick.add(brick);
        this.wool.add(wool);
        this.grain.add(grain);
        this.ore.add(ore);
        this.#countTotalResources();
    }

    addNamedResource(resourceName, count) {
        this.resources.get(resourceName).count += count;
        this.#countTotalResources();
    }

    addResourcesFromText(resourceText) {
        this.lumber.addFromText(resourceText);
        this.brick.addFromText(resourceText);
        this.wool.addFromText(resourceText);
        this.grain.addFromText(resourceText);
        this.ore.addFromText(resourceText);
        this.#countTotalResources();
    }

    removeResources(lumber, brick, wool, grain, ore) {
        this.lumber.remove(lumber);
        this.brick.remove(brick);
        this.wool.remove(wool);
        this.grain.remove(grain);
        this.ore.remove(ore);
        this.#countTotalResources();
    }

    removeNamedResource(resourceName, count) {
        this.resources.get(resourceName).count -= count;
        this.#countTotalResources();
    }

    removeResourcesFromText(resourceText) {
        this.lumber.removeFromText(resourceText);
        this.brick.removeFromText(resourceText);
        this.wool.removeFromText(resourceText);
        this.grain.removeFromText(resourceText);
        this.ore.removeFromText(resourceText);
        this.#countTotalResources();
    }

    #countTotalResources() {
        this.totalResources = this.lumber.count
            + this.brick.count
            + this.wool.count
            + this.grain.count
            + this.ore.count
            + this.stealing.length
            - this.stolen.length;
    }

    #onlyHasLumber() {
        return this.lumber.count > 0 &&
            this.lumber.count == this.totalResources &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #onlyHasBrick() {
        return this.brick.count > 0 &&
            this.brick.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #onlyHasWool() {
        return this.wool.count > 0 &&
            this.wool.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #onlyHasGrain() {
        return this.grain.count > 0 &&
            this.grain.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #onlyHasOre() {
        return this.ore.count > 0 &&
            this.ore.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.stealing.length == 0;
    }

    #onlyHasOneStealingCard() {
        return this.totalResources == 1 &&
            this.stealing.length == 1 &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0;
    }

    stealResource(playerHand, stepHash) {
        // there are few cases:
        // - being stolen player has a single type of resource
        // - being stolen player has just a single card, and it is a stealing card
        // - other cases

        if (playerHand.#onlyHasLumber()) {
            playerHand.removeNamedResource('lumber', 1);
            this.addNamedResource('lumber', 1);
            console.log('Stolen resource is lumber');
        }
        else if (playerHand.#onlyHasBrick()) {
            playerHand.removeNamedResource('brick', 1);
            this.addNamedResource('brick', 1);
            console.log('Stolen resource is brick');
        }
        else if (playerHand.#onlyHasWool()) {
            playerHand.removeNamedResource('wool', 1);
            this.addNamedResource('wool', 1);
            console.log('Stolen resource is wool');
        }
        else if (playerHand.#onlyHasGrain()) {
            playerHand.removeNamedResource('grain', 1);
            this.addNamedResource('grain', 1);
            console.log('Stolen resource is grain');
        }
        else if (playerHand.#onlyHasOre()) {
            playerHand.removeNamedResource('ore', 1);
            this.addNamedResource('ore', 1);
            console.log('Stolen resource is ore');
        }
        else if (playerHand.#onlyHasOneStealingCard()) {
            const stolenCard = playerHand.stealing.pop();
            playerHand.#countTotalResources();
            this.stealing.push(stolenCard);
            this.#countTotalResources();
            console.log('Stolen resource is a stealing card: ' + stolenCard.stepHash);
        }
        else {
            let possibleResources = [];
            for (let [resourceName, resource] of playerHand.resources) {
                if (resource.count > 0) {
                    possibleResources.push(new ResourceCard(resourceName, resource.count));
                }
            }
            for (let stealingResource of playerHand.stealing) {
                possibleResources.push(stealingResource);
            }
            let stolenCard = new StolenCard(stepHash, playerHand.name, possibleResources);
            this.stealing.push(stolenCard);
            playerHand.stolen.push(stolenCard);
            this.#countTotalResources();
            playerHand.#countTotalResources();
            console.log('Stolen resource is a myth: ' + JSON.stringify(stolenCard));
        }
    }

    demistifyStealingCards(allPlayerHands) {
        let result = this.#tryDemistifyScenario1(allPlayerHands);
        result |= this.#tryDemistifyScenario2(allPlayerHands);
        result |= this.#tryDemistifyScenario3(allPlayerHands);

        return result;
    }

    #tryDemistifyScenario1(allPlayerHands) {
        // 1st scenario: 
        //  - a player used N resources of the same type that he doesn't have in his hand
        //  - he has exactly N stealing cards
        //  -> all N stealing cards can be demistified to the used resource
        // example:
        //  - player A placed a settlement while he didn't have brick
        //  - A has a card stolen from B
        //  - at the time of the stealing, B has two bricks, one stolen card
        // result:
        //  - the stealing card must be a brick card
        //  - now B only has one brick, no stolen card

        let negativeResourceCount = 0;
        let negativeResource;
        for (const resource of this.resources.values()) {
            if (resource.count < 0) {
                negativeResourceCount++;
                negativeResource = resource;
            }
        }
        if (negativeResourceCount == 1 && negativeResource.count + this.stealing.length == 0) {
            console.log(`Demistifing scenario 1 for user: ${this.name}, negative resource: ${negativeResource.name}, count: ${negativeResource.count}`);
            const stealingCards = [...this.stealing];
            stealingCards.forEach(card => card.demistifiedResource = negativeResource.name);
            this.#removeDemistifiedStealingCard(stealingCards);
            for (const playerHand of allPlayerHands) {
                if (playerHand.name != this.name) {
                    playerHand.#removeDemistifiedStolenCard(stealingCards);
                }
            }

            return true;
        }

        return false;
    }

    #tryDemistifyScenario2(allPlayerHands) {
        // 2nd scenario: 
        //  - a player used N resources of the same type that he doesn't have in his hand
        //  - he has M stealing cards, where exactly N cards can be resolve to the used resource, M-N other cards cannot
        //  -> all N stealing cards can be demistified to the used resource
        // example:
        //  - player A placed a settlement while he didn't have brick
        //  - A has a card stolen from B
        //  - A also has a card stolen from C and D
        //  - at the time of the stealing, B has two bricks, one stolen card
        //  - at the time of the stealing, C has no brick, one stolen card
        //  - at the time of the stealing, D has one brick, one stolen card
        // result:
        //  - the stealing card must be a brick card from B and D
        //  - now B only has one brick, no stolen card
        //  - C still has a stolen card
        //  - D has no brick, no stolen card

        let result = false;
        for (const resource of this.resources.values()) {
            if (resource.count < 0) {
                const stealingCards = this.#getStealingCardsThatCanResolveTo(resource.name);
                if (stealingCards.length == 0) {
                    console.warn(`A resource of type: ${resource.name} is used up but can't be resolved from stealing cards`);
                    console.warn(JSON.stringify(this.stealing));
                    
                    continue;
                }
                if (resource.count + stealingCards.length == 0) {
                    console.log(`Demistifing scenario 2 for user: ${this.name}, negative resource: ${resource.name}, count: ${resource.count}`);
                    stealingCards.map(card => card.demistifiedResource = resource.name);
                    this.#removeDemistifiedStealingCard(stealingCards);
                    for (const playerHand of allPlayerHands) {
                        if (playerHand.name != this.name) {
                            playerHand.#removeDemistifiedStolenCard(stealingCards);
                        }
                    }
        
                    result = true;
                }
            }
        }

        return result;
    }

    #tryDemistifyScenario3(allPlayerHands) {
        // 3rd scenario: 
        //  - a player used N resources of the same type that he doesn't have in his hand
        //  - he has M stealing cards, where K cards can be resolve to the used resource, M-K other cards cannot
        //  - all K cards were stolen from a single player
        //  -> all K stealing cards can be demistified to the used resource
        //  ## note 1: N is always less than or equal to K
        //  ## when N is equal to K, it becomes the scenario 2
        //  ## when N is greater than K, we have a problem with this model!!!
        //  ## note 2: because K < N, we don't know which K cards to demistify, if we try to demistify random K cards
        //  ## it will affect later calculation... --> just comment it out atm
        // example:
        //  - player A placed a settlement while he didn't have brick
        //  - A has 2 cards stolen from B
        //  - A also has a card stolen from C
        //  - at the time of the 1st stealing, B has two bricks
        //  - at the time of the 2nd stealing, B has two bricks
        //  - at the time of the stealing, C has no brick
        // result:
        //  - the brick card that A used must be stolen from B
        //  - now B only has one brick, 1 stolen card
        //  - C has a stolen card

        let result = false;
        for (const resource of this.resources.values()) {
            if (resource.count < 0) {
                const stealingCards = this.#getStealingCardsThatCanResolveTo(resource.name);
                if (stealingCards.length == 0) {
                    console.warn(`A resource of type: ${resource.name} is used up but can't be resolved from stealing cards`);
                    console.warn(JSON.stringify(this.stealing));
                    
                    continue;
                }
                let stolenFroms = [];
                for (let stealingCard of stealingCards) {
                    if (!stolenFroms.includes(stealingCard.stolenFrom)) {
                        stolenFroms.push(stealingCard.stolenFrom);
                    }
                }
                if (resource.count < stealingCards.length) {
                    if (stolenFroms.length == 1) { // all resolvable cards were stolen from a single player
                        console.log(`Demistifing scenario 3 for user: ${this.name}, negative resource: ${resource.name}, count: ${resource.count}`);
                        // TODO: implement the logic here
                        console.log('!!! Not yet implemented');
                    }
                }
                else {
                    console.warn('Perhaps the model is broken here, when used resource count > number of resolvable stealing cards');
                }
            }
        }

        return result;
    }

    #getStealingCardsThatCanResolveTo(resourceName) {
        const stealingCards = [];
        for (const stealingCard of this.stealing) {
            for (const resource of stealingCard.possibleResources) {
                if (resource.name == resourceName) {
                    stealingCards.push(stealingCard);
                }
            }
        }

        return stealingCards;
    }

    #removeDemistifiedStealingCard(stealingCards) {
        let tobeRemoved = [];
        for (let i = 0; i < this.stealing.length; i++) {
            for (const stealingCard of stealingCards) {
                if (stealingCard.stepHash == this.stealing[i].stepHash) {
                    tobeRemoved.push(i);
                    this.addNamedResource(stealingCard.demistifiedResource, 1);
                }
            }
        }
        for (let i = tobeRemoved.length - 1; i >= 0; i--) {
            this.stealing.splice(tobeRemoved[i], 1);
        }
        this.#countTotalResources();
    }

    #removeDemistifiedStolenCard(stealingCards) {
        let tobeRemoved = [];
        for (let i = 0; i < this.stolen.length; i++) {
            for (const stealingCard of stealingCards) {
                if (stealingCard.stepHash == this.stolen[i].stepHash) {
                    tobeRemoved.push(i);
                    this.removeNamedResource(stealingCard.demistifiedResource, 1);
                }
            }
        }
        for (let i = tobeRemoved.length - 1; i >= 0; i--) {
            this.stolen.splice(tobeRemoved[i], 1);
        }
        this.#countTotalResources();
    }

    normaliseZeroCard() {
        if (this.totalResources == 0 && (this.stealing.length > 0 || this.stolen.length > 0)) {
            console.log('Normalising zero card for player: ' + this.name);
            this.lumber.count = 0;
            this.brick.count = 0;
            this.wool.count = 0;
            this.grain.count = 0;
            this.ore.count = 0;
            this.stealing = [];
            this.stolen = [];
            this.#countTotalResources();

            return true;
        }

        return false;
    }
}
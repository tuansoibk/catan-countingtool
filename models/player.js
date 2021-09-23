import { ResourceCard } from "./resource-card";
import { StolenCard } from "./stolen-card";

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

    #hasOnlylumber() {
        return this.lumber.count > 0 &&
            this.lumber.count == this.totalResources &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #hasOnlyBrick() {
        return this.brick.count > 0 &&
            this.brick.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #hasOnlyWool() {
        return this.wool.count > 0 &&
            this.wool.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.grain.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #hasOnlyGrain() {
        return this.grain.count > 0 &&
            this.grain.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.ore.count == 0 &&
            this.stealing.length == 0;
    }

    #hasOnlyOre() {
        return this.ore.count > 0 &&
            this.ore.count == this.totalResources &&
            this.lumber.count == 0 &&
            this.brick.count == 0 &&
            this.wool.count == 0 &&
            this.grain.count == 0 &&
            this.stealing.length == 0;
    }

    #hasOnlyOneStealingCard() {
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

        if (playerHand.#hasOnlylumber()) {
            playerHand.removeNamedResource('lumber', 1);
            this.addNamedResource('lumber', 1);
        }
        else if (playerHand.#hasOnlyBrick()) {
            playerHand.removeNamedResource('brick', 1);
            this.addNamedResource('brick', 1);
        }
        else if (playerHand.#hasOnlyWool()) {
            playerHand.removeNamedResource('wool', 1);
            this.addNamedResource('wool', 1);
        }
        else if (playerHand.#hasOnlyGrain()) {
            playerHand.removeNamedResource('grain', 1);
            this.addNamedResource('grain', 1);
        }
        else if (playerHand.#hasOnlyOre()) {
            playerHand.removeNamedResource('ore', 1);
            this.addNamedResource('ore', 1);
        }
        else if (playerHand.#hasOnlyOneStealingCard()) {
            const stolenCard = playerHand.stealing.pop();
            playerHand.#countTotalResources();
            this.stealing.push(stolenCard);
            this.#countTotalResources();
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
            let stolenCard = new StolenCard(stepHash, possibleResources);
            this.stealing.push(stolenCard);
            playerHand.stolen.push(stolenCard);
            this.#countTotalResources();
            playerHand.#countTotalResources();
        }
    }
}
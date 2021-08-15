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
        this.stole = [];
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
            + this.stole.length
            - this.stolen.length;
    }

    stealResource(playerHand, stepHash) {
        let possibleResources = [];
        for (let [resourceName, resource] of playerHand.resources) {
            if (resource.count > 0) {
                possibleResources.push(new ResourceCard(resourceName, resource.count));
            }
        }
        let stolenCard = new StolenCard(stepHash, possibleResources);
        this.stole.push(stolenCard);
        playerHand.stolen.push(stolenCard);
        this.#countTotalResources();
        playerHand.#countTotalResources();
    }
}
import { debug } from "console";
import { PlayerHand } from "./models/player";

export class CountingAssistant {

    constructor() {
        this.playerHands = {};
        this.bank = new PlayerHand('bank');
        this.stepHandlers = [
            this.gameSetup,
            this.receiveStartingResources,
            this.receiveResources,
            this.buildSettlement,
            this.buildRoad,
            this.buildCity,
            this.buyDevCard,
            this.tradeWithPlayer,
            this.tradeWithBank,
            this.stealResource,
            this.discardResources,
            this.receiveResourcesWithYearOfPlenty,
            this.stealResourcesWithMonopoly,
            this.useDevCard
        ];
    }

    /**
     * Calculates players' resources based on all steps taken in the game.
     * @param {array of all game steps} steps 
     */
    calculate(steps) {
        steps.forEach(step => {
            this.calculateWithSingleStep(step);
            this.#debug();
            this.demistifyStolenCards();
            this.#debug();
        });
    }

    calculateWithSingleStep(step) {
        for (let i = 0; i < this.stepHandlers.length; i++) {
            if (this.stepHandlers[i](step)) {
                return;
            }
        }
    }

    gameSetup(step) {

    }

    receiveStartingResources(step) {

    }

    receiveResources(step) {

    }

    buildSettlement(step) {

    }

    buildRoad(step) {

    }

    buildCity(step) {

    }

    buyDevCard(step) {

    }

    tradeWithPlayer(step) {

    }

    tradeWithBank(step) {

    }

    stealResource(step) {

    }

    discardResources(step) {

    }

    receiveResourcesWithYearOfPlenty(step) {

    }

    stealResourcesWithMonopoly(step) {

    }

    useDevCard(step) {

    }
}
export class Player {
    constructor(name) {
        this.name = name;
        this.lumber = 0;
        this.brick = 0;
        this.wool = 0;
        this.grain = 0;
        this.ore = 0;
        this.myth = 0;
        this.totalResources = 0;
        this.color = 'black';
    }

    modifyResource(lumber, brick, wool, grain, ore, myth) {
        this.lumber += lumber;
        this.brick += brick;
        this.wool += wool;
        this.grain += grain;
        this.ore += ore;
        this.myth += myth;
        this.updateTotalResources();
        this.#demystify();
    }

    updateTotalResources() {
        this.totalResources = this.lumber + this.brick + this.wool + this.grain + this.ore + this.myth;
    }

    #demystify() {
        // if total resource = 0 --> clear all countings
        if (this.totalResources === 0) {
            this.lumber = this.brick = this.wool = this.grain = this.ore = this.myth = 0;
        }

        // if any resource count is negative, deduct it from myth
        if (this.lumber < 0) {
            this.myth += this.lumber;
            this.lumber = 0;
        }
        if (this.brick < 0) {
            this.myth += this.brick;
            this.brick = 0;
        }
        if (this.wool < 0) {
            this.myth += this.wool;
            this.wool = 0;
        }
        if (this.grain < 0) {
            this.myth += this.grain;
            this.grain = 0;
        }
        if (this.ore < 0) {
            this.myth += this.ore;
            this.ore = 0;
        }

        // if there is only one single resource type, robbed card must be that resource type 
        if (this.myth < 0) {
            if ((this.lumber + this.myth) === this.totalResources) {
                this.lumber += this.myth;
                this.myth = 0;
            }
            if ((this.brick + this.myth) === this.totalResources) {
                this.brick += this.myth;
                this.myth = 0;
            }
            if ((this.wool + this.myth) === this.totalResources) {
                this.wool += this.myth;
                this.myth = 0;
            }
            if ((this.grain + this.myth) === this.totalResources) {
                this.grain += this.myth;
                this.myth = 0;
            }
            if ((this.ore + this.myth) === this.totalResources) {
                this.ore += this.myth;
                this.myth = 0;
            }
        }
    }
}

export class DevCardDeck {
    constructor() {
        this.knight = 14;
        this.roadBuilding = 2;
        this.yearOfPlenty = 2;
        this.monopoly = 2;
        this.victoryPoint = 5;
        this.remainingCards = 25;
    }
}
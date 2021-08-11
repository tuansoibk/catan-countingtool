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
        if (this.myth === 1) {
            if (this.lumber === -1) {
                this.myth = 0;
                this.lumber = 0;
            }
            else if (this.brick === -1) {
                this.myth = 0;
                this.brick = 0;
            }
            else if (this.wool === -1) {
                this.myth = 0;
                this.wool = 0;
            }
            else if (this.grain === -1) {
                this.myth = 0;
                this.grain = 0;
            }
            else if (this.ore === -1) {
                this.myth = 0;
                this.ore = 0;
            }
        }
        this.updateTotalResources();
    }

    updateTotalResources() {
        this.totalResources = this.lumber + this.brick + this.wool + this.grain + this.ore + this.myth;
        if (this.totalResources === 0) {
            this.lumber = this.brick = this.wool = this.grain = this.ore = this.myth = 0;
        }
    }
}
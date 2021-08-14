export class ResourceCard {

    static LUMBER = 'lumber';
    static BRICK = 'brick';
    static WOOL = 'wool';
    static GRAIN = 'grain';
    static ORE = 'ore';

    constructor(name, count) {
        this.name = name;
        this.count = 0;
        if (count !== undefined) {
            this.count = count;
        }
    }

    add(count) {
        this.count += count;
    }

    remove(count) {
        this.count -= count;
    }

    addFromText(text) {
        let re = new RegExp('\\b' +  this.name + '\\b', 'g');
        let matches = [...text.matchAll(re)];
        this.count += matches.length;
    }

    removeFromText(text) {
        let re = new RegExp('\\b' +  this.name + '\\b', 'g');
        let matches = [...text.matchAll(re)];
        this.count -= matches.length;
    }

    static lumber(count) {
        return new ResourceCard(this.LUMBER, count);
    }

    static brick(count) {
        return new ResourceCard(this.BRICK, count);
    }

    static wool(count) {
        return new ResourceCard(this.WOOL, count);
    }

    static grain(count) {
        return new ResourceCard(this.GRAIN, count);
    }

    static ore(count) {
        return new ResourceCard(this.ORE, count);
    }
}
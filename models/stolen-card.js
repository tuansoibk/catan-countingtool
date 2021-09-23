export class StolenCard {
    
    constructor(stepHash, possibleResources) {
        this.stepHash = stepHash;
        this.possibleResources = possibleResources;
        this.name = 'stolen';
        this.count = 1;
        this.totalResourceBeforeStolen = 0;
        this.possibleResources.forEach(resource => {
            this.totalResourceBeforeStolen += resource.count;
        });
    }
}
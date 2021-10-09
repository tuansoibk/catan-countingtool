export class StolenCard {
    
    constructor(stepHash, stolenFrom, possibleResources) {
        this.stepHash = stepHash;
        this.stolenFrom = stolenFrom;
        this.possibleResources = possibleResources;
        this.name = 'stolen';
        this.count = 1;
        this.totalResourceBeforeStolen = 0;
        this.possibleResources.forEach(resource => {
            this.totalResourceBeforeStolen += resource.count;
        });
        this.demistifiedResource = '';
    }
}
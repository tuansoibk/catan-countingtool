import { beforeEach, expect, test } from "@jest/globals";
import { CountingAssistant } from "./counting-assistant";
import { PlayerHand } from "./models/player";

let underTest;

beforeEach(() => {
    underTest = new CountingAssistant();
});

test('new player is added on place settlement step', () => {
    // given
    let step1 = 'Hagai placed a settlement_blue';
    let step2 = 'Schwab placed a settlement_orange';
    let step3 = 'Marcie placed a settlement_red';
    let step4 = 'Elly placed a settlement_black';


    // when
    underTest.placeSettlementOnSetup([step1]);
    underTest.placeSettlementOnSetup([step2]);
    underTest.placeSettlementOnSetup([step3]);
    underTest.placeSettlementOnSetup([step4]);

    // then
    expect(underTest.playerHands.size).toBe(4);
    expect(underTest.playerHands.get('Hagai').color).toBe('blue');
    expect(underTest.playerHands.get('Schwab').color).toBe('orange');
    expect(underTest.playerHands.get('Marcie').color).toBe('red');
    expect(underTest.playerHands.get('Elly').color).toBe('black');
});

test('skip place settlement step if player has been added', () => {
    // given
    underTest.playerHands.set('Hagai', new PlayerHand('Hagai', 'blue'));
    let step = 'Hagai placed a settlement_blue';

    // when
    underTest.placeSettlementOnSetup([step]);

    // then
    expect(underTest.playerHands.size).toBe(1);
    expect(underTest.playerHands.get('Hagai').color).toBe('blue');
});

test('players are arranged by their order based on given last player name', () => {
    // given
    setup4Players();
    let step = 'Hagai received starting resources:  wool wool ore ';

    // when
    underTest.takeStartingResources([step]);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);
    expect(underTest.orderedPlayerHands[0].name).toBe('Marcie');
    expect(underTest.orderedPlayerHands[1].name).toBe('Hagai');
    expect(underTest.orderedPlayerHands[2].name).toBe('Schwab');
    expect(underTest.orderedPlayerHands[3].name).toBe('Elly');
});

test('players are arranged by their order based on given last player name (2)', () => {
    // given
    underTest.lastPlayerName = 'Elly';
    let step1 = 'Schwab placed a settlement_orange';
    let step2 = 'Elly placed a settlement_black';
    let step3 = 'Marcie placed a settlement_red';
    let step4 = 'Hagai placed a settlement_blue';
    underTest.placeSettlementOnSetup([step1]);
    underTest.placeSettlementOnSetup([step2]);
    underTest.placeSettlementOnSetup([step3]);
    underTest.placeSettlementOnSetup([step4]);
    let step = 'Hagai received starting resources:  wool wool ore ';

    // when
    underTest.takeStartingResources([step]);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);
    expect(underTest.orderedPlayerHands[0].name).toBe('Marcie');
    expect(underTest.orderedPlayerHands[1].name).toBe('Hagai');
    expect(underTest.orderedPlayerHands[2].name).toBe('Schwab');
    expect(underTest.orderedPlayerHands[3].name).toBe('Elly');
});

test('players are arranged by their order based on given last player name (5 players)', () => {
    // given
    underTest.lastPlayerName = 'Elly';
    let step1 = 'Schwab placed a settlement_orange';
    let step2 = 'Elly placed a settlement_black';
    let step3 = 'Marcie placed a settlement_red';
    let step4 = 'Hagai placed a settlement_blue';
    let step5 = 'Dichy placed a settlement_green';
    underTest.placeSettlementOnSetup([step1]);
    underTest.placeSettlementOnSetup([step2]);
    underTest.placeSettlementOnSetup([step3]);
    underTest.placeSettlementOnSetup([step4]);
    underTest.placeSettlementOnSetup([step5]);
    let step = 'Hagai received starting resources:  wool wool ore ';

    // when
    underTest.takeStartingResources([step]);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(5);
    expect(underTest.orderedPlayerHands[0].name).toBe('Marcie');
    expect(underTest.orderedPlayerHands[1].name).toBe('Hagai');
    expect(underTest.orderedPlayerHands[2].name).toBe('Dichy');
    expect(underTest.orderedPlayerHands[3].name).toBe('Schwab');
    expect(underTest.orderedPlayerHands[4].name).toBe('Elly');
});

test('player can take starting resources', () => {
    // given
    underTest.playerHands.set('Hagai', new PlayerHand('Hagai', 'blue'));
    let step = 'Hagai received starting resources:  wool wool ore ';

    // when
    underTest.takeStartingResources([step]);

    // then
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(3);
    expect(underTest.playerHands.get('Hagai').wool.count).toBe(2);
    expect(underTest.playerHands.get('Hagai').ore.count).toBe(1);
    expect(underTest.bank.wool.count).toBe(17);
    expect(underTest.bank.ore.count).toBe(18);
});

test('players can take resource gained from one dice rolling', () => {
    // given
    setup4Players();
    let steps = [
        'Elly got: grain ',
        'Marcie got: grain ',
        'Hagai got: ore',
        'Schwab rolled: 6 3',
        'Elly got: brick ',
        'Hagai got: ore ',
        'Schwab got: ore'
    ];

    // when
    underTest.takeResources(steps);

    // then
    expect(underTest.playerHands.get('Elly').totalResources).toBe(1);
    expect(underTest.playerHands.get('Elly').grain.count).toBe(1);
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(1);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(1);
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(1);
    expect(underTest.playerHands.get('Hagai').ore.count).toBe(1);
    expect(underTest.playerHands.get('Schwab').totalResources).toBe(0);
    expect(underTest.bank.grain.count).toBe(17);
    expect(underTest.bank.ore.count).toBe(18);
});

test('no player get any resources if two or more players over-produced a certain resource type', () => {
    // given
    setup4Players();
    let steps = [
        'Elly got: grain grain grain',
        'Marcie got: grain ore',
        'Hagai got: ore',
        'Schwab rolled: 6 3',
        'Elly got: brick ',
        'Hagai got: ore ',
        'Schwab got: ore'
    ];
    underTest.bank.grain.count = 2;

    // when
    underTest.takeResources(steps);

    // then
    expect(underTest.playerHands.get('Elly').totalResources).toBe(0);
    expect(underTest.playerHands.get('Elly').grain.count).toBe(0);
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(1);
    expect(underTest.playerHands.get('Marcie').ore.count).toBe(1);
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(1);
    expect(underTest.playerHands.get('Hagai').ore.count).toBe(1);
    expect(underTest.playerHands.get('Schwab').totalResources).toBe(0);
    expect(underTest.bank.grain.count).toBe(2);
    expect(underTest.bank.ore.count).toBe(17);
});

test('a player get all remaining resources of certain type if only he can take it and he over-produces it', () => {
    // given
    setup4Players();
    let steps = [
        'Elly got: grain grain grain',
        'Marcie got: ore',
        'Hagai got: ore',
        'Schwab rolled: 6 3',
        'Elly got: brick ',
        'Hagai got: ore ',
        'Schwab got: ore'
    ];
    underTest.bank.grain.count = 2;

    // when
    underTest.takeResources(steps);

    // then
    expect(underTest.playerHands.get('Elly').totalResources).toBe(2);
    expect(underTest.playerHands.get('Elly').grain.count).toBe(2);
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(1);
    expect(underTest.playerHands.get('Marcie').ore.count).toBe(1);
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(1);
    expect(underTest.playerHands.get('Hagai').ore.count).toBe(1);
    expect(underTest.playerHands.get('Schwab').totalResources).toBe(0);
    expect(underTest.bank.grain.count).toBe(0);
    expect(underTest.bank.ore.count).toBe(17);
});

test('player can build settlement', () => {
    // given
    setup4Players();
    let step = 'Marcie built a settlement_red';

    // when
    underTest.buildSettlement([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-4);
    expect(underTest.playerHands.get('Marcie').lumber.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').wool.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(-1);
    expect(underTest.bank.lumber.count).toBe(20);
    expect(underTest.bank.brick.count).toBe(20);
    expect(underTest.bank.wool.count).toBe(20);
    expect(underTest.bank.grain.count).toBe(20);
});

test('player can build road', () => {
    // given
    setup4Players();
    let step = 'Marcie built a road_red';

    // when
    underTest.buildRoad([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-2);
    expect(underTest.playerHands.get('Marcie').lumber.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(-1);
    expect(underTest.bank.lumber.count).toBe(20);
    expect(underTest.bank.brick.count).toBe(20);
});

test('player can build city', () => {
    // given
    setup4Players();
    let step = 'Marcie built a city_red';

    // when
    underTest.buildCity([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-5);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(-2);
    expect(underTest.playerHands.get('Marcie').ore.count).toBe(-3);
    expect(underTest.bank.grain.count).toBe(21);
    expect(underTest.bank.ore.count).toBe(22);
});

test('player can buy dev card', () => {
    // given
    setup4Players();
    let step = 'Marcie bought devcard';

    // when
    underTest.buyDevCard([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-3);
    expect(underTest.playerHands.get('Marcie').wool.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(-1);
    expect(underTest.playerHands.get('Marcie').ore.count).toBe(-1);
    expect(underTest.bank.wool.count).toBe(20);
    expect(underTest.bank.grain.count).toBe(20);
    expect(underTest.bank.ore.count).toBe(20);
});

test('player can trade with another', () => {
    // given
    setup4Players();
    let step = 'Marcie traded:  wool wool for:  grain  with: Elly';

    // when
    underTest.tradeWithPlayer([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-1);
    expect(underTest.playerHands.get('Marcie').wool.count).toBe(-2);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(1);
    expect(underTest.playerHands.get('Elly').totalResources).toBe(1);
    expect(underTest.playerHands.get('Elly').wool.count).toBe(2);
    expect(underTest.playerHands.get('Elly').grain.count).toBe(-1);
});

test('player can trade with bank', () => {
    // given
    setup4Players();
    let step = 'Marcie gave bank:   grain grain grain grain  and took   brick';

    // when
    underTest.tradeWithBank([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(-3);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(1);
    expect(underTest.playerHands.get('Marcie').grain.count).toBe(-4);
    expect(underTest.bank.brick.count).toBe(18);
    expect(underTest.bank.grain.count).toBe(23);
});

test('player can steal from another', () => {
    // given
    setup4Players();
    underTest.playerHands.get('Hagai').addResources(1, 2, 3, 4, 0);
    let step = 'Marcie stole myth from: Hagai';

    // when
    underTest.stealResource([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(1);
    expect(underTest.playerHands.get('Marcie').stole.length).toBe(1);
    let stolenCard = underTest.playerHands.get('Marcie').stole[0];
    expect(stolenCard.possibleResources.length).toBe(4);
    expect(stolenCard.possibleResources[0].name).toBe('lumber');
    expect(stolenCard.possibleResources[0].count).toBe(1);
    expect(stolenCard.possibleResources[1].name).toBe('brick');
    expect(stolenCard.possibleResources[1].count).toBe(2);
    expect(stolenCard.possibleResources[2].name).toBe('wool');
    expect(stolenCard.possibleResources[2].count).toBe(3);
    expect(stolenCard.possibleResources[3].name).toBe('grain');
    expect(stolenCard.possibleResources[3].count).toBe(4);
    expect(stolenCard.totalResourceBeforeStolen).toBe(10);
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(9);
    expect(underTest.playerHands.get('Hagai').stolen.length).toBe(1);
    expect(underTest.playerHands.get('Hagai').stolen[0]).toBe(stolenCard);
});

test('player can steal from your player', () => {
    // given
    setup4Players();
    underTest.playerHands.get('Elly').addResources(0, 1, 0, 0, 0);
    let step = 'Marcie stole: brick from you';

    // when
    underTest.stealResource([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(1);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(1);
    expect(underTest.playerHands.get('Marcie').stole.length).toBe(0);
    expect(underTest.playerHands.get('Elly').totalResources).toBe(0);
    expect(underTest.playerHands.get('Elly').brick.count).toBe(0);
    expect(underTest.playerHands.get('Elly').stolen.length).toBe(0);
});

test('your player can steal from another player', () => {
    // given
    setup4Players();
    underTest.playerHands.get('Marcie').addResources(0, 1, 0, 0, 0);
    let step = 'You stole: brick from: Marcie';

    // when
    underTest.stealResource([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(0);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(0);
    expect(underTest.playerHands.get('Marcie').stole.length).toBe(0);
    expect(underTest.playerHands.get('Elly').totalResources).toBe(1);
    expect(underTest.playerHands.get('Elly').brick.count).toBe(1);
    expect(underTest.playerHands.get('Elly').stolen.length).toBe(0);
});

test('player discards resource on rolling 7', () => {
    // given
    setup4Players();
    underTest.playerHands.get('Marcie').addResources(3, 1, 2, 4, 5);
    let step = 'Marcie discarded: lumber wool lumber lumber';

    // when
    underTest.discardResources([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(11);
    expect(underTest.playerHands.get('Marcie').lumber.count).toBe(0);
    expect(underTest.playerHands.get('Marcie').wool.count).toBe(1);
    expect(underTest.bank.lumber.count).toBe(22);
    expect(underTest.bank.wool.count).toBe(20);
});

test('player can use Year of Plenty and take 2 resources from bank', () => {
    // given
    setup4Players();
    let step = 'Marcie took from bank: brick  wool ';

    // when
    underTest.takeResourcesWithYearOfPlenty([step]);

    // then
    expect(underTest.playerHands.get('Marcie').totalResources).toBe(2);
    expect(underTest.playerHands.get('Marcie').brick.count).toBe(1);
    expect(underTest.playerHands.get('Marcie').wool.count).toBe(1);
    expect(underTest.bank.brick.count).toBe(18);
    expect(underTest.bank.wool.count).toBe(18);
});

test('integration test: can calculate given all game steps', () => {
    // given
    underTest.lastPlayerName = 'Elly';
    let step1 = 'Hagai placed a settlement_blue';
    let step2 = 'Schwab placed a settlement_orange';
    let step3 = 'Elly placed a settlement_black';
    let step4 = 'Marcie placed a settlement_red';
    let step5 = 'Marcie placed a road_red';
    let step6 = 'Hagai received starting resources:  wool wool ore ';

    // when
    underTest.calculate([step1, step2, step3, step4, step5, step6]);
    
    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);
    expect(underTest.orderedPlayerHands[0].name).toBe('Marcie');
    expect(underTest.orderedPlayerHands[1].name).toBe('Hagai');
    expect(underTest.orderedPlayerHands[2].name).toBe('Schwab');
    expect(underTest.orderedPlayerHands[3].name).toBe('Elly');
    expect(underTest.playerHands.get('Hagai').totalResources).toBe(3);
    expect(underTest.playerHands.get('Hagai').wool.count).toBe(2);
    expect(underTest.playerHands.get('Hagai').ore.count).toBe(1);
});

function setup4Players() {
    underTest.lastPlayerName = 'Elly';
    let steps = [
        'Hagai placed a settlement_blue',
        'Schwab placed a settlement_orange',
        'Elly placed a settlement_black',
        'Marcie placed a settlement_red',
        'Marcie received starting resources: '
    ];
    underTest.calculate(steps);
}
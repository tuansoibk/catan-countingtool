import { beforeEach, expect, test } from "@jest/globals";
import { PlayerHand } from "./player";

let underTest;

beforeEach(() => {
    underTest = new PlayerHand('test');
});

test('can add resources with specific amount', () => {
    // when
    underTest.addResources(1, 2, 3, 4, 5);

    // then
    expect(underTest.lumber.count).toBe(1);
    expect(underTest.brick.count).toBe(2);
    expect(underTest.wool.count).toBe(3);
    expect(underTest.grain.count).toBe(4);
    expect(underTest.ore.count).toBe(5);
    expect(underTest.totalResources).toBe(15);
});

test('can add resources from text', () => {
    // when
    underTest.addResourcesFromText('lumber brick brick wool wool wool grain grain grain grain ore ore ore ore ore');

    // then
    expect(underTest.lumber.count).toBe(1);
    expect(underTest.brick.count).toBe(2);
    expect(underTest.wool.count).toBe(3);
    expect(underTest.grain.count).toBe(4);
    expect(underTest.ore.count).toBe(5);
    expect(underTest.totalResources).toBe(15);
});

test('can remove resources with specific amount', () => {
    // when
    underTest.removeResources(1, 2, 3, 4, 5);

    // then
    expect(underTest.lumber.count).toBe(-1);
    expect(underTest.brick.count).toBe(-2);
    expect(underTest.wool.count).toBe(-3);
    expect(underTest.grain.count).toBe(-4);
    expect(underTest.ore.count).toBe(-5);
    expect(underTest.totalResources).toBe(-15);
});

test('can remove resources from text', () => {
    // when
    underTest.removeResourcesFromText('lumber brick brick wool wool wool grain grain grain grain ore ore ore ore ore');

    // then
    expect(underTest.lumber.count).toBe(-1);
    expect(underTest.brick.count).toBe(-2);
    expect(underTest.wool.count).toBe(-3);
    expect(underTest.grain.count).toBe(-4);
    expect(underTest.ore.count).toBe(-5);
    expect(underTest.totalResources).toBe(-15);
});

test('can stole from another', () => {
    // given
    let anotherPlayer = new PlayerHand('another');
    anotherPlayer.addResources(1, 2, 3, 4, 5);

    // when
    underTest.stealResource(anotherPlayer, '1234');

    // then
    expect(underTest.stealing.length).toBe(1);
    expect(underTest.totalResources).toBe(1);
    expect(anotherPlayer.stolen.length).toBe(1);
    expect(anotherPlayer.totalResources).toBe(14);
    let stolenCard = underTest.stealing[0];
    expect(stolenCard.totalResourceBeforeStolen).toBe(15);
    expect(stolenCard.possibleResources[0].count).toBe(1);
    expect(stolenCard.possibleResources[1].count).toBe(2);
    expect(stolenCard.possibleResources[2].count).toBe(3);
    expect(stolenCard.possibleResources[3].count).toBe(4);
    expect(stolenCard.possibleResources[4].count).toBe(5);
});
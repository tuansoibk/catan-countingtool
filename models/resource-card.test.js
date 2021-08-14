import { expect, test } from "@jest/globals";
import { ResourceCard } from "./resource-card";

let underTest;

beforeEach(() => {
    underTest = ResourceCard.lumber(0);
});

test('can add', () => {
    // when
    underTest.add(1);
    underTest.add(2);

    // then
    expect(underTest.count).toBe(3);
});

test('can remove', () => {
    // when
    underTest.remove(1);
    underTest.remove(2);

    // then
    expect(underTest.count).toBe(-3);
});

test('can add with resources from text', () => {
    // when
    underTest.addFromText('ore ore lumber wool');
    underTest.addFromText('lumber brick lumber');

    // then
    expect(underTest.count).toBe(3);
});

test('can remove with resources from text', () => {
    // when
    underTest.removeFromText('ore ore lumber wool');
    underTest.removeFromText('lumber brick lumber');

    // then
    expect(underTest.count).toBe(-3);
});
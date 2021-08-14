import { expect } from "@jest/globals";
import { ResourceCard } from "./resource-card";
import { StolenCard } from "./stolen-card";

test('can store stolen card info', () => {
    // given
    let resources = [ResourceCard.lumber(2), ResourceCard.ore(2)];
    
    // when
    let underTest = new StolenCard('1234', resources); 

    // then
    expect(underTest.totalResourceBeforeStolen).toBe(4);
});
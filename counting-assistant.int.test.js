import { beforeEach, expect, test } from "@jest/globals";
import { CountingAssistant } from "./counting-assistant";

const fs = require('fs');
let underTest;

beforeEach(() => {
    fs.writeFileSync('./logs/testlog.txt', '');
    console.log = function(message) {
        fs.appendFileSync('./logs/testlog.txt', message + '\n');
    };
    underTest = new CountingAssistant();
});

test('should be able to calculate using game steps from logs 01', () => {
    // given
    var steps = fs.readFileSync('./testdata/testdata_01.txt').toString('utf-8').split('\n');
    underTest.lastPlayerName = 'Elly';
    
    // when
    underTest.calculate(steps);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);

    const player1 = underTest.orderedPlayerHands[0];
    expect(player1.name).toBe('Bradly');
    const player2 = underTest.orderedPlayerHands[1];
    expect(player2.name).toBe('Sam');
    const player3 = underTest.orderedPlayerHands[2];
    expect(player3.name).toBe('Dew');
    const player4 = underTest.orderedPlayerHands[3];
    expect(player4.name).toBe('Elly');
    expect(underTest.bank.lumber.count).toBe(14);
    expect(underTest.bank.brick.count).toBe(19);
    expect(underTest.bank.wool.count).toBe(11);
    expect(underTest.bank.grain.count).toBe(16);
    expect(underTest.bank.ore.count).toBe(14);
    expect(underTest.bank.totalResources).toBe(74);
});

test('should be able to calculate using game steps from logs 02', () => {
    // given
    var steps = fs.readFileSync('./testdata/testdata_02.txt').toString('utf-8').split('\n');
    underTest.lastPlayerName = 'Elly';
    
    // when
    underTest.calculate(steps);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);

    const player1 = underTest.orderedPlayerHands[0];
    expect(player1.name).toBe('Bradly');
    const player2 = underTest.orderedPlayerHands[1];
    expect(player2.name).toBe('Sam');
    const player3 = underTest.orderedPlayerHands[2];
    expect(player3.name).toBe('Dew');
    const player4 = underTest.orderedPlayerHands[3];
    expect(player4.name).toBe('Elly');
    expect(underTest.bank.lumber.count).toBe(14);
    expect(underTest.bank.brick.count).toBe(8);
    expect(underTest.bank.wool.count).toBe(16);
    expect(underTest.bank.grain.count).toBe(13);
    expect(underTest.bank.ore.count).toBe(13);
    expect(underTest.bank.totalResources).toBe(64);
});

test('should be able to calculate given a username contains special character or number 01', () => {
    // given
    var steps = fs.readFileSync('./testdata/testdata_strange_name_01.txt').toString('utf-8').split('\n');
    underTest.lastPlayerName = 'Elly';
    
    // when
    underTest.calculate(steps);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);

    const player1 = underTest.orderedPlayerHands[0];
    expect(player1.name).toBe('kra7os');
    const player2 = underTest.orderedPlayerHands[1];
    expect(player2.name).toBe('daflame94');
    const player3 = underTest.orderedPlayerHands[2];
    expect(player3.name).toBe('Jorge#5032');
    const player4 = underTest.orderedPlayerHands[3];
    expect(player4.name).toBe('Elly');
    expect(underTest.bank.lumber.count).toBeLessThan(19);
    expect(underTest.bank.brick.count).toBeLessThan(19);
    expect(underTest.bank.wool.count).toBeLessThan(19);
    expect(underTest.bank.grain.count).toBeLessThan(19);
    expect(underTest.bank.ore.count).toBeLessThan(19);
});

test('should be able to calculate given a username contains special character or number 02', () => {
    // given
    var steps = fs.readFileSync('./testdata/testdata_strange_name_02.txt').toString('utf-8').split('\n');
    underTest.lastPlayerName = 'Elly';
    
    // when
    underTest.calculate(steps);

    // then
    expect(underTest.orderedPlayerHands.length).toBe(4);

    const player1 = underTest.orderedPlayerHands[0];
    expect(player1.name).toBe('Lorena7300');
    const player2 = underTest.orderedPlayerHands[1];
    expect(player2.name).toBe('Guatemala');
    const player3 = underTest.orderedPlayerHands[2];
    expect(player3.name).toBe('ElClauPower');
    const player4 = underTest.orderedPlayerHands[3];
    expect(player4.name).toBe('Elly');
    expect(underTest.bank.lumber.count).toBeLessThan(19);
    expect(underTest.bank.brick.count).toBeLessThan(19);
    expect(underTest.bank.wool.count).toBeLessThan(19);
    expect(underTest.bank.grain.count).toBeLessThan(19);
    expect(underTest.bank.ore.count).toBeLessThan(19);
});
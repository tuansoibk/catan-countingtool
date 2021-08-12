import { DevCardDeck, Player } from './model.js';

const SETTLEMENT_COST = 'lumber brick wool grain';
const ROAD_COST = 'lumber brick';
const CITY_COST = 'grain grain ore ore ore';
const DEV_CARD_COST = 'wool grain ore';
const MAX_RESOURCE_COUNT = 19;
let myPlayerName = 'player';
let player1 = undefined;
let player2 = undefined;
let player3 = undefined;
let player4 = undefined;
let bank = undefined;
let players = undefined;
let devCards = undefined;

function init() {
    player1 = new Player('Player1');
    player2 = new Player('Player2');
    player3 = new Player('Player3');
    player4 = new Player('Player4');
    bank = new Player('Bank');
    bank.modifyResource(19, 19, 19, 19, 19, 0);
    players = new Map();
    devCards = new DevCardDeck();

    chrome.storage.local.set({ 'player1': player1 });
    chrome.storage.local.set({ 'player2': player2 });
    chrome.storage.local.set({ 'player3': player3 });
    chrome.storage.local.set({ 'bank': bank });
    chrome.storage.local.set({ 'devCards' : devCards });
    chrome.storage.local.set({ 'messageHashes': [] });
    chrome.storage.sync.get(['myPlayerName'], (result) => {
        myPlayerName = result.myPlayerName;
    });
    console.log('Game model initiated');
}

chrome.runtime.onInstalled.addListener(() => {
    init();
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            'from a content script:' + sender.tab.url :
            'from the extension');
        console.log('request = ' + request);
        if (request.message === 'reinit') {
            init();
            sendResponse({ result: 'success' });
        }
        else if (request.message === 'new steps') {
            consumeNewSteps();
            sendResponse({ result: 'success' });
        }
        else {
            sendResponse({ result: 'unknown message: ' + request.message });
        }

        return true;
    }
);

function consumeNewSteps() {
    console.log('consume new steps');
    chrome.storage.local.get(['newSteps'], (result) => {
        let newSteps = result.newSteps;
        for (let i = 0; i < newSteps.length; i++) {
            let step = newSteps[i];
            console.log(step);
            consumeStep(step);
            debugPlayers();
        }
        demystifyResourceCards();
        debugPlayers();

        // update counting
        chrome.storage.local.set(
            {
                'player1': player1,
                'player2': player2,
                'player3': player3,
                'bank': bank,
                'devCards': devCards
            },
            function () {
                chrome.runtime.sendMessage(
                    {
                        message: 'counting update'
                    },
                    function (response) {
                        console.log('counting update response = ' + response.result);
                    }
                );
            }
        );
    });
}

function consumeStep(step) {
    let match = /(\w+)\s*?placed a settlement_(\S+)/.exec(step);
    if (match != null && players.size < 4) {
        consumeNewPlayer(match);
        return;
    }
    
    match = /(\w+)\s*?received starting resources/.exec(step);
    if (match != null) {
        consumeResources(match, step);
        return;
    }

    match = /(\w+)\s*?got:/.exec(step);
    if (match != null) {
        consumeResources(match, step);
        return;
    }

    match = /(\w+)\s*?built a settlement/.exec(step);
    if (match != null) {
        consumeSettlement(match);
        return;
    }
    match = /(\w+)\s*?built a road/.exec(step);
    if (match != null) {
        consumeRoad(match);
        return;
    }
    match = /(\w+)\s*?built a city/.exec(step);
    if (match != null) {
        consumeCity(match);
        return;
    }

    match = /(\w+)\s*?bought devcard/.exec(step);
    if (match != null) {
        consumeDevCard(match);
        return;
    }

    match = /(\w+)\s*?traded:\s*?(.+)\s*?for:\s*?(.+)\s*?with:\s*?(\w+)/.exec(step);
    if (match != null) {
        consumeTrade(match);
        return;
    }

    match = /(\w+)\s*?gave bank:\s*?(.+)\s*?and took\s*?(.+)/.exec(step);
    if (match != null) {
        consumeBankTrade(match);
        return;
    }

    match = /(\w+)\s*?stole.*?(lumber|brick|wool|grain|ore|myth)\s*?from:*\s*?(\w+)/.exec(step);
    if (match != null) {
        consumeRobbery(match);
        return;
    }

    match = /(\w+)\s*?discarded:/.exec(step);
    if (match != null) {
        consumeDiscardedResources(match, step);
        return;
    }

    match = /(\w+)\s*?took from bank:\s*?(.+)/.exec(step);
    if (match != null) {
        consumeYearOfPlenty(match);
        return;
    }

    match = /(\w+)\s*?stole (\d+): (lumber|brick|wool|grain|ore)/.exec(step);
    if (match != null) {
        consumeMonopoly(match);
        return;
    }

    match = /(\w+)\s*?used\s*?(Knight|Road Building|Year of Plenty|Monopoly)/.exec(step);
    if (match != null) {
        consumeUsedDevCard(match);
        return;
    }
}

function debugPlayers() {
    console.log(JSON.stringify(player1));
    console.log(JSON.stringify(player2));
    console.log(JSON.stringify(player3));
    console.log(JSON.stringify(player4));
    console.log(JSON.stringify(bank));
}

function consumeNewPlayer(match) {
    console.log('new player: ' + match[1] + ', color: ' + match[2]);
    switch (players.size) {
        case 0:
            player1.name = match[1];
            player1.color = match[2];
            players.set(player1.name, player1);
            break;
        case 1:
            player2.name = match[1];
            player2.color = match[2];
            players.set(player2.name, player2);
            break;
        case 2:
            player3.name = match[1];
            player3.color = match[2];
            players.set(player3.name, player3);
            break;
        case 3:
            player4.name = match[1];
            player4.color = match[2];
            players.set(player4.name, player4);
            rearrangePlayers();
            break;
    }
}

function rearrangePlayers() {
    let temp1 = player1;
    let temp2 = player2;
    let temp3 = player3;
    let temp4 = player4;
    if (player1.name === myPlayerName) {
        temp1 = player2;
        temp2 = player3;
        temp3 = player4;
        temp4 = player1;
    }
    else if (player2.name === myPlayerName) {
        temp1 = player3;
        temp2 = player4;
        temp3 = player1;
        temp4 = player2;
    }
    else if (player3.name === myPlayerName) {
        temp1 = player4;
        temp2 = player1;
        temp3 = player2;
        temp4 = player3;
    }
    // else: player4 --> my player --> do nothing
    player1 = temp1;
    player2 = temp2;
    player3 = temp3;
    player4 = temp4;
    players.set(player1.name, player1);
    players.set(player2.name, player2);
    players.set(player3.name, player3);
    players.set(player4.name, player4);
}

function consumeResources(match, step) {
    addResources(players.get(match[1]), step);
    removeResources(bank, step);
}

function consumeSettlement(match) {
    removeResources(players.get(match[1]), SETTLEMENT_COST);
    addResources(bank, SETTLEMENT_COST);
}

function consumeRoad(match) {
    removeResources(players.get(match[1]), ROAD_COST);
    addResources(bank, ROAD_COST);
}

function consumeCity(match) {
    removeResources(players.get(match[1]), CITY_COST);
    addResources(bank, CITY_COST);
}

function consumeDevCard(match) {
    removeResources(players.get(match[1]), DEV_CARD_COST);
    addResources(bank, DEV_CARD_COST);
    devCards.remainingCards--;
}

function consumeTrade(match) {
    removeResources(players.get(match[1]), match[2]);
    addResources(players.get(match[1]), match[3]);
    removeResources(players.get(match[4]), match[3]);
    addResources(players.get(match[4]), match[2]);
}

function consumeBankTrade(match) {
    removeResources(players.get(match[1]), match[2]);
    addResources(players.get(match[1]), match[3]);
    removeResources(bank, match[3]);
    addResources(bank, match[2]);
}

function removeResources(player, step) {
    let [lumber, brick, wool, grain, ore] = getResourceCounts(step);
    player.modifyResource(-lumber, -brick, -wool, -grain, -ore, 0);
}

function addResources(player, step) {
    let [lumber, brick, wool, grain, ore] = getResourceCounts(step);
    player.modifyResource(lumber, brick, wool, grain, ore, 0);
}

function consumeRobbery(match) {
    if (match[1] === 'You') {
        addResources(player4, match[2]);
        removeResources(players.get(match[3]), match[2]);
    }
    else if (match[3] === 'you') {
        removeResources(player4, match[2]);
        addResources(players.get(match[1]), match[2]);
    }
    else {
        players.get(match[1]).modifyResource(0, 0, 0, 0, 0, 1);
        players.get(match[3]).modifyResource(0, 0, 0, 0, 0, -1);
    }
}

function consumeDiscardedResources(match, step) {
    removeResources(players.get(match[1]), step);
    addResources(bank, step);
}

function consumeYearOfPlenty(match) {
    addResources(players.get(match[1]), match[2]);
    removeResources(bank, match[2]);
}

function consumeMonopoly(match) {
    let lumber = 0, brick = 0, wool = 0, grain = 0, ore = 0;
    let count = 1 * match[2];
    switch(match[3]) {
        case 'lumber':
            lumber = count;
            players.forEach((player) => {
                if (player.name !== match[1]) {
                    player.modifyResource(-player.lumber, 0, 0, 0, 0, 0);
                }
            });
            break;
        case 'brick':
            brick = count;
            players.forEach((player) => {
                if (player.name !== match[1]) {
                    player.modifyResource(0, -player.brick, 0, 0, 0, 0);
                }
            });
            break;
        case 'wool':
            wool = count;
            players.forEach((player) => {
                if (player.name !== match[1]) {
                    player.modifyResource(0, 0, -player.wool, 0, 0, 0);
                }
            });
            break;
        case 'grain':
            grain = count;
            players.forEach((player) => {
                if (player.name !== match[1]) {
                    player.modifyResource(0, 0, 0, -player.grain, 0, 0);
                }
            });
            break;
        case 'ore':
            ore = count;
            players.forEach((player) => {
                if (player.name !== match[1]) {
                    player.modifyResource(0, 0, 0, 0, -player.ore, 0);
                }
            });
            break;
    }
    players.get(match[1]).modifyResource(lumber, brick, wool, grain, ore, 0);
}

function consumeUsedDevCard(match) {
    switch (match[2]) {
        case 'Knight':
            devCards.knight--;
            break;
        case 'Road Building':
            devCards.roadBuilding--;
            break;
        case 'Year of Plenty':
            devCards.yearOfPlenty--;
            break;
        case 'Monopoly':
            devCards.monopoly--;
            break;
    }
}

function getResourceCounts(step) {
    let resources = [...step.matchAll(/lumber|brick|wool|grain|ore/g)];
    let lumber = 0, brick = 0, wool = 0, grain = 0, ore = 0;
    for (let i = 0; i < resources.length; i++) {
        switch(resources[i][0]) {
            case 'lumber':
                lumber++;
                break;
            case 'brick':
                brick++;
                break;
            case 'wool':
                wool++;
                break;
            case 'grain':
                grain++;
                break;
            case 'ore':
                ore++;
                break;
        }
    }

    return [lumber, brick, wool, grain, ore];
}

function demystifyResourceCards() {
    if (bank.lumber === MAX_RESOURCE_COUNT) {
        player1.modifyResource(-player1.lumber, 0, 0, 0, 0, player1.lumber);
        player2.modifyResource(-player2.lumber, 0, 0, 0, 0, player2.lumber);
        player3.modifyResource(-player3.lumber, 0, 0, 0, 0, player3.lumber);
        player4.modifyResource(-player4.lumber, 0, 0, 0, 0, player4.lumber);
    }
    if (bank.brick === MAX_RESOURCE_COUNT) {
        player1.modifyResource(0, -player1.brick, 0, 0, 0, player1.brick);
        player2.modifyResource(0, -player2.brick, 0, 0, 0, player2.brick);
        player3.modifyResource(0, -player3.brick, 0, 0, 0, player3.brick);
        player4.modifyResource(0, -player4.brick, 0, 0, 0, player4.brick);
    }
    if (bank.wool === MAX_RESOURCE_COUNT) {
        player1.modifyResource(0, 0, -player1.wool, 0, 0, player1.wool);
        player2.modifyResource(0, 0, -player2.wool, 0, 0, player2.wool);
        player3.modifyResource(0, 0, -player3.wool, 0, 0, player3.wool);
        player4.modifyResource(0, 0, -player4.wool, 0, 0, player4.wool);
    }
    if (bank.grain === MAX_RESOURCE_COUNT) {
        player1.modifyResource(0, 0, 0, -player1.grain, 0, player1.grain);
        player2.modifyResource(0, 0, 0, -player2.grain, 0, player2.grain);
        player3.modifyResource(0, 0, 0, -player3.grain, 0, player3.grain);
        player4.modifyResource(0, 0, 0, -player4.grain, 0, player4.grain);
    }
    if (bank.ore === MAX_RESOURCE_COUNT) {
        player1.modifyResource(0, 0, 0, 0, -player1.ore, player1.ore);
        player2.modifyResource(0, 0, 0, 0, -player2.ore, player2.ore);
        player3.modifyResource(0, 0, 0, 0, -player3.ore, player3.ore);
        player4.modifyResource(0, 0, 0, 0, -player4.ore, player4.ore);
    }
}
import { CountingAssistant } from './counting-assistant.js';
import { PlayerHand } from './models/player.js';

let myPlayerName = 'player';
let countingAssistant;

function init() {
    countingAssistant = new CountingAssistant();
    chrome.storage.local.set({ 'player1': new PlayerHand('Player1', 'black') });
    chrome.storage.local.set({ 'player2': new PlayerHand('Player2', 'black') });
    chrome.storage.local.set({ 'player3': new PlayerHand('Player3', 'black') });
    chrome.storage.local.set({ 'player4': new PlayerHand('Player4', 'black') });
    chrome.storage.local.set({ 'bank': countingAssistant.bank });
    chrome.storage.local.set({ 'devCards' : countingAssistant.devCards });
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
        if (request.message == 'reinit') {
            init();
            sendResponse({ result: 'success' });
        }
        else if (request.message == 'reload message completed') {
            reloadAllSteps();
            sendResponse({ result: 'success' });
        }
        else if (request.message == 'collect game logs completed') {
            printGameLogs();
            sendResponse({ result: 'success' });
        }
        else {
            sendResponse({ result: 'unknown message: ' + request.message });
        }

        return true;
    }
);

function reloadAllSteps() {
    console.log('reload all steps');
    chrome.storage.local.get(['allSteps', 'myPlayerName'], (result) => {
        let allSteps = result.allSteps;
        // reset and count from begining
        countingAssistant = new CountingAssistant();
        countingAssistant.lastPlayerName = result.myPlayerName;
        countingAssistant.calculate(allSteps);

        // update counting
        chrome.storage.local.set(
            {
                'player1': countingAssistant.orderedPlayerHands[0],
                'player2': countingAssistant.orderedPlayerHands[1],
                'player3': countingAssistant.orderedPlayerHands[2],
                'player4': countingAssistant.orderedPlayerHands[3],
                'bank': countingAssistant.bank,
                'devCards': countingAssistant.devCards,
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

function printGameLogs() {
    chrome.storage.local.get(['gameLogs'], (result) => {
        let gameLogs = result.gameLogs;
        console.clear();
        gameLogs.forEach(log => console.log(log));
    });
}
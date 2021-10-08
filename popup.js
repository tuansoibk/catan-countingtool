document.addEventListener("DOMContentLoaded", function (event) {
    reloadPlayerData();
    initEvents();
    chrome.storage.sync.get(['myPlayerName'], (result) => {
        document.getElementById('player-name').value = result.myPlayerName;
    });
});

function initEvents() {
    let reinit = document.getElementById('reinit');
    reinit.addEventListener('click', async () => {
        chrome.storage.sync.set({'myPlayerName': document.getElementById('player-name').value});
        chrome.runtime.sendMessage({
            message: 'reinit'
            },
            function (response) {
                console.log('reinit response = ' + response.result);
                if (response.result == 'success') {
                    reloadPlayerData();
                }
            }
        );
    });

    let reload = document.getElementById('reload');
    reload.addEventListener('click', async () => {
        document.getElementById('warning').style.display = 'none';
        chrome.storage.local.set({'myPlayerName': document.getElementById('player-name').value});
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: reloadPlaySteps,
        });
    });

    let gameLogs = document.getElementById('game-logs');
    gameLogs.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: collectGameLogs,
        });
    });

    let upVp = document.getElementById('up-vp');
    upVp.addEventListener('click', async () => {
        chrome.storage.local.get(['devCards'], (result) => {
            if (result.devCards.victoryPoint < 5) {
                result.devCards.victoryPoint++;
                chrome.storage.local.set({ 'devCards': result.devCards });
                document.getElementById('vp').textContent = result.devCards.victoryPoint; 
            }
        });
    });

    let downVp = document.getElementById('down-vp');
    downVp.addEventListener('click', async () => {
        chrome.storage.local.get(['devCards'], (result) => {
            if (result.devCards.victoryPoint > 0) {
                result.devCards.victoryPoint--;
                chrome.storage.local.set({ 'devCards': result.devCards });
                document.getElementById('vp').textContent = result.devCards.victoryPoint; 
            }
        });
    });
}

// The body of this function will be executed as a content script inside the
// current page
function reloadPlaySteps() {
    let messages = document.getElementById('game-log-text').getElementsByClassName('message_post');
    let steps = [];
    for (const message of messages) {
        // do some preprocessing with the game log message
        let newStep = message.innerHTML;
        newStep = newStep.replace(/^<img[^>]+>/, '');
        for (let j = 0; j < 20; j++) {
            newStep = newStep.replace(/<img[^>]*?card_(lumber|brick|wool|grain|ore)[^>]*?>/, '$1 ');
        }
        newStep = newStep.replace(/<img[^>]*?((settlement|road|city)_.*?)\.svg[^>]*?>/, '$1');
        newStep = newStep.replace(/<img[^>]*?(devcard)[^>]*?>/, '$1');
        newStep = newStep.replace(/<img[^>]*?(robber)[^>]*?>/, '');
        newStep = newStep.replace(/<img[^>]*?card_knight[^>]*?>/, '');
        newStep = newStep.replace(/<img[^>]*?card_roadbuilding[^>]*?>/, '');
        newStep = newStep.replace(/<img[^>]*?card_yearofplenty[^>]*?>/, '');
        newStep = newStep.replace(/<img[^>]*?card_monopoly[^>]*?>/, '');
        newStep = newStep.replace(/<img[^>]*?prob_(\d+)[^>]*?>/, '$1');
        newStep = newStep.replace(/<img[^>]*?card_rescardback[^>]*?>/, 'myth');
        // replace twice for two dice
        newStep = newStep.replace(/<img[^>]*?dice_(\d+)[^>]*?>/, '$1');
        newStep = newStep.replace(/<img[^>]*?dice_(\d+)[^>]*?>/, '$1');
        steps.push(newStep);
    }
    if (steps.length > 0) {
        chrome.storage.local.set({ 'allSteps': steps }, function () {
            chrome.runtime.sendMessage(
                {
                    message: 'reload message completed'
                },
                function (response) {
                    console.log('reload message completed response = ' + response.result);
                }
            );
        });
    }
}

function collectGameLogs() {
    let messages = document.getElementById('game-log-text').getElementsByClassName('message_post');
    let logs = [];
    for (const message of messages) {
        logs.push(message.innerHTML);
    }
    chrome.storage.local.set({ 'gameLogs': logs }, function () {
        chrome.runtime.sendMessage(
            {
                message: 'collect game logs completed'
            },
            function (response) {
                console.log('collect game logs completed response = ' + response.result);
            }
        );
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            'from a content script:' + sender.tab.url :
            'from the extension');
        console.log('request = ' + request);
        if (request.message === 'counting update') {
            reloadPlayerData();
        }
        else if (request.messages === 'fetch data failed') {
            document.getElementById('warning').style.display = 'block';
            document.getElementById('warning').textContent = 'Failed to fetch data from local storage, click \'Init\' then click \'Reload\' to fix this';
        }
        sendResponse({ result: 'success' });

        return true;
    }
);

function reloadPlayerData() {
    chrome.storage.local.get(['player1', 'player2', 'player3', 'bank', 'devCards' ], (result) => {
        //alert('reload player data: ' + result.player1.brick.count);
        // player 1
        let titlePlayer1Ele = document.getElementById('title-player-1');
        titlePlayer1Ele.innerText = result.player1.name;
        titlePlayer1Ele.style.color = result.player1.color;
        document.getElementById('lumber-1').textContent = result.player1.lumber.count;
        document.getElementById('brick-1').textContent = result.player1.brick.count;
        document.getElementById('wool-1').textContent = result.player1.wool.count;
        document.getElementById('grain-1').textContent = result.player1.grain.count;
        document.getElementById('ore-1').textContent = result.player1.ore.count;
        document.getElementById('stealing-1').textContent = result.player1.stealing.length;
        document.getElementById('stolen-1').textContent = -result.player1.stolen.length;
        document.getElementById('total-1').textContent = result.player1.totalResources;

        // player 2
        let titlePlayer2Ele = document.getElementById('title-player-2');
        titlePlayer2Ele.innerText = result.player2.name;
        titlePlayer2Ele.style.color = result.player2.color;
        document.getElementById('lumber-2').textContent = result.player2.lumber.count;
        document.getElementById('brick-2').textContent = result.player2.brick.count;
        document.getElementById('wool-2').textContent = result.player2.wool.count;
        document.getElementById('grain-2').textContent = result.player2.grain.count;
        document.getElementById('ore-2').textContent = result.player2.ore.count;
        document.getElementById('stealing-2').textContent = result.player2.stealing.length;
        document.getElementById('stolen-2').textContent = -result.player2.stolen.length;
        document.getElementById('total-2').textContent = result.player2.totalResources;

        // player 3
        let titlePlayer3Ele = document.getElementById('title-player-3');
        titlePlayer3Ele.innerText = result.player3.name;
        titlePlayer3Ele.style.color = result.player3.color;
        document.getElementById('lumber-3').textContent = result.player3.lumber.count;
        document.getElementById('brick-3').textContent = result.player3.brick.count;
        document.getElementById('wool-3').textContent = result.player3.wool.count;
        document.getElementById('grain-3').textContent = result.player3.grain.count;
        document.getElementById('ore-3').textContent = result.player3.ore.count;
        document.getElementById('stealing-3').textContent = result.player3.stealing.length;
        document.getElementById('stolen-3').textContent = -result.player3.stolen.length;
        document.getElementById('total-3').textContent = result.player3.totalResources;

        // bank
        document.getElementById('lumber-bank').textContent = result.bank.lumber.count;
        document.getElementById('brick-bank').textContent = result.bank.brick.count;
        document.getElementById('wool-bank').textContent = result.bank.wool.count;
        document.getElementById('grain-bank').textContent = result.bank.grain.count;
        document.getElementById('ore-bank').textContent = result.bank.ore.count;

        // dev cards
        document.getElementById('knight').textContent = result.devCards.knights;
        document.getElementById('road').textContent = result.devCards.roadBuildings;
        document.getElementById('plenty').textContent = result.devCards.yearOfPlenties;
        document.getElementById('mono').textContent = result.devCards.monopolies;
        document.getElementById('vp').textContent = result.devCards.victoryPoints;
        document.getElementById('remaining-devcard').textContent = result.devCards.remaining;
    });
}
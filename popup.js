let reinit = document.getElementById("reinit");
let reload = document.getElementById("reload");

reinit.addEventListener('click', async () => {
    chrome.runtime.sendMessage({
        message: 'reinit'
        },
        function (response) {
            console.log('reinit response = ' + response.result);
        }
    );
});

reload.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: reloadPlaySteps,
    });
});

function init() {
    reloadPlayerData();
}

init();

// The body of this function will be executed as a content script inside the
// current page
function reloadPlaySteps() {
    chrome.storage.local.get(['messageHashes'], (result) => {
        let hashString = function (content) {
            var hash = 0;
            if (content.length == 0) {
                return hash;
            }
            for (var i = 0; i < content.length; i++) {
                var char = content.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        };

        let messageHashes = result.messageHashes;
        let messages = document.getElementById('game-log-text').getElementsByClassName('message_post');
        let newSteps = [];
        for (let i = 0; i < messages.length; i++) {
            let msgEle = messages[i];
            let hash = hashString(msgEle.innerHTML + i);
            if (!messageHashes.includes(hash)) {
                messageHashes.push(hash);
                let newStep = msgEle.innerHTML;
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
                newSteps.push(newStep);
                console.log('new step: ' + newStep);
            }
        }
        if (newSteps.length > 0) {
            chrome.storage.local.set({ 'messageHashes': messageHashes, 'newSteps': newSteps }, function () {
                chrome.runtime.sendMessage(
                    {
                        message: 'new steps'
                    },
                    function (response) {
                        console.log('new steps response = ' + response.result);
                    }
                );
            });
        }
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        console.log('request = ' + request);
        if (request.message === "players update") {
            reloadPlayerData();
        }
        sendResponse({ result: "success" });

        return true;
    }
);

function reloadPlayerData() {
    chrome.storage.local.get(['player1', 'player2', 'player3', 'bank'], (result) => {
        // player 1
        let titlePlayer1Ele = document.getElementById('title-player-1');
        titlePlayer1Ele.innerText = result.player1.name;
        titlePlayer1Ele.style.color = result.player1.color;
        document.getElementById('lumber-1').textContent = result.player1.lumber;
        document.getElementById('brick-1').textContent = result.player1.brick;
        document.getElementById('wool-1').textContent = result.player1.wool;
        document.getElementById('grain-1').textContent = result.player1.grain;
        document.getElementById('ore-1').textContent = result.player1.ore;
        document.getElementById('myth-1').textContent = result.player1.myth;
        document.getElementById('total-1').textContent = result.player1.totalResources;

        // player 2
        let titlePlayer2Ele = document.getElementById('title-player-2');
        titlePlayer2Ele.innerText = result.player2.name;
        titlePlayer2Ele.style.color = result.player2.color;
        document.getElementById('lumber-2').textContent = result.player2.lumber;
        document.getElementById('brick-2').textContent = result.player2.brick;
        document.getElementById('wool-2').textContent = result.player2.wool;
        document.getElementById('grain-2').textContent = result.player2.grain;
        document.getElementById('ore-2').textContent = result.player2.ore;
        document.getElementById('myth-2').textContent = result.player2.myth;
        document.getElementById('total-2').textContent = result.player2.totalResources;

        // player 3
        let titlePlayer3Ele = document.getElementById('title-player-3');
        titlePlayer3Ele.innerText = result.player3.name;
        titlePlayer3Ele.style.color = result.player3.color;
        document.getElementById('lumber-3').textContent = result.player3.lumber;
        document.getElementById('brick-3').textContent = result.player3.brick;
        document.getElementById('wool-3').textContent = result.player3.wool;
        document.getElementById('grain-3').textContent = result.player3.grain;
        document.getElementById('ore-3').textContent = result.player3.ore;
        document.getElementById('myth-3').textContent = result.player3.myth;
        document.getElementById('total-3').textContent = result.player3.totalResources;

        // bank
        document.getElementById('lumber-bank').textContent = result.bank.lumber;
        document.getElementById('brick-bank').textContent = result.bank.brick;
        document.getElementById('wool-bank').textContent = result.bank.wool;
        document.getElementById('grain-bank').textContent = result.bank.grain;
        document.getElementById('ore-bank').textContent = result.bank.ore;
    });
}
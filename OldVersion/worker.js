onmessage = function (e) {

    if (e.data == "start") {
        repeatDataUpdate();
    }

    if (e.data == "stop") {
        clearInterval(timeout1);
    }
}

let timeout1;

async function repeatDataUpdate() {
    //    function repeatDataUpdate() {

    //setInterval(async () => {
    // while (true) {

    timeout1 = setInterval(async () => {
        console.log("Updating data");
        await processServerResponse((response) => {
            console.log(response);
            if (response.command == "echo") {
                //var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
                postMessage("msg-info: " + response.time + "{time}" + response.value);
            }
            if (response.command == "add-html") {
                postMessage("msg-add-html: " + response.time + "{time}" + response.value);
            }
            if (response.command == "mod-html") {
                postMessage("msg-mod-html: " + response.time + "{time}" + response.value);
            }
            if (response.command == "eval") {
                postMessage("msg-eval: " + response.time + "{time}" + response.value);
            }
        })
    }, 0);
    // }
    //await updateData();
    //}, 100);
}

async function processServerResponse(callback) {
    let response = await requestData();
    /**
     * @type {string}
     */
    let data = response.split(" ");
    let time = data[0].split("{split}")[0];
    let command = data[0].split("{split}")[1];
    let value = response.substring(response.indexOf(" ") + 1)

    callback({ "command": command, "value": value, "time": time });
}
function requestData(callback) {
    return new Promise(function (resolve, reject) {
        var url = "/request-data";

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        console.log("Requesting data...");
        xhr.onreadystatechange = function () {
            console.log("Ready state: " + xhr.readyState);
            if (xhr.readyState === 4) {
                console.log("Request ready");
                if (xhr.status == 200)
                    resolve(xhr.responseText);
                else
                    console.log(xhr.status)
                //reject('Call Failed');
            }
        };

        xhr.send();
    });
}
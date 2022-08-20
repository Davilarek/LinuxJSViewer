document.getElementById("connect-button").addEventListener("click", () => {
    if (connected) { return; }
    let messageQueue = document.getElementsByClassName("message-queue")[0];
    let connectInput = document.getElementById("connect-input");
    var msg = new MessageBox("Connecting to " + connectInput.value, messageQueue);
    connectUsingIp(connectInput.value, msg).then(function (ws) {
        // setTimeout(() => {
        //     processServerResponse((response) => {
        //         msg.setMessage(response.command + " " + response.value);
        //         if (response.value == "\"connected OK\"") {
        // document.getElementsByClassName("content")[0].children[0].style.width = "100vw";
        // document.getElementsByClassName("content")[0].children[0].style.height = "100vh";
        // document.getElementsByClassName("content")[0].children[0].style.position = ""
        // document.getElementsByClassName("content")[0].children[0].style.border = ""
        // document.getElementsByClassName("content")[0].children[0].style["border-width"] = ""
        // document.getElementsByClassName("content")[0].style.left = ""
        // document.getElementsByClassName("content")[0].style.top = ""
        // document.getElementsByClassName("content")[0].style.position = ""
        // document.body.style.overflow = "hidden";
        // connectInput.remove();
        // document.getElementById("connect-button").remove();
        msg.setMessage("Connected to " + connectInput.value);
        connected = true;
        window.readyWebSocket = ws;
        window.messageQueue = messageQueue;
        // }

        // var backgroundWorker = new Worker('worker.js');

        window.addEventListener('beforeunload', function (e) {
            // backgroundWorker.postMessage("stop");
            // backgroundWorker.terminate();
            // alert("restart");
            console.log("Disconnecting from server");
            ws.close();
            // disconnectWS();
        });

        // backgroundWorker.postMessage("start");

        // backgroundWorker.onmessage = function (e) {
        ws.on("message", function (e) {
            processServerResponseWS(resolveServerResponse, e);
        });

        function filter(e) {
            let target = e.target;

            if (!target.className.includes("w-title-bar")) {
                return;
            }
            target = target.parentElement;
            target.moving = true;

            // Check if Mouse events exist on users' device
            if (e.clientX) {
                target.oldX = e.clientX; // If they exist then use Mouse input
                target.oldY = e.clientY;
            } else {
                target.oldX = e.touches[0].clientX; // Otherwise use touch input
                target.oldY = e.touches[0].clientY;
            }

            target.oldLeft = window.getComputedStyle(target).getPropertyValue('left').split('px')[0] * 1;
            target.oldTop = window.getComputedStyle(target).getPropertyValue('top').split('px')[0] * 1;

            document.onmousemove = dr;
            document.ontouchmove = dr;

            function dr(event) {
                event.preventDefault();

                if (!target.moving) {
                    return;
                }
                if (event.clientX) {
                    target.distX = event.clientX - target.oldX;
                    target.distY = event.clientY - target.oldY;
                } else {
                    target.distX = event.touches[0].clientX - target.oldX;
                    target.distY = event.touches[0].clientY - target.oldY;
                }

                target.style.left = target.oldLeft + target.distX + "px";
                target.style.top = target.oldTop + target.distY + "px";
            }

            function endDrag() {
                target.moving = false;
            }
            target.onmouseup = endDrag;
            target.ontouchend = endDrag;
        }

        function filter2(e) {
            let target = e.target;

            if (!target.classList[0].includes("w-title-bar") && target.draggable != true) {
                return;
            }
            //target = target.parentElement;
            $(target.parentElement).draggable({ handle: target, containment: document.getElementsByClassName("content-viewer")[0].parentElement });
            target.draggable = true;
        }

        // document.onmousedown = filter;
        // document.ontouchstart = filter;
        // document.onmousedown = filter2;
        // document.ontouchstart = filter2;

        //repeatDataUpdate();
        // setInterval(async () => {
        //     const promise = new Promise(function (resolve, reject) {
        //         if (connected) {
        //             console.log("Updating data");
        //             processServerResponse((response) => {
        //                 console.log(response);
        //                 if (response.command == "echo") {
        //                     var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
        //                 }
        //                 resolve();
        //             })
        //         }
        //         reject();
        //     });

        //     await promise;
        // }, 100);

        // setInterval(() => {
        //     var url = "/check-for-data";

        //     var xhr = new XMLHttpRequest();
        //     xhr.open("GET", url);

        //     xhr.onreadystatechange = function () {
        //         console.log("Ready state: " + xhr.readyState);
        //         if (xhr.readyState === 4) {
        //             console.log("Request ready");
        //             if (xhr.status == 200)
        //                 resolve(xhr.responseText);
        //             else
        //                 reject('Call Failed');
        //         }
        //     };

        //     xhr.send();
        // }, 100);
    });
    // }, 500);
});

// async function repeatDataUpdate() {
//     while (true) {
//         await timeout(100);

//         if (connected) {
//             console.log("Updating data");
//             await processServerResponse((response) => {
//                 console.log(response);
//                 if (response.command == "echo") {
//                     var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
//                 }
//             })
//         }

//         //await updateData();
//     }
// }

function processServerResponseWS(callback, resp) {
    let response = resp;
    /**
     * @type {string}
     */
    let data = response.split(" ");
    let time = data[0].split("{split}")[0];
    let command = data[0].split("{split}")[1];
    let value = response.substring(response.indexOf(" ") + 1)

    callback({ "command": command, "value": value, "time": time });
}

function resolveServerResponse(response) {
    console.log(response);
    if (response.command == "echo") {
        //var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
        finalMessageEventProcess("msg-info: " + response.time + "{time}" + response.value);
    }
    if (response.command == "add-html") {
        finalMessageEventProcess("msg-add-html: " + response.time + "{time}" + response.value);
    }
    if (response.command == "mod-html") {
        finalMessageEventProcess("msg-mod-html: " + response.time + "{time}" + response.value);
    }
    if (response.command == "eval") {
        finalMessageEventProcess("msg-eval: " + response.time + "{time}" + response.value);
    }
    if (response.command == "get-xml-data") {
        finalMessageEventProcess("msg-get-xml-data: " + response.time + "{time}" + response.value);
    }
    if (response.command == "remove-html") {
        finalMessageEventProcess("msg-remove-html: " + response.time + "{time}" + response.value);
    }
}

function finalMessageEventProcess(e) {
    //console.log(e.data);
    if (e.startsWith("msg-info: ")) {
        new MessageBox("Message from server: " + e.substring(10).split("{time}")[1], window.messageQueue);
    }
    if (e.startsWith("msg-eval: ")) {
        eval(e.substring(10).split("{time}")[1]);
    }
    if (e.startsWith("msg-add-html: ")) {
        console.log(e);
        // replace e.data.substring(14) \\n with \n and \\r with \r

        var domParser = new DOMParser().parseFromString(e.substring(14).split("{time}")[1].replace(/\\n/g, "\n").replace(/\\r/g, "\r"), "text/html").children[0].children[1].children[0];
        // content-viewer add domParser
        let buttonsInDomParser = ["taskbar-start-button", "taskbar-task-button"];
        // cycle through buttonInDomParser and get first element with tag "p" and add onclick to it
        for (let i = 0; i < buttonsInDomParser.length; i++) {
            let button = domParser.getElementsByClassName(buttonsInDomParser[i])[0];
            if (button) {
                let randomNumber = Math.floor(Math.random() * 10000);
                button.classList[0] = buttonsInDomParser[i] + randomNumber;
                button.addEventListener("click", () => {
                    // button clicked

                    sendDataWS("button-clicked " + buttonsInDomParser[i] + randomNumber + " " + e.substring(14).split("{time}")[0] + " " + domParser.additionalId);
                });
            }
        }

        if (domParser.classList.contains("window")) {
            let randomNumber = Math.floor(Math.random() * 10000);
            domParser.classList.replace("window", "window" + randomNumber);
            domParser.id = e.substring(14).split("{time}")[0];
            // $(domParser).draggable({ handle: domParser.children[3], containment: document.getElementsByClassName("content-viewer")[0].parentElement });
            sendDataWS("window-rendered " + domParser.classList[0] + " " + e.substring(14).split("{time}")[0]);
        }

        if (domParser.children[0].children[0] && domParser.children[0].children[0].classList.contains("taskbar-task-button")) {
            domParser.id = e.substring(14).split("{time}")[0];
            sendDataWS("taskbar-task-rendered " + e.substring(14).split("{time}")[0]);
            document.getElementById("gui-main-taskbar").children[0].appendChild(domParser);
            return;
        }

        var contentViewer = document.getElementsByClassName("content-viewer")[0].parentElement;
        contentViewer.appendChild(domParser);
        if (domParser.classList[0] && domParser.classList[0].includes("window")) {
            let childs = [].slice.call(contentViewer.children);
            childs[childs.indexOf(domParser)].addEventListener("mousedown", () => {
                var childCount = 3;
                console.log(childCount);
                if ((childs[childs.indexOf(domParser)].parentElement.children.length - 1) > 3) {
                    childCount = childs[childs.indexOf(domParser)].parentElement.children.length - 1;
                }
                console.log(childCount);
                $(childs[childs.indexOf(domParser)]).insertAfter(childs[childs.indexOf(domParser)].parentElement.children[childCount]);
                console.log(childs[childs.indexOf(domParser)].parentElement.children[childCount]);
                sendDataWS("window-on-top " + e.substring(14).split("{time}")[0]);
            });
            childs[childs.indexOf(domParser)].children[3].children[1].addEventListener("click", () => {
                sendDataWS("window-close " + e.substring(14).split("{time}")[0]);
            });
            $(childs[childs.indexOf(domParser)]).draggable({ handle: childs[childs.indexOf(domParser)].children[3], containment: document.getElementsByClassName("content-viewer")[0].parentElement });
        }
    }
    if (e.startsWith("msg-remove-html: ")) {
        console.log(e);

        var element = document.getElementById(e.substring(17).split("{time}")[1]);
        if (element) {
            element.remove();
        }
    }
    if (e.startsWith("msg-mod-html: ")) {
        console.log(e);

        let messageData = e.substring(14).split("{time}")[1];
        let baseHtmlTime = messageData.split("{splitData}")[0];
        let baseHtmlPath = messageData.split("{splitData}")[1];
        let baseHtmlEditMode = messageData.split("{splitData}")[2];

        let htmlData = messageData.split("{splitData}")[3];
        let additionalId = "";
        if (htmlData.split("{splitInfo}")[1]) {
            additionalId = htmlData.split("{splitInfo}")[1];
            htmlData = htmlData.split("{splitInfo}")[0];
        }
        console.log(additionalId);
        let finalHtmlElement = document.getElementById(baseHtmlTime);
        if (baseHtmlPath != "use-base-html") {
            for (let i = 0; i < baseHtmlPath.split("\\").length; i++) {
                finalHtmlElement = finalHtmlElement.children[baseHtmlPath.split("\\")[i]]
            }
        }

        let replaceStyles = false;

        if (htmlData.startsWith("style_")) {
            replaceStyles = true;
            htmlData = htmlData.split("style_")[1];
        }

        if (htmlData.endsWith("_{JSON_END}")) {
            htmlData = JSON.parse(htmlData.split("_{JSON_END}")[0]);
        }

        console.log(finalHtmlElement);
        // console.log(baseHtmlEditMode);
        console.log(htmlData);
        console.log(finalHtmlElement[baseHtmlEditMode])
        console.log(document.getElementById(baseHtmlTime));
        if (replaceStyles) {
            // htmlData is object
            for (let i in htmlData) {
                finalHtmlElement.style[i] = htmlData[i];
            }
        }
        else {
            finalHtmlElement[baseHtmlEditMode] = htmlData.replace("\\newline", "\r\n");
        }
        document.getElementById(baseHtmlTime).additionalId = additionalId;

        console.log(finalHtmlElement);
        // console.log(baseHtmlEditMode);
        console.log(htmlData);
        console.log(finalHtmlElement[baseHtmlEditMode])
        console.log(finalHtmlElement[baseHtmlEditMode].cssText)
        console.log(document.getElementById(baseHtmlTime));
    }
    if (e.startsWith("msg-get-xml-data: ")) {
        console.log(e);
        let messageData = e.substring(16).split("{time}")[1];
        var element = document.getElementById(messageData);
        sendDataWS("xml-data " + messageData + "{split}" + JSON.stringify(toJSON(element)));
    }
}

//https://gist.github.com/sstur/7379870
/**
 * 
 * @param {Element} node 
 * @returns 
 */
function toJSON(node) {
    let propFix = { for: 'htmlFor', class: 'className' };
    let specialGetters = {
        style: (node) => node.style.cssText,
    };
    let attrDefaultValues = { style: '' };
    let obj = {
        nodeType: node.nodeType,
    };
    if (node.tagName) {
        obj.tagName = node.tagName.toLowerCase();
    } else if (node.nodeName) {
        obj.nodeName = node.nodeName;
    }
    if (node.nodeValue) {
        obj.nodeValue = node.nodeValue;
    }
    let attrs = node.attributes;
    if (attrs) {
        let defaultValues = new Map();
        for (let i = 0; i < attrs.length; i++) {
            let name = attrs[i].nodeName;
            defaultValues.set(name, attrDefaultValues[name]);
        }
        // Add some special cases that might not be included by enumerating
        // attributes above. Note: this list is probably not exhaustive.
        switch (obj.tagName) {
            case 'input': {
                if (node.type === 'checkbox' || node.type === 'radio') {
                    defaultValues.set('checked', false);
                } else if (node.type !== 'file') {
                    // Don't store the value for a file input.
                    defaultValues.set('value', '');
                }
                break;
            }
            case 'option': {
                defaultValues.set('selected', false);
                break;
            }
            case 'textarea': {
                defaultValues.set('value', '');
                break;
            }
        }
        let arr = [];
        for (let [name, defaultValue] of defaultValues) {
            let propName = propFix[name] || name;
            let specialGetter = specialGetters[propName];
            let value = specialGetter ? specialGetter(node) : node[propName];
            if (value !== defaultValue) {
                arr.push([name, value]);
            }
        }
        if (arr.length) {
            obj.attributes = arr;
        }
    }
    let childNodes = node.childNodes;
    // Don't process children for a textarea since we used `value` above.
    if (obj.tagName !== 'textarea' && childNodes && childNodes.length) {
        let arr = (obj.childNodes = []);
        for (let i = 0; i < childNodes.length; i++) {
            arr[i] = toJSON(childNodes[i]);
        }
    }
    return obj;
}

function repeatDataUpdate() {
    setInterval(async () => {
        if (connected) {
            console.log("Updating data");
            await processServerResponse((response) => {
                console.log(response);
                if (response.command == "echo") {
                    var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
                }
            })
        }

        //await updateData();
    }, 100);
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateData() {
    return new Promise(function (resolve, reject) {
        if (connected) {
            console.log("Updating data");
            processServerResponse((response) => {
                console.log(response);
                if (response.command == "echo") {
                    var msg = new MessageBox("Message from server: " + response.value, document.getElementsByClassName("message-queue")[0]);
                }
                resolve();
            })
        }
    });
}

let connected = false;

function connectUsingIp(ip, msg) {
    return new Promise(function (resolve, reject) {
        // var url = "/connect";

        // var xhr = new XMLHttpRequest();
        // xhr.open("POST", url);

        // xhr.setRequestHeader("Content-Type", "application/json");

        // xhr.onreadystatechange = function () {
        //     console.log("Ready state: " + xhr.readyState);
        //     if (xhr.readyState === 4) {
        //         console.log("Request ready");
        //         resolve(xhr.status);
        //     }
        // };

        // var data = '{"ip": "' + ip + '"}';

        // xhr.send(data);
        // use websocket to connect to server
        var ws = io("ws://" + ip);
        ws.on("connect", () => {
            console.log("Connected to server");
            msg.setMessage("Connected!");
            resolve(ws);
        });
        ws.on("connect_error", () => {
            console.log("Connection error");
            msg.setMessage("Connection failed!");
            reject();
        });
    });
}

function disconnect() {
    var url = "/disconnect";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.send();

    connected = false;
}
function disconnectWS(ws) {
    ws.close();

    connected = false;
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

function sendData(data) {
    var url = "/send-data";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send('{"data": "' + data + '"}');
}

function sendDataWS(data) {
    window.readyWebSocket.send(data);
}

class MessageBox {
    constructor(message, parent) {
        this.message = message;
        this.parent = parent;

        let templateMessage1 = document.getElementsByClassName("template-message1")[0];
        let messageBox = parent.appendChild(templateMessage1.cloneNode(true));
        let messageText = messageBox.getElementsByClassName("message-text")[0];
        let messageCloseButton = messageBox.getElementsByClassName("close-button")[0].children[0];
        messageBox.style.display = 'none'
        messageText.textContent = message;
        //$(".template-message1").parent().show();
        $(messageBox).slideDown(500, "swing", function () {
            // Animation complete.
            messageBox.style.height = 50 + "px";
            messageCloseButton.addEventListener("click", () => {
                messageBox.remove();
            });
        });
    }
    setMessage(message) {
        this.message = message;
        let messageText = this.parent.getElementsByClassName("message-text")[0];
        messageText.textContent = message;
    }
}
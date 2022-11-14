/// <reference path="../test-server.js" />


// NOTE: running two instances of console is useless since you can't separate the output and input of main.js
(function () {
    // let fullData = "";
    let targetWindowId = 0;

    // var targetObj = {};
    // var targetProxy = new Proxy(targetObj, {
    //     set: function (target, key, value) {
    //         // console.log(`${key} set to ${value}`);
    //         if (targetProxy.fullData != "")
    //             findTaskbarTaskByWindowId(targetWindowId, desktop.windows).setContent(targetProxy.fullData);
    //         target[key] = value;
    //         return true;
    //     }
    // });

    // targetProxy.hello_world = "test";

    function justRenderOnClient(socket, filename) {
        if (debugMode) console.log("Rendering " + filename);
        // if (debugMode) console.log(socket);
        socket.send(Date.now() + "{split}jadd-html " + processHtmlFromFileSync(filename));
    }

    function createConsoleWindow(socket) {
        createWindowOnClient(socket, "Console", "console.png").then((windowId) => {
            findTaskbarTaskByWindowId(windowId, desktop.windows).setContent("");
            targetWindowId = windowId;
            let fullData = "";
            setWindowSize(socket, windowId, "400px", "200px");
            let isFirstTime = true;
            // consoleListeners.push((items) => {
            //     // populateConsole(socket, items[0], windowId);
            //     console.log(fullData);
            //     // targetProxy.fullData += "\n" + items[0];
            //     if (!isFirstTime)
            //         fullData += "\n" + items[0];
            //     else {
            //         fullData = items[0];
            //         isFirstTime = false;
            //     }
            //     console.log("pushing");
            // });
            const newTerm = cli.createTerminal(targetTerminalOwner);
            const populateConsoleInternal = function (item) {
                // populateConsole(socket, items[0], windowId);
                console.log("My terminal is:");
                console.log(newTerm);
                console.log(fullData);
                // targetProxy.fullData += "\n" + items[0];
                if (!isFirstTime)
                    fullData += "\n" + item;
                else {
                    fullData = item;
                    isFirstTime = false;
                }
                console.log("pushing");
            };
            newTerm.inputEmitter.on("message", populateConsoleInternal);
            newTerm.outputEmitter.on("message", populateConsoleInternal);
            justRenderOnClient(socket, "console-input-template");
            em.on('guiEvent', function (data) {
                if (data.split(" ")[0] == "window-input-rendered") {
                    // executeJSOnClient(socket, "console.log(`testogus`)");
                    executeJSOnClient(socket, `document.getElementById(` + windowId + `).appendChild(document.getElementById(` + data.split(" ")[1] + `));`);
                    // detect keycode enter while focused on element in document data.split(" ")[1] and reply with sendDataWS
                    // const code = () => {
                    //     const node = document.getElementById(data.split(" ")[1])[0];
                    //     node.addEventListener("keyup", function (event) {
                    //         if (event.key === "Enter") {
                    //             // Do work
                    //         }
                    //     });
                    // };
                    // document.getElementById(' + data.split(" ")[1] + ').addEventListener("keyup", (event) => { if (event.key === "Enter") { sendDataWS('input-confirm ' + data.split(" ")[1] + ' ' + document.getElementById(' + data.split(" ")[1] + ').value); } });
                    setTimeout(() => {
                        console.log("sending register event command");
                        executeJSOnClient(socket, 'document.getElementById(' + data.split(" ")[1] + ').addEventListener("keyup", (event) => { if (event.key === "Enter") { sendDataWS("input-confirm ' + data.split(" ")[1] + ' " + document.getElementById(' + data.split(" ")[1] + ').getElementsByTagName("input")[0].value); document.getElementById(' + data.split(" ")[1] + ').getElementsByTagName("input")[0].value = ""; } });');
                        em.on('guiEvent', function (inputData) {
                            if (inputData.split(" ")[0] == "input-confirm" && inputData.split("input-confirm ")[1].split(" ")[0] == data.split(" ")[1]) {
                                // console.log("testogus");
                                // em.removeListener('guiEvent', arguments.callee);
                                // cli.executeCommand(cli.fakeMessageCreator(data.replace("input-confirm " + data.split(" ")[1] + " ", "")));
                                // cli.executeCommand(cli.createTerminalMessageObject(data.replace("input-confirm " + data.split(" ")[1] + " ", ""), cli.getTerminalByOwner(targetTerminalOwner).terminalId));
                                cli.executeCommand(cli.createTerminalMessageObject(inputData.replace("input-confirm " + data.split(" ")[1] + " ", ""), newTerm.terminalId));
                            }
                        });
                    }, 50);
                    em.removeListener('guiEvent', arguments.callee);
                }
            });

            let contentUpdateInterval = setInterval(() => {
                // console.log("processing data");
                findTaskbarTaskByWindowId(windowId, desktop.windows).setContent(fullData);
                findTaskbarTaskByWindowId(windowId, desktop.windows).setContentUpdateInterval(contentUpdateInterval);
            }, 100);
        });
    }

    // function populateConsole(socket, input, windowId) {
    //     // findTaskbarTaskByWindowId(windowId, desktop.windows).setContent();
    //     getXMLData(socket, windowId).then(function (data2) {
    //         console.log("processing data");
    //         let divsFound = 0;
    //         t: for (let i = 0; i < data2.childNodes.length; i++) {
    //             // console.log(data2.childNodes[i]);
    //             // if (data2.childNodes[i].tagName == "div") {
    //             //     console.log("found div");

    //             //     divsFound++;
    //             // }
    //             // if (divsFound == 1) {
    //             if (data2.childNodes[i].attributes)
    //                 for (let j = 0; j < data2.childNodes[i].attributes.length; j++) {
    //                     if (data2.childNodes[i].attributes[j][0] == "class" && data2.childNodes[i].attributes[j][1] == "w-content") {
    //                         // console.log("test");
    //                         // console.log(data2.childNodes[i].childNodes[1]);
    //                         // console.log(data2.childNodes[i]);
    //                         findTaskbarTaskByWindowId(windowId, desktop.windows).setContent(data2.childNodes[i].childNodes[1].childNodes[0].nodeValue + "\\newline" + input);
    //                         break t;
    //                     }
    //                 }
    //             // }
    //         }
    //     });
    // }

    createConsoleWindow(currentSocket);
})();
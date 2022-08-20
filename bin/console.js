/// <reference path="../test-server.js" />


// NOTE: running two instances of console is useless since you can't separate the output and input of main.js
(function () {
    function createConsoleWindow(socket) {
        createWindowOnClient(socket, "Console", "console.png").then((windowId) => {
            findTaskbarTaskByWindowId(windowId, desktop.windows).setContent("test123");

            setWindowSize(socket, windowId, "400px", "200px");
            consoleListeners.push((items) => {
                populateConsole(socket, items[0], windowId);
                console.log("pushing");
            })
        });
    }

    function populateConsole(socket, input, windowId) {
        // findTaskbarTaskByWindowId(windowId, desktop.windows).setContent();
        getXMLData(socket, windowId).then(function (data2) {
            console.log("processing data");
            let divsFound = 0;
            t: for (let i = 0; i < data2.childNodes.length; i++) {
                // console.log(data2.childNodes[i]);
                // if (data2.childNodes[i].tagName == "div") {
                //     console.log("found div");

                //     divsFound++;
                // }
                // if (divsFound == 1) {
                if (data2.childNodes[i].attributes)
                    for (let j = 0; j < data2.childNodes[i].attributes.length; j++) {
                        if (data2.childNodes[i].attributes[j][0] == "class" && data2.childNodes[i].attributes[j][1] == "w-content") {
                            // console.log("test");
                            // console.log(data2.childNodes[i].childNodes[1]);
                            // console.log(data2.childNodes[i]);
                            findTaskbarTaskByWindowId(windowId, desktop.windows).setContent(data2.childNodes[i].childNodes[1].childNodes[0].nodeValue + "\\newline" + input);
                            break t;
                        }
                    }
                // }
            }
        });
    }

    createConsoleWindow(currentSocket);
})();
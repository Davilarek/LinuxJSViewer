const readline = require('readline');

const path = require('path');
const port = 8080;

var events = require('events');
var em = new events.EventEmitter();

let connected = false;

const http = require('node:http');

// Create an HTTP server
const server = http.createServer();

const io = require("socket.io")(server, {
    cors: {
        origin: '*',
    }
});

// server.on('upgrade', (req, socket, head) => {
//     socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
//         'Upgrade: WebSocket\r\n' +
//         'Connection: Upgrade\r\n' +
//         '\r\n');
//     console.log("Client wants to upgrade");
//     // socket.pipe(socket); // echo back
//     socket.write("Hello, client!\r\n");
// });

// server.listen(port, '127.0.0.1', () => {
let currentSocket = null;
// let cli = {};
// cli.guiEvents = em;

let desktop = {
    /**
     * @type {Object.<string, TaskbarTask>}
     */
    windows: {},
};
let desktopDefault = {};
Object.assign(desktopDefault, desktop);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
io.on('connection', function (socket) {
    if (connected) {
        socket.send(Date.now() + "{split}" + 'echo "only one connection allowed"');
        socket.disconnect(true);
        return;
    }
    // rl.reopen();
    desktop = desktopDefault;
    connected = true;
    currentSocket = socket;
    console.log('A new connection has been established.');

    setTimeout(() => {
        socket.send(Date.now() + "{split}" + 'echo "connected OK"');
    }, 50);



    setTimeout(() => {
        console.log("Creating desktop");
        createDesktopOnClient(socket);
    }, 1000);

    socket.on('message', function (chunk) {
        if (chunk.toString() == 'closing') {
            connected = false;
            em.removeAllListeners('guiEvent');
            return;
        }
        console.log(`Data received from client:` + chunk.toString());
        em.emit('guiEvent', chunk.toString());
    });

    socket.on('disconnect', function (reason) {
        if (reason == "transport error") {
            // rl.close();
            console.log("Client disconnected (I guess?)");
            connected = false;
            currentSocket = null;
            return;
        }

        console.log('Closing connection with the client');
        currentSocket = null;
        // rl.close();
    });
    repeatQuestion(socket);
    // socket.on('error', function (err) {
    //     console.log(`${err}`);
    //     socket.disconnect(true);
    //     rl.close();
    //     if (err.code == 'ECONNRESET') {
    //         console.log("Client disconnected (I guess?)");
    //         connected = false;
    //     }
    // });

});
function repeatQuestion(socket) {
    rl.question('Command: ', function (execute) {
        console.log(`Command received: ${execute}`);
        if (execute.split(" ")[0] == "eval") {
            eval(execute.split(" ")[1]);
            repeatQuestion(socket);
        }
        else {
            execute = execute.replace("{now}", Date.now() + "{split}");
            socket.send(execute);

            repeatQuestion(socket);
        }
    });
}

function processHtmlFromFileSync(filename) {
    var fs = require('fs');
    var html = fs.readFileSync("html-gui" + path.sep + filename + ".html", 'utf8');
    // replace \n with \\n and \r with \\r in html
    html = html.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    return html;
}

function processBinaryFromFileSync(filename) {
    var fs = require('fs');
    var bin = fs.readFileSync("bin" + path.sep + filename, 'utf8');
    bin = bin.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    return bin + '';
}

function executeBinary(filename) {
    // require("." + path.sep + "bin" + path.sep + filename + ".js");
    // return Function('return (' + processBinaryFromFileSync(filename) + ')')();
    var fs = require('fs');
    eval(fs.readFileSync(filename) + '');
}

function renderOnClient(socket, filename) {
    console.log("Rendering " + filename);
    // console.log(socket);
    socket.send(Date.now() + "{split}add-html " + processHtmlFromFileSync(filename));
}

function createDesktopOnClient(socket) {
    renderOnClient(socket, "taskbar");
    listenForTaskbarButtons(socket);
}

function addWindowTitle(socket, elementId, title) {
    socket.send(Date.now() + "{split}mod-html " + elementId + "{splitData}3\\0\\0{splitData}textContent{splitData}" + title);
}

function addWindowContent(socket, elementId, content) {
    socket.send(Date.now() + "{split}mod-html " + elementId + "{splitData}4\\0{splitData}textContent{splitData}" + content);
}

function addTaskbarTask(socket, elementId, title, icon, windowId, rename = false) {
    socket.send(Date.now() + "{split}mod-html " + elementId + "{splitData}0\\0\\0{splitData}textContent{splitData}" + title + "{splitInfo}" + windowId);
    if (!rename) {
        setTimeout(() => {
            // newStyle = multiply style.left

            getXMLData(socket, elementId).then(function (data) {
                // console.log(data["style"]);

                var currentStyle;
                for (let index = 0; index < data.attributes.length; index++) {
                    const element = data.attributes[index];
                    if (element[0] == "style") {
                        currentStyle = element[1].split("; ");
                    }
                }
                // convert currentStyle to object with key:value
                var styleObject = {};
                for (let index = 0; index < currentStyle.length; index++) {
                    const element = currentStyle[index];
                    if (element.indexOf(":") > -1) {
                        var key = element.split(":")[0];
                        var value = element.split(": ")[1];
                        styleObject[key] = value;
                    }
                }
                console.log(styleObject);
                console.log(desktop.windows);
                var howManyTimes = Object.keys(desktop.windows).length;


                var newStyle = { left: styleObject.left.split("%")[0] * howManyTimes + "%" };
                // var newStyle = { ...styleObject, left: styleObject.left.split("%")[0] * 2 + "%" };

                socket.send(Date.now() + "{split}mod-html " + elementId + "{splitData}use-base-html{splitData}style{splitData}" + "style_" + JSON.stringify(newStyle) + "_{JSON_END}" + "{splitInfo}" + windowId);
            });
        }, 100);
    }

    // findTaskbarTaskByWindowId(windowId, desktop.windows).getHTMLData().style

    // setTimeout(() => {
    //     socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}use-base-html{splitData}style{splitData}" + "");
    // }, 50);
    //socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}0\\1\\0{splitData}src{splitData}" + icon);
}

function getXMLData(socket, elementId) {
    return new Promise((resolve, reject) => {
        socket.send(Date.now() + "{split}get-xml-data " + elementId);
        socket.on('message', function (chunk) {
            if (chunk.toString().split(" ")[0] == "xml-data" && chunk.toString().split(" ")[1].split("{split}")[0] == elementId) {
                // console.log("aaaaaaaaa" + chunk.toString() + "aaaaaaaaa");
                console.log("XML data received");
                resolve(JSON.parse(chunk.toString().split("{split}")[1]));
                // resolve(JSON.parse(chunk.toString().split(" ")[2]));
                socket.removeListener('message', arguments.callee);
            }
        });
    });
}

function setWindowSize(socket, elementId, width, height) {
    var currentStyle = findTaskbarTaskByWindowId(elementId, desktop.windows).getHTMLData()["style"];
    var newStyle = { ...currentStyle, width: width, height: height };

    socket.send(Date.now() + "{split}mod-html " + elementId + "{splitData}use-base-html{splitData}style{splitData}" + "style_" + JSON.stringify(newStyle) + "_{JSON_END}");
}

function executeJSOnClient(socket, js) {
    socket.send(Date.now() + "{split}eval " + js);
}

function createWindowOnClient(socket, windowTitle, windowIcon) {
    return new Promise((resolve, reject) => {
        if (windowTitle == "") {
            windowTitle = "New Window";
        }

        renderOnClient(socket, "window-template");
        em.on('guiEvent', function (data) {
            if (data.split(" ")[0] == "window-rendered") {
                addWindowTitle(socket, data.split(" ")[2], windowTitle);
                setTimeout(() => {
                    desktop.windows[windowTitle + Object.keys(desktop.windows).length.toString()] = new TaskbarTask(data.split(" ")[2], windowTitle, windowIcon);
                    renderTaskInTaskbar(socket, { windowId: data.split(" ")[2], windowTitle: windowTitle, windowIcon: "" });
                    console.log(Object.keys(desktop.windows).length.toString());
                    getXMLData(socket, data.split(" ")[2]).then(function (data2) {
                        desktop.windows[windowTitle + (Object.keys(desktop.windows).length - 1).toString()].setHTMLData(data2);
                        // setTimeout(() => {
                        //     renameDuplicateWindows(socket, desktop.windows);
                        // }, 250);
                        resolve(data.split(" ")[2]);
                    });
                }, 50);
                // renderTaskInTaskbar(socket, { windowId: data.split(" ")[2], windowTitle: windowTitle, windowIcon: createIcon(windowIcon) });
                em.removeListener('guiEvent', arguments.callee);
            }
        });
    });
}

// /**
//  * 
//  * @param {Object.<string, TaskbarTask>} windowCollection 
//  */
// function renameDuplicateWindows(socket, windowCollection) {
//     // check every window in the collection for a duplicate title alphabetically
//     // if a duplicate is found, rename the window to x + n
//     console.log(windowCollection);
//     // var windows = Object.values(windowCollection);
//     // console.log(windows);
//     // for (var i = 0; i < windows.length; i++) {
//     //     var window = windows[i];
//     //     console.log("Checking window " + window);
//     //     for (var j = i + 1; j < windows.length; j++) {
//     //         if (windowCollection[window].getWindowTitle() == windowCollection[windows[j]].getWindowTitle()) {
//     //             addWindowTitle(socket, windowCollection[window].getWindowId(), windowCollection[window].getWindowTitle() + " (x" + (j + 1) + ")");
//     //             windowCollection[window].setWindowTitle(windowCollection[window].getWindowTitle() + " (x" + (j + 1) + ")");
//     //             windowCollection[window].updateWindowTitle();
//     //             console.log("Renamed window " + window + " to " + windowCollection[window].getWindowTitle());
//     //         }
//     //     }
//     // }
//     // /\ use for var item in windowCollection
//     for (var item in windowCollection) {
//         var window = windowCollection[item];
//         console.log("Checking window ");
//         console.log(window);
//         var i = 0;
//         for (var item2 in windowCollection) {
//             var window2 = windowCollection[item2];
//             console.log("Checking window ");
//             console.log(window2);
//             if (window.getWindowTitle() == window2.getWindowTitle() && window.getWindowId() != window2.getWindowId()) {
//                 i++;
//                 addWindowTitle(socket, window.getWindowId(), window.getWindowTitle() + " " + i);
//                 window.setWindowTitle(window.getWindowTitle() + " " + i);
//                 window.updateWindowTitle();
//                 console.log("Renamed window " + window.getWindowId() + " to " + window.getWindowTitle());
//             }
//         }
//     }
// }

// time / id: milliseconds since epoch (Date.now()) - id of the element

// task: windowId, windowTitle, windowIcon
function renderTaskInTaskbar(socket, task) {
    renderOnClient(socket, "taskbar-task-template");
    em.on('guiEvent', function (data) {
        if (data.split(" ")[0] == "taskbar-task-rendered") {
            // addTaskbarTask(socket, data.split(" ")[1], task.windowTitle, task.windowIcon);
            addTaskbarTask(socket, data.split(" ")[1], task.windowTitle, "", task.windowId);
            findTaskbarTaskByWindowId(task.windowId, desktop.windows).setTaskbarTaskId(data.split(" ")[1]);
            em.removeListener('guiEvent', arguments.callee);
        }
    });
}

function listenForTaskbarButtons(socket) {
    em.on('guiEvent', function (data) {
        if (data.split(" ")[0] == "button-clicked") {
            if (data.split(" ")[1].includes("taskbar-task-button")) {
                console.log("Taskbar task button " + data.split(" ")[2] + " clicked");
                console.log(data);
                executeJSOnClient(socket, '$("#' + data.split(" ")[3] + '").toggle()');
            }
            else if (data.split(" ")[1].includes("taskbar-start-button")) {
                console.log("Taskbar start button " + data.split(" ")[2] + " clicked");
            }
        }
        if (data.split(" ")[0] == "window-close") {
            console.log("Window " + data.split(" ")[1] + " closed");
            var task = findTaskbarTaskByWindowId(data.split(" ")[1], desktop.windows);
            if (task != null) {
                task.closeWindow();
            }
        }
    });
}
// let objects = {};
// em.on('guiEvent', function (data) {
//     if (data.split(" ")[0].endsWith("-rendered")) {
//         objects[data.split(" ")[1]] = data.split(" ")[2];
//     }
// });
// 21:45 19.05.2022 - i think i gave up on this... please, someone find a way to send LARGE data over tcp without chunking...

// function createIcon(iconPath) {
//     const fs = require("fs");
//     const path = require("path");
//     return `data:image/${path.extname(iconPath).split('.').pop()};base64,${Buffer.from(fs.readFileSync(iconPath), 'binary').toString('base64')}`
// }

// });

// https://gist.github.com/DannyNemer/29dc7b636e3518071e6f
// Re-opens the readline `Interface` instance. Regains control of the `input` and `output` streams
// by restoring listeners removed by the "close" event.
// rl.reopen = (function () {
//     // Change one time event listener for "close" event to a normal event listener.
//     var onclose = rl.listeners('close')[0]
//     rl.removeListener('close', onclose)
//     rl.on('close', onclose.listener)

//     // Save the `input` and `output` listeners which are removed by the "close" event.
//     var onkeypress = rl.input.listeners('keypress')[0]
//     var ontermend = rl.input.listeners('end')[1]
//     var onresize = rl.output.listeners('resize')[0]

//     return function () {
//         if (!this.closed) return

//         this.resume()

//         if (this.terminal) {
//             this._setRawMode(true)
//         }

//         this.closed = false

//         // Restore `input` listeners.
//         this.input.on('keypress', onkeypress)
//         this.input.on('end', ontermend)

//         // Restore `output` listener.
//         if (this.output !== null && this.output !== undefined) {
//             this.output.on('resize', onresize)
//         }
//     }
// })()

/**
 * 
 * @param {*} name 
 * @param {Object.<string, TaskbarTask>} windowList 
 * @returns {TaskbarTask}
 */
function findTaskbarTaskByName(name, windowList) {
    for (var i = 0; i < Object.keys(windowList).length; i++) {
        if (Object.values(windowList)[i].title == name) {
            return Object.values(windowList)[i];
        }
    }
    return null;
}

/**
 * 
 * @param {*} socket 
 * @param {TaskbarTask} window 
 */
function closeWindow(socket, window) {
    var windowId = window.getWindowId();
    var taskbarId = window.getTaskbarTaskId();

    // send can't (SHOULDN'T) happen in the same millisecond, so we need to wait a bit
    socket.send(Date.now() + "{split}remove-html " + windowId);
    setTimeout(function () {
        socket.send(Date.now() + "{split}remove-html " + taskbarId);
    }, 50);
}

/**
 * 
 * @param {*} id 
 * @param {Object.<string, TaskbarTask>} windowList 
 * @returns {TaskbarTask}
 */
function findTaskbarTaskByWindowId(id, windowList) {
    // console.log(windowList);
    var windows = Object.values(windowList);
    // console.log(windows);
    for (var i = 0; i < windows.length; i++) {
        var window = windows[i];
        // console.log("Checking window " + window);
        if (window.getWindowId() == id) {
            return window;
        }
    }
    return null;
}

class TaskbarTask {
    constructor(windowId, windowTitle, windowIcon) {
        this.windowId = windowId;
        this.windowTitle = windowTitle;
        this.windowIcon = windowIcon;
    }

    getWindowId() {
        return this.windowId;
    }

    getWindowTitle() {
        return this.windowTitle;
    }

    getWindowIcon() {
        return this.windowIcon;
    }

    setWindowTitle(windowTitle) {
        this.windowTitle = windowTitle;
    }

    updateWindowTitle() {
        addWindowTitle(currentSocket, this.windowId, this.windowTitle);
        addTaskbarTask(currentSocket, this.taskbarTaskId, this.windowTitle, "", this.windowId, true);
    }

    setContent(content) {
        addWindowContent(currentSocket, this.windowId, content);
    }

    refreshHTMLData() {
        var html = getXMLData(currentSocket, this.windowId);
        this.htmlData = html;
        return html;
    }

    setHTMLData(data) {
        this.htmlData = data;
    }

    getHTMLData() {
        return this.htmlData;
    }

    setTaskbarTaskId(id) {
        this.taskbarTaskId = id;
    }

    getTaskbarTaskId() {
        return this.taskbarTaskId;
    }

    closeWindow() {
        for (var item in desktop.windows) {
            if (desktop.windows[item].getWindowId() == this.windowId) {
                delete desktop.windows[item];
            }
        }
        closeWindow(currentSocket, this);
        // remove from desktop.windows

    }
}

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});


const readline = require('readline');

const Net = require('net');
const path = require('path');
const port = 8080;

var events = require('events');
var em = new events.EventEmitter();

let connected = false;

const server = new Net.Server();
server.listen(port, function () {
    console.log(`Server listening for connection requests on socket localhost:${port}`);
});

let cli = {};
cli.guiEvents = em;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
server.on('connection', function (socket) {
    if (connected) {
        socket.write('echo "only one connection allowed"');
        socket.end();
        return;
    }
    connected = true;
    console.log('A new connection has been established.');

    setTimeout(() => {
        socket.write('echo "connected OK"');
    }, 50);



    repeatQuestion(socket);

    setTimeout(() => {
        createDesktopOnClient(socket);
    }, 1000);

    socket.on('data', function (chunk) {
        if (chunk.toString() == 'closing') {
            connected = false;
            em.removeAllListeners('guiEvent');
            return;
        }
        console.log(`Data received from client:` + chunk.toString());
        em.emit('guiEvent', chunk.toString());
    });

    socket.on('end', function () {
        console.log('Closing connection with the client');
        rl.close();
    });

    socket.on('error', function (err) {
        console.log(`${err}`);
        socket.end();
        rl.close();
        if (err.code == 'ECONNRESET') {
            console.log("Client disconnected (I guess?)");
            connected = false;
        }
    });

});
function repeatQuestion(socket) {
    rl.question('Command: ', function (execute) {
        console.log(`Command received: ${execute}`);
        if (execute.split(" ")[0] == "eval") {
            eval(execute.split(" ")[1]);
            repeatQuestion(socket);
        }
        socket.write(execute);

        repeatQuestion(socket);
    });
}

function processHtmlFromFileSync(filename) {
    var fs = require('fs');
    var html = fs.readFileSync("html-gui" + path.sep + filename + ".html", 'utf8');
    // replace \n with \\n and \r with \\r in html
    html = html.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    return html;
}

function renderOnClient(socket, filename) {
    socket.write(Date.now() + "{split}add-html " + processHtmlFromFileSync(filename));
}

function createDesktopOnClient(socket) {
    renderOnClient(socket, "taskbar");
    listenForTaskbarButtons(socket);
}

function addWindowTitle(socket, elementId, title) {
    socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}3\\0\\0{splitData}textContent{splitData}" + title);
}

function addTaskbarTask(socket, elementId, title, icon, windowId) {
    socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}0\\0\\0{splitData}textContent{splitData}" + title + "{splitInfo}" + windowId);
    // setTimeout(() => {
    //     socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}use-base-html{splitData}style{splitData}" + "");
    // }, 50);
    //socket.write(Date.now() + "{split}mod-html " + elementId + "{splitData}0\\1\\0{splitData}src{splitData}" + icon);
}

function executeJSOnClient(socket, js) {
    socket.write(Date.now() + "{split}eval " + js);
}

function createWindowOnClient(socket, windowTitle, windowIcon) {
    if (windowTitle == "") {
        windowTitle = "New Window";
    }

    renderOnClient(socket, "window-template");
    em.on('guiEvent', function (data) {
        if (data.split(" ")[0] == "window-rendered") {
            addWindowTitle(socket, data.split(" ")[2], windowTitle);
            setTimeout(() => {
                renderTaskInTaskbar(socket, { windowId: data.split(" ")[2], windowTitle: windowTitle, windowIcon: "" });
            }, 50);
            // renderTaskInTaskbar(socket, { windowId: data.split(" ")[2], windowTitle: windowTitle, windowIcon: createIcon(windowIcon) });
            em.removeListener('guiEvent', arguments.callee);
        }
    });
}

// time / id: milliseconds since epoch (Date.now()) - id of the element

// task: windowId, windowTitle, windowIcon
function renderTaskInTaskbar(socket, task) {
    renderOnClient(socket, "taskbar-task-template");
    em.on('guiEvent', function (data) {
        if (data.split(" ")[0] == "taskbar-task-rendered") {
            // addTaskbarTask(socket, data.split(" ")[1], task.windowTitle, task.windowIcon);
            addTaskbarTask(socket, data.split(" ")[1], task.windowTitle, "", task.windowId);
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
    });
}
let objects = {};
em.on('guiEvent', function (data) {
    if (data.split(" ")[0].endsWith("-rendered")) {
        objects[data.split(" ")[1]] = data.split(" ")[2];
    }
});
// 21:45 19.05.2022 - i think i gave up on this... please, someone find a way to send LARGE data over tcp without chunking...

// function createIcon(iconPath) {
//     const fs = require("fs");
//     const path = require("path");
//     return `data:image/${path.extname(iconPath).split('.').pop()};base64,${Buffer.from(fs.readFileSync(iconPath), 'binary').toString('base64')}`
// }
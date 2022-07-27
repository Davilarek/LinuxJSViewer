/// <reference path="../test-server.js" />
function createConsoleWindow(socket) {
    createWindowOnClient(socket, "Console", "console.png").then((windowId) => {
        findTaskbarTaskByWindowId(windowId, desktop.windows).setContent("test123");
        
        setWindowSize(socket, windowId, "400px", "200px");
    });
}

createConsoleWindow(currentSocket);
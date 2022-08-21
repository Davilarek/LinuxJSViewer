const express = require('express');
const bodyParser = require('body-parser');
const app = new express();

// app.use(express.static(__dirname + '/static'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
});
app.get('/index.js', (req, res) => {
    res.sendFile(__dirname + "/index.js")
});
app.get('/worker.js', (req, res) => {
    res.sendFile(__dirname + "/worker.js")
});
app.get('/img/*', (req, res) => {
    res.sendFile(__dirname + "/" + req.url)
});

// app.use(function (req, res, next) {
//     //req.setTimeout(50000, function () {
//     req.setTimeout(500, function () {
//         // call back function is called when request timed out.
//         res.sendStatus(408);
//     });
//     next();
// });

// app.post('/connect', function (req, res, next) {
//     tcpClientData = [];
//     sock = null;
//     var requestData = req.body;
//     connectUsingIp(requestData.ip, res);
// });

// app.post('/send-data', function (req, res, next) {
//     var requestData = req.body;
//     sock.write(requestData.data);
//     res.sendStatus(200);
// });
// /**
//  * @type {Array<string>}
//  */
// let tcpClientData = [];

// app.get('/request-data', function (req, res, next) {
//     console.log("Requesting data from the server...");
//     console.log(tcpClientData)
//     let timeout;
//     timeout = setInterval(function () {
//         if (tcpClientData.length > 0) {
//             console.log("Sending data to the client...");
//             res.send(tcpClientData[0]);
//             tcpClientData.splice(0, 1);
//             console.log(tcpClientData)
//             clearInterval(timeout);
//         }
//     }, 5);

//     // while (tcpClientData.length > 0) {
//     //     console.log("Sending data to the client...");
//     //     res.send(tcpClientData[0]);
//     //     tcpClientData.splice(0, 1);
//     //     console.log(tcpClientData)
//     //     break;
//     // }

//     //if (tcpClientData.length > 0) {

//     //}
// });

// let sock = null;

// app.get('/disconnect', function (req, res, next) {
//     tcpClientData = [];
//     sock.write("closing");
//     sock.end();
//     sock = null;
//     res.sendStatus(200);
// });

// function connectUsingIp(ip, res) {
//     const Net = require('net');

//     const port = ip.split(":")[1];
//     const host = ip.split(":")[0];

//     const client = new Net.Socket();

//     client.connect({ port: port, host: host }, function () {
//         console.log('TCP connection established with the server.');

//         client.write('echo "Hello, server."');

//         // if (res) {
//         //     res.sendStatus(200);
//         // }
//         sock = client;
//     });

//     // client.on('connect', function (socket) {
//     //     // If there is no error, the server has accepted the request and created a new 
//     //     // socket dedicated to us.
//     //     console.log('TCP connection established with the server.');

//     //     // The client can now send data to the server by writing to its socket.
//     //     client.write('Hello, server.');

//     // });
//     // The client can also receive data from the server by reading from its socket.
//     client.on('data', function (chunk) {

//         console.log(tcpClientData);
//         console.log(`Data received from the server: ${chunk.toString()}.`);

//         if (chunk.toString() == 'echo "only one connection allowed"') {
//             res.sendStatus(500);
//         }
//         if (chunk.toString() == 'echo "connected OK"') {
//             res.sendStatus(200);
//         }
//         tcpClientData.push(chunk.toString());
//         //client.end();
//     });

//     client.on('error', function (err) {
//         console.log(`TCP connection error: ${err.message}`);
//         if (err.message == 'read ECONNRESET') {
//             console.log('Connection crashed');
//         }
//         // if (res) {
//         //     res.sendStatus(500);
//         // }
//     });

//     client.on('end', function () {
//         console.log('Requested an end to the TCP connection');
//     });
// }

let listener = app.listen(0, () => {
    console.log(`Listening to requests on http://localhost:` + listener.address().port);
});
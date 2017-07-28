
const express = require('express');
const SocketServer = require('ws').Server;
const uuid = require('node-uuid');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

function broadcast(message){
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(message));
  });
}

const colorList = []
let clients = {}

for (var i = 0; i < 4; i++){
  randomColor = '#'+Math.floor(Math.random()*16777215).toString(16)
  colorList.push(randomColor);
}

function changeColor(){
  const index = (Math.floor(Math.random() * 4))
  return colorList[index]
}
function clientConnected(client,clientId){
  clients[clientId] ={
    id: clientId,
    type: "colorAssign",
    color: changeColor()
  }
    client.send(JSON.stringify(clients[clientId]))
    // broadcast()
}
function clientDisconnected(clientId){
  const client = clients[clientId]
  if (!client) return
  delete clients[clientId]
}
// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (client) => {
  console.log('Client connected');

  const clientId = uuid();
  clientConnected(client,clientId)

  const outMessage = {
    type: "userCountChanged",
    userCount: wss.clients.size
  }
  broadcast(outMessage)

  client.on('message', (message) =>{
    const outMessage = JSON.parse(message);
    outMessage.id = uuid();
    // let test = outMessage.content.match(/^takbot/i)
    // if (test){
    //   console.log('RegEx passed');
    // }

    switch(outMessage.type) {
      case "postMessage":
        outMessage.type = "incomingMessage";
        console.log(`User ${outMessage.username} said ${outMessage.content}`)
        break;
      case "postNotification":
        outMessage.type = "incomingNotification"
        console.log(outMessage.content)
        break;
      default:
        // show an error in the console if the message type is unknown
        throw new Error("Unknown event type " + outMessage.type);
    }
    broadcast(outMessage)
  })
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  client.on('close', () => {
    broadcast(outMessage)
    clientDisconnected(clientId);
    console.log('Client disconnected');
  })
});

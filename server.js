
const express = require('express')
const SocketServer = require('ws').Server
const uuid = require('node-uuid')

// Set the port to 3001
const PORT = 3001

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`))

// Create the WebSockets server
const wss = new SocketServer({ server })

//Broadcasting helper function to send to each client
function broadcast(message){
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(message))
  })
}

//Creates an array of randomly generated hex colors
const colorList = []
let clients = {}
const totalColors = 7
for (var i = 0 i < totalColors i++){
  randomColor = '#'+Math.floor(Math.random()*16777215).toString(16)
  colorList.push(randomColor)
}

//Returns a random colour from the colorList array
function changeColor(){
  const index = (Math.floor(Math.random() * totalColors))
  return colorList[index]
}

//Assigns colour for each user
function clientConnected(client,clientId){
  clients[clientId] = {
    id: clientId,
    type: "colorAssign",
    color: changeColor()
  }
    client.send(JSON.stringify(clients[clientId]))
}
//Updates usercount and and broadcasts
function updateClientCount(){
  const totalClientsMessage = {
      type: "userCountChanged",
      userCount: wss.clients.size
    }
  broadcast(totalClientsMessage)
}
//Assigns unique userID and updates client count upon a connection
wss.on('connection', (client) => {
  console.log('Client connected')
  const clientId = uuid()
  clientConnected(client,clientId)
  updateClientCount()

  client.on('message', (message) =>{
    const outMessage = JSON.parse(message)
    outMessage.id = uuid()
    //Regular expression to see if the message is an image link
    const imageCheck = outMessage.content.match(/https?:\/\/.*\.(jpeg|jpg|gif|png)$/mi)
    switch(outMessage.type) {
      case "postMessage":
        if (imageCheck){
          outMessage.type = "incomingImage"
          console.log(`User ${outMessage.username} sent an image`)
        break
        } else {
          outMessage.type = "incomingMessage"
          console.log(`User ${outMessage.username} said ${outMessage.content}`)
          break
        }
      case "postNotification":
        outMessage.type = "incomingNotification"
        console.log(outMessage.content)
        break
      default:
        // show an error in the console if the message type is unknown
        throw new Error("Unknown event type " + outMessage.type)
    }
    broadcast(outMessage)
  })
  //Updates client count upon client disconnection
  client.on('close', () => {
    updateClientCount()
    console.log('Client disconnected')
  })
})

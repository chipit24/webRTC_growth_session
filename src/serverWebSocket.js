'use strict';

const NodeWebSocket = require('ws');

module.exports = function initWsServer(server) {
  const wsServer = new NodeWebSocket.Server({ server: server.listener });

  function sendMessageToAllOtherClients(ws, message) {
    Array.from(wsServer.clients)
      .filter(client => client.readyState === NodeWebSocket.OPEN)
      .filter(client => client !== ws)
      .forEach(client => {
        client.send(message);
      });
  }

  wsServer.on('connection', ws => {
    sendMessageToAllOtherClients(ws, JSON.stringify({ text: 'New client connected!' }));

    ws.on('message', message => {
      sendMessageToAllOtherClients(ws, message);
    });

    ws.send(JSON.stringify({ text: 'This data is a test sent from websocket server' }));
  });
};

'use strict';

const createServer = require('./server');
const initWsServer = require('./serverWebSocket');

async function init() {
  const server = await createServer();
  initWsServer(server);
}

init();

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

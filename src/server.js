'use strict';

const Hapi = require('@hapi/hapi');
const inert = require('@hapi/inert');
const path = require('path');

module.exports = async function createServer() {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  await server.register(inert);

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, '../public'),
      },
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);

  return server;
};

module.exports = require('rc')('timetracker', {
  
  client: {

    // API endpoint
    endpoint: 'http://localhost:3000',
    // Configuration du module 'request', see https://github.com/mikeal/request
    request: {},
    token: undefined,
    
  },

  server: {

    host: 'localhost',
    port: 3000,

    secret: undefined,
    tokens: [], // JWT autorisés à utiliser l'API

    data: './timetracker.db',

    // Morgan (logger) module configuration, see https://github.com/expressjs/morgan
    logger: {}
  }

});
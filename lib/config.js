module.exports = require('rc')('timetracker', {
  
  client: {
    endpoint: 'http://localhost:3000',
    request: {
      
    }
  },

  server: {
    host: 'localhost',
    port: 3000,
    tokens: [],
    data: './timetracker.db'
  }

});
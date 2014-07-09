var request = require('request');
var moment = require('moment');
var config = require('../lib/config');
var Table = require('cli-table');
var jwt = require('jwt-simple');

// Helpers

function assertStringArg(str, name) {
  if(!(str && typeof str === 'string')) {
    console.error('Missing argument: ' + name);
    process.exit(1);
  }
}

function getSubTable(opts) {
  opts.chars = {
    'top': ' ', 'top-mid': ' ', 'top-left': ' ', 'top-right': ' ',
    'bottom': ' ', 'bottom-mid': '', 'bottom-left': ' ',
    'bottom-right': ' ', 'left': ' ', 'left-mid': ' ', 'mid': '─',
    'mid-mid': '┼', 'right': ' ', 'right-mid': ' ', 'middle': '│'
  };
  opts.style = {'padding-right': 0, 'padding-left': 0, compact: true};
  return new Table(opts);
}

function getAggregateDetails(aggregate) {
  var table = getSubTable({head: ['Start', 'Stop', 'Total']});
  aggregate.ranges.forEach(function(range) {
    var row = [
      moment(range.start).calendar(),
      moment(range.stop).calendar(),
      ''
    ];
    table.push(row); 
  });
  return table;
}

// Commands

exports.start = function(taskName) {
    
  assertStringArg(taskName, 'task');

  var params = config.client.request;
  params.url = config.client.endpoint + '/tasks/start';
  params.form = {
    name: taskName,
    start: new Date().toJSON(),
    token: this.token
  };

  request.post(params, function(err, res, body) {

    if(err) {
      console.error(err.stack);
      return process.exit(1);
    }

    if(res.statusCode >= 200 && res.statusCode < 400) {
      console.log('Task ' + taskName + ' started.');
    } else {
      console.log(body);
      process.exit(1);
    }

  });

};

exports.stop = function(taskName) {
    
  assertStringArg(taskName, 'task');

  var params = config.client.request;
  params.url = config.client.endpoint + '/tasks/stop';
  params.form = {
    name: taskName,
    stop: new Date().toJSON(),
    token: this.token
  };

  request.post(params, function(err, res, body) {

    if(err) {
      console.error(err.stack);
      return process.exit(1);
    }

    if(res.statusCode >= 200 && res.statusCode < 400) {
      console.log('Task ' + taskName + ' stopped.');
    } else {
      console.log(body);
      process.exit(1);
    }

  });

};

exports.report = function() {

  var params = config.client.request;
  params.url = config.client.endpoint + '/tasks/report';
  params.qs = {
    token: this.token
  };

  request.get(params, function(err, res, body) {

    if(err) {
      console.error(err.stack);
      return process.exit(1);
    }

    if(res.statusCode >= 200 && res.statusCode < 400) {

      body = JSON.parse(body);

      var table = new Table({
        head: ["Task", "Total", "Status"],
        style: {
          'padding-right': 0,
          'padding-left': 0,
          'head': ['blue', 'bold']
        }
      });

      Object.keys(body).forEach(function(taskName) {
        var aggregate = body[taskName];
        var duration = moment.duration(aggregate.total);
        table.push([taskName, duration.humanize(), aggregate.running ? 'Running' : 'Stopped']);
      });

      console.log(table.toString());

    } else {

      console.log(body);
      process.exit(1);

    }

  });

};

exports.generate = function(user) {

  assertStringArg(user, 'user');

  var secret = config.server.secret;

  if(!secret) {
    console.error('Your server secret is not set ! See README.');
    process.exit(1);
  }

  var token = jwt.encode({
    user: user
  }, secret);

  console.log('Token:', token);

};
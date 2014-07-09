var moment = require('moment');
var Datastore = require('nedb')
var assert = require('assert');
var config = require('./config').server;
var jwt = require('jwt-simple');

var db = new Datastore({filename: config.data, autoload: true});

// Récupération des jetons autorisés dans la configuration
var authorizedTokens = config.tokens;
if(!Array.isArray(authorizedTokens)) {
  authorizedTokens = (authorizedTokens || '').split(',');
}

// Méthode de validation du jeton
exports.checkJWT = function(req, res, next) {

  var secret = config.secret;

  if(!secret) {
    return res.send('500', {error: 'SecretNotSet'});
  }

  var decoded;
  var token = req.param('token');

  // Si le jeton est vide ou n'est pas présent dans la liste
  // des jetons autorisés, on rejette la requete
  if(!token || authorizedTokens.indexOf(token) === -1) {
    return res.send('401', {error: 'InvalidToken'});
  }
  // On tente de décoder le jeton
  try {
    decoded = jwt.decode(token, secret);
  } catch(err) {
    return res.send('401', {error: 'InvalidToken'});
  }

  req.user = decoded.user;

  return next();

};

exports.start = function(req, res) {

  var taskName = req.body.name;
  var start = req.body.start;

  try {
    assert.ok(taskName, 'Task should be defined !');
    assert.ok(moment(start).isValid(), 'Invalid date format !');
  } catch(err) {
    return res.send(400, {error: 'InvalidRequest'});
  }

  // On vérifie d'abord que la tâche n'est pas déjà en cours
  var query = {stop: {$exists: false}, user: req.user};
  db.find(query, function(err, tasks) {
    if(err) {
      return res.send(500, {error: 'UnknownError'});
    }
    if(tasks.length > 0) {
      var currentTask = tasks[0];
      return res.send(400, { error: 'TaskAlreadyRunning'});
    } else {
      var task = {
        name: taskName,
        start: new Date(start).toJSON(),
        user: req.user
      };
      db.insert(task, function(err) {
        if(err) {
          return res.send(500, {error: 'UnknownError'});
        }
        return res.send(201);
      });
    }
  });

};

exports.stop = function(req, res) {

  var taskName = req.body.name;
  var stop = req.body.stop;

  try {
    assert.ok(taskName, 'Task should be defined !');
    assert.ok(moment(stop).isValid(), 'Invalid date format !');
  } catch(err) {
    return res.send(400, {error: 'InvalidRequest'});
  }

  // On vérifie d'abord que la tâche a été démarrée
  var query = {name: taskName, stop: {$exists: false}, user: req.user};
  db.find(query, function(err, tasks) {
    if(err) {
      return res.send(500, {error: 'UnknownError'});
    }
    if(tasks.length <= 0) {
      return res.send(400, {error: 'TaskNotRunning'});
    } else {
      var taskId = tasks[0]._id;
      var update = {
        $set: {
          stop: new Date(stop).toJSON()
        }
      };
      db.update({_id: taskId}, update, {}, function(err) {
        if(err) {
          return res.send(500, {error: 'UnknownError'});
        }
        return res.send(201);
      });
    }
  });

};

exports.report = function(req, res) {

  var query = {user: req.user};

  db.find(query, function(err, tasks) {

    if(err) {
      return res.send(500, {error: 'UnknownError'});
    }

    var tasks = tasks.reduce(function(res, task) {
      var aggregate = res[task.name];
      if(!aggregate) {
        aggregate = res[task.name] = {
          ranges: [],
          total: 0,
          running: false
        }
      }
      aggregate.running = aggregate.running || !task.stop;
      aggregate.ranges.push({
        start: task.start,
        stop: task.stop
      });
      aggregate.total += moment(task.stop).diff(moment(task.start));
      return res;
    }, {});

    res.send(200, tasks);

  });

};


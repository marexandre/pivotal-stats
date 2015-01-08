'use strict';

var express = require('express');
var morgan = require('morgan');

var config = require('./config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);
var projectID = config.project_id;

var getIterationsProgress = function(data) {
  var total = data.length;
  var feature = 0;
  var chore = 0;
  var bug = 0;

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    switch (d.storyType) {
      case 'feature':
        feature += 1;
        break;
      case 'chore':
        chore += 1;
        break;
      case 'bug':
        bug += 1;
        break;
    }
  }
  return {
    total: total,
    features: feature,
    chores: chore,
    bugs:bug
  };
};

var getIterations = function(type, cb) {
  client.project(projectID).iterations.query({ 'scope': type }, function(error, data) {
    if (error) {
      console.log('[ERROR] client.project.iterations');
      console.log(error);
      cb(error, {});
    }
    else {
      console.log('iterations data items: '+ data.length);

      generateUserData(data[0].stories);

      var obj = getIterationsProgress(data[0].stories);
      cb(null, obj);
    }
  });
};

var generateUserData = function(data) {
  var users = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    // console.log('points: '+ d.estimate, ', owned_by: '+ d.ownedById, ', owners: '+ JSON.stringify(d.ownerIds));

    if (! d.ownedById) {
      continue;
    }

    if (! users.hasOwnProperty(d.ownedById)) {
      users[d.ownedById] = {
        features: [],
        chores: [],
        bugs: []
      };
    }

    switch (d.storyType) {
      case 'feature':
        users[d.ownedById].features.push({
          'id': d.id,
          'state': d.current_state,
          'estimate': d.estimate
        });
        break;
      case 'chore':
        users[d.ownedById].chores.push({
          'id': d.id,
          'state': d.current_state
        });
        break;
      case 'bug':
        users[d.ownedById].bugs.push({
          'id': d.id,
          'state': d.current_state
        });
        break;
    }
  }

  console.log(JSON.stringify(users));
};

var isValidIterationsType = function(t) {
  return t === 'done' || t === 'current' || t === 'backlog' || t === 'current_backlog';
};

/**
 * API
 */
var api = express()
  .get('/iterations/:type', function(req, res) {
    var type = req.params.type;

    if (! isValidIterationsType(type)) {
      return res.json({ message: type + ' is invalid iterations type' });
    }

    getIterations(type, function(error, data) {
      res.json({ data: data });
    });
  });

/**
 * Web App
 */
var app = express();
app.use('/api', api);
app.use(morgan("dev", { immediate: true }));
app.use(express.static(__dirname + '/public'));

// app.get('/', function (req, res) {
//   res.send('Hello World');
// });

var port = process.env.PORT || 8999;
app.listen(port, function() {
  console.log('Point your browser at http://localhost:'+ port);
});

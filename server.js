'use strict';

var _ = require('underscore');
var helper = require('./helpers/helpers.js');
var config = require('./config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);
var projectID = config.project_id;

var express = require('express');
var morgan = require('morgan');

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

      cb(null, data);
    }
  });
};

var usersData = require('./data/user_data.json');
var generateUserData = function(type, data) {
  var users = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    // console.log('points: '+ d.estimate, ', owned_by: '+ d.ownedById, ', owners: '+ JSON.stringify(d.ownerIds));

    if (! d.ownedById) {
      continue;
    }

    if (! users.hasOwnProperty(d.ownedById)) {
      users[d.ownedById] = {
        id: d.ownedById
      };
      users[d.ownedById][type] = {
        features: [],
        chores: [],
        bugs: []
      };

      if (usersData[d.ownedById]) {
        users[d.ownedById].name = usersData[d.ownedById].name;
        users[d.ownedById].initials = usersData[d.ownedById].initials;
      }
    }

    switch (d.storyType) {
      case 'feature':
        users[d.ownedById][type].features.push({
          'id': d.id,
          'state': d.current_state,
          'estimate': d.estimate
        });
        break;
      case 'chore':
        users[d.ownedById][type].chores.push({
          'id': d.id,
          'state': d.current_state
        });
        break;
      case 'bug':
        users[d.ownedById][type].bugs.push({
          'id': d.id,
          'state': d.current_state
        });
        break;
    }
  }
  // return users;

  var tmp = [];
  for (var key in users) {
    tmp.push(users[key]);
  }

  return tmp;
};

var isValidIterationsType = function(t) {
  return t === 'done' || t === 'current' || t === 'backlog' || t === 'current_backlog';
};

var merge = function() {
  var obj = {};
  var key;
  for (var i = 0, imax; i < arguments.length; i++) {
    for (key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        obj[key] = arguments[i][key];
      }
    }
  }
  return obj;
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
      var obj = getIterationsProgress(data[0].stories);

      res.json({ data: obj });
    });
  })
  .get('/user_stats', function(req, res) {
    getIterations('current_backlog', function(error, data) {
      // var obj = data;
      var current = generateUserData('current', data[0].stories);
      var backlog = generateUserData('backlog', data[1].stories);
      var list = [current, backlog];
      list = _.flatten(list);
      list = _.groupBy(list, 'id');

      for (var key in list) {
        var l = list[key];
        var tmp = {};

        for (var i = 0, imax = l.length; i < imax; i++) {
          if (imax === 1) {
            tmp = merge(tmp, l[i]);
          } else {
            tmp = merge(tmp, l[i], l[i + 1]);
          }
        }
        list[key] = tmp;
      }

      // helper.saveJsonToFile('./data/current_backlog_data.json', list);

      res.json({ data: list });
    });
  });

/**
 * Web App
 */
var app = express();
app.use('/api', api);
app.use(morgan('dev', { immediate: true }));
app.use(express.static(__dirname + '/public'));

// app.get('/', function (req, res) {
//   res.send('Hello World');
// });

var port = process.env.PORT || 8999;
app.listen(port, function() {
  console.log('Point your browser at http://localhost:'+ port);
});

'use strict';

var _ = require('underscore');
var async = require('async');
var utils = require('./utils');
var helper = require('../helpers/helpers');

var pivotal = require('./pivotal');
var config = require('../config.json');

// GET /projects
exports.projects = function(req, res) {
  pivotal.getProjects(function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    data = _.sortBy(data, function(o) {
      return o.id;
    });

    res.json({ data: data });
  });
};

// GET /project/:id
exports.project = function(req, res) {
  var id = req.params.id;

  pivotal.getProject(id, function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    res.json({ data: data });
  });
};


/**
 * getIterationsProgress returnes an object with each iteration type counts
 * @param  {Object} data Stories object that is returend from pivotal.getIterations
 * @return {Object}      Object containing each iteration type count
 */
var getIterationsProgress = function(data) {
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
    total   : feature + chore + bug,
    features: feature,
    chores  : chore,
    bugs    : bug
  };
};


// GET /iterations/:project/:type
exports.iterations = function(req, res) {
  var project = req.params.project;
  var type = req.params.type;

  console.log(project);
  console.log(type);

  if (! utils.isValidIterationsType(type)) {
    return res.json({ message: type + ' is invalid iterations type' });
  }

  pivotal.getIterations(project, type, function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    if (data.length === 0) {
      res.json({ data: {
          total   : 0,
          features: 0,
          chores  : 0,
          bugs    : 0
        }
      });
      return;
    }

    var obj = getIterationsProgress(data[0].stories);
    res.json({ data: obj });
  });
};



var usersData = require('../data/user_data.json');
var generateUserData = function(id, type, data) {
  var users = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    // console.log('points: '+ d.estimate, ', owned_by: '+ d.ownedById, ', owners: '+ JSON.stringify(d.ownerIds));

    // if (! d.ownedById || ! usersData[d.ownedById]) {
    if (! d.ownedById) {
      continue;
    }

    for (var j = 0, jmax = d.ownerIds.length; j < jmax; j++) {
      var userID = d.ownerIds[j];
      if (! users.hasOwnProperty(userID)) {
        users[userID] = {
          id: userID
        };
        users[userID][type] = {
          features: [],
          chores: [],
          bugs: []
        };

        if (usersData[userID]) {
          users[userID].name = usersData[userID].name;
          users[userID].initials = usersData[userID].initials;
        }
      }

      switch (d.storyType) {
        case 'feature':
          users[userID][type].features.push({
            'project': id,
            'id': d.id,
            'state': d.currentState,
            // 'estimate': d.estimate
            'estimate': parseInt((d.estimate / jmax) * 10, 10) / 10
          });
          break;
        case 'chore':
          users[userID][type].chores.push({
            'project': id,
            'id': d.id,
            'state': d.currentState
          });
          break;
        case 'bug':
          users[userID][type].bugs.push({
            'project': id,
            'id': d.id,
            'state': d.currentState
          });
          break;
      }
    }
  }

  var tmp = [];
  for (var key in users) {
    tmp.push(users[key]);
  }

  return tmp;
};


var getUserStats = function(id, cb) {
  pivotal.getIterations(id, 'current_backlog', function(error, data) {
    if (error) {
      cb(error, []);
      return;
    }

    var current = [];
    if (data[0]) {
      current = generateUserData(id, 'current', data[0].stories);
    }
    var backlog = [];
    if (data[1]) {
      backlog = generateUserData(id, 'backlog', data[1].stories);
    }
    var list = [current, backlog];
    // list = _.flatten(list);
    // list = _.groupBy(list, 'id');
    // list = utils.flatten(list);

    // helper.saveJsonToFile('./data/current_backlog_data.json', list);

    cb(null, list);
  });
};

// GET /user_stats
exports.userStats = function(req, res) {
  var id = req.params.id;

  getUserStats(id, function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    data = _.flatten(data);
    data = _.groupBy(data, 'id');
    data = utils.flatten(data);

    res.json({ data: data });
  });
};


exports.userFullStats = function(req, res) {
  pivotal.getProjects(function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    var asyncTasks = [];

    data.forEach(function(obj) {
      // console.log( obj.id );

      asyncTasks.push(function(cb) {
        getUserStats(obj.id, function(error, data) {
          if (error) {
            cb(error, []);
          }
          cb(null, _.flatten(data));
        });
      });
    });

    async.parallel(asyncTasks, function(error, response) {
      if (error) {
        res.json(error, []);
        return;
      }
      response = _.flatten(response, true);
      response = _.groupBy(response, 'id');
      response = utils.flatten(response);

      // helper.saveJsonToFile('./data/all_user_stats.json', response);

      res.json({ data: response });
    });

  });
};

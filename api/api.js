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
  var state = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];

    if (! state.hasOwnProperty(d.currentState)) {
      state[d.currentState] = {
        total   : 0,
        features: 0,
        chores  : 0,
        bugs    : 0
      };
    }

    switch (d.storyType) {
      case 'feature':
        feature += 1;
        state[d.currentState].features += 1;
        state[d.currentState].total += 1;
        break;
      case 'chore':
        chore += 1;
        state[d.currentState].chores += 1;
        state[d.currentState].total += 1;
        break;
      case 'bug':
        bug += 1;
        state[d.currentState].bugs += 1;
        state[d.currentState].total += 1;
        break;
    }
  }
  return {
    total   : feature + chore + bug,
    features: feature,
    chores  : chore,
    bugs    : bug,
    state: state
  };
};


// GET /iterations/:project/:scope/:offset
exports.iterations = function(req, res) {
  var project = req.params.project;
  var scope = req.params.scope;
  var offset = 0;
  var limit = 1;

  if (req.params.offset) {
    offset = -req.params.offset;
    limit = req.params.offset;
  }

  if (! utils.isValidIterationsType(scope)) {
    return res.json({ message: scope + ' is invalid iterations scope' });
  }

  var query = {
    'scope': scope,
    'offset': offset,
    'limit': limit
  };
  pivotal.getIterations(project, query, function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    if (data.length === 0) {
      res.json({ data: [{
          total   : 0,
          features: 0,
          chores  : 0,
          bugs    : 0
        }]
      });
      return;
    }

    var list = [];
    for (var i = 0, imax = data.length; i < imax; i++) {
      var obj = getIterationsProgress(data[i].stories);
      obj.start = data[i].start;
      obj.finish = data[i].finish;
      list.push(obj);
    }

    res.json({ data: list });
  });
};


var generateUserData = function(userList, projectId, type, data) {
  var users = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    // console.log('points: '+ d.estimate, ', owned_by: '+ d.ownedById, ', owners: '+ JSON.stringify(d.ownerIds));

    // if (! d.ownedById || ! userList[d.ownedById]) {
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

        if (userList[userID]) {
          users[userID].name = userList[userID].name;
          users[userID].initials = userList[userID].initials;
        }
      }

      d.project = projectId;

      switch (d.storyType) {
        case 'feature':
          d.estimate = getEstimate(d.estimate, jmax);
          users[userID][type].features.push(d);
          break;
        case 'chore':
          d.estimate = getEstimate(1, jmax);
          users[userID][type].chores.push(d);
          break;
        case 'bug':
          d.estimate = getEstimate(1, jmax);
          users[userID][type].bugs.push(d);
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

var getEstimate = function(pt, users) {
  var e = parseInt((pt / users) * 10, 10);
  if (e < 5) {
    e = 5;
  }
  return e / 10;
};


var getUserStats = function(projectId, cb) {
  pivotal.getProjectUsers(projectId, function(error, userList) {
    if (error) {
      cb(error, []);
      return;
    }

    pivotal.getIterations(projectId, { 'scope': 'current_backlog' }, function(error, data) {
      if (error) {
        cb(error, []);
        return;
      }

      var current = [];
      if (data[0]) {
        current = generateUserData(userList, projectId, 'current', data[0].stories);
      }
      var backlog = [];
      if (data[1]) {
        backlog = generateUserData(userList, projectId, 'backlog', data[1].stories);
      }

      cb(null, [current, backlog]);
    });
  });
};

// GET /user_stats
exports.userStats = function(req, res) {
  var projectId = req.params.project_id;

  getUserStats(projectId, function(error, data) {
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

// GET /user_full_stats
exports.userFullStats = function(req, res) {
  pivotal.getProjects(function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    var asyncTasks = [];

    data.forEach(function(obj) {
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

      res.json({ data: response });
    });

  });
};




/*
var getUserHistory = function(projectId, offset, cb) {
  pivotal.getIterations(projectId, { 'scope': 'done', 'offset': -offset, 'limit': offset }, function(error, data) {
    if (error) {
      cb(error, []);
      return;
    }

    var list = [];
    for (var i = 0, imax = data.length; i < imax; i++) {
      // helper.saveJsonToFile('./data/test/user_history_'+ projectId +'_'+ i +'.json', data[i]);

      var userData = generateUserData(projectId, 'done', data[i].stories);
      for (var ii = 0, iimax = userData.length; ii < iimax; ii++) {
        userData[ii].done.features = userData[ii].done.features.length;
        userData[ii].done.chores = userData[ii].done.chores.length;
        userData[ii].done.bugs = userData[ii].done.bugs.length;
      }

      list.push(userData);
    }

    cb(null, list);
  });
};

var getUserHistoryList = function(data, userId) {
  var userData = [];
  var hadData = false;
  for (var i = 0, imax = data.length; i < imax; i++) {
    for (var j = 0, jmax = data[i].length; j < jmax; j++) {
      if (data[i][j].id === userId) {
        userData.push( data[i][j].done );
        hadData = true;
        break;
      }
    }

    if (! hadData) {
      userData.push({
        "features": 0,
        "chores": 0,
        "bugs": 0
      });
    }
    hadData = false;
  }
  return userData;
};

exports.userHistory = function(req, res) {
  var userId = parseInt(req.params.user_id, 10);
  var offset = parseInt(req.params.offset, 10);

  getUserHistory(969040, offset, function(error, data) {
    if (error) {
      cb(error, []);
    }
    var userData = getUserHistoryList(data, userId);
    // helper.saveJsonToFile('./data/user_history.json', data);
    res.json({ data: userData });
  });
};
*/

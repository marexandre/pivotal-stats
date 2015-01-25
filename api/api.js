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

  console.log(project);
  console.log(scope);
  console.log(offset);
  console.log(limit);

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
      res.json({ data: {
          total   : 0,
          features: 0,
          chores  : 0,
          bugs    : 0
        }
      });
      return;
    }

    var list = [];
    console.log('size: '+ data.length);
    for (var i = 0, imax = data.length; i < imax; i++) {
      var obj = getIterationsProgress(data[i].stories);
      obj.start = data[i].start;
      obj.finish = data[i].finish;
      list.push(obj);
    }

    res.json({ data: list });
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

      d.project = id;

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
  pivotal.getIterations(projectId, { 'scope': 'current_backlog' }, function(error, data) {
    if (error) {
      cb(error, []);
      return;
    }

    var current = [];
    if (data[0]) {
      current = generateUserData(projectId, 'current', data[0].stories);
    }
    var backlog = [];
    if (data[1]) {
      backlog = generateUserData(projectId, 'backlog', data[1].stories);
    }

    cb(null, [current, backlog]);
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

var getUserHistory = function(projectId, offset, cb) {
  pivotal.getIterations(projectId, { 'scope': 'done', 'offset': -offset, 'limit': offset }, function(error, data) {
    if (error) {
      cb(error, []);
      return;
    }

    var list = [];
    for (var i = 0, imax = data.length; i < imax; i++) {
      list.push(generateUserData(projectId, 'done', data[i].stories));
    }

    cb(null, list);
  });
};

exports.userHistory = function(req, res) {
  var userId = req.params.user_id;
  var offset = req.params.offset;

  pivotal.getProjects(function(error, data) {
    if (error) {
      res.json(error);
      return;
    }

    var asyncTasks = [];

    data.forEach(function(obj) {

      asyncTasks.push(function(cb) {
        getUserHistory(obj.id, offset, function(error, data) {
          if (error) {
            cb(error, []);
          }
          cb(null, _.flatten(data, true));
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

      // helper.saveJsonToFile('./data/user_history.json', response);

      // res.json({ data: response[userId] });
      res.json({ data: response });
    });

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

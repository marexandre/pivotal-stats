
var config = require('../config.json');

var _ = require('underscore');
// var helper = require('../helpers/helpers');
var utils = require('./utils');
var iterations = require('./iterations');

var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);
var projectID = config.project_id;


/**
 * getIterationsProgress returnes an object with each iteration type counts
 * @param  {Object} data Stories object that is returend from iterations.getIterations
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


// GET iterations/:type
exports.iterations = function(req, res) {
  var type = req.params.type;

  if (! utils.isValidIterationsType(type)) {
    return res.json({ message: type + ' is invalid iterations type' });
  }

  iterations.getIterations(projectID, type, function(error, data) {
    var obj = getIterationsProgress(data[0].stories);

    res.json({ data: obj });
  });
};



var usersData = require('../data/user_data.json');
var generateUserData = function(type, data) {
  var users = {};

  for (var i = 0, imax = data.length; i < imax; i++) {
    var d = data[i];
    // console.log('points: '+ d.estimate, ', owned_by: '+ d.ownedById, ', owners: '+ JSON.stringify(d.ownerIds));

    // if (! d.ownedById || ! usersData[d.ownedById]) {
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

  var tmp = [];
  for (var key in users) {
    tmp.push(users[key]);
  }

  return tmp;
};

// GET /user_stats
exports.userStats = function(req, res) {
  iterations.getIterations(projectID, 'current_backlog', function(error, data) {
    // var obj = data;
    var current = generateUserData('current', data[0].stories);
    var backlog = generateUserData('backlog', data[1].stories);
    var list = [current, backlog];
    list = _.flatten(list);
    list = _.groupBy(list, 'id');
    list = utils.flatten(list);

    // helper.saveJsonToFile('./data/current_backlog_data.json', list);

    res.json({ data: list });
  });
};

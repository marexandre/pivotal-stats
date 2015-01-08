var _ = require('underscore');
var config = require('./config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);
var projectID = config.project_id;

var helper = require('./helpers/helpers.js');

client.project(projectID).memberships.all(function(error, data) {

  if (error) {
    console.log(error);
  }
  else {
    var users = [];

    for (var i = 0, imax = data.length; i < imax; i++) {
      users.push(data[i].person);
    }
    users = _.indexBy(users, 'id');

    helper.saveJsonToFile('./data/user_data.json', users);
  }

});

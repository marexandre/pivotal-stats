'use strict';

var _ = require('underscore');
var config = require('../config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);


var getProjectResponseData = function(data) {
  return {
    id: data.id,
    name: data.name,
    startDate: data.startDate,
    startTime: data.startTime,
    pointScale: data.pointScale,
    iterationLength: data.iterationLength
  };
};

/**
 * getProject get's project data from specified ID
 * @param  {Int}   id Project id
 * @param  {Function} cb Callback
 */
exports.getProject = function(id, cb) {
  client.project(id).get(function(error, data) {
    if (error) {
      console.log('[ERROR] client.project.get');
      console.log(error);
      cb(error, []);
      return;
    }

    cb(null, getProjectResponseData(data));
  });
};

/**
 * getProjects get's all the projects basic info from pivotal
 * @param  {Function} cb Callback
 */
exports.getProjects = function(cb) {
  client.projects.all(function(error, data) {
    if (error) {
      console.log('[ERROR] client.projects.all');
      console.log(error);
      cb(error, []);
      return;
    }

    var list = [];
    data.forEach(function(obj) {
      list.push(getProjectResponseData(obj));
    });

    cb(null, list);
  });
};

/**
 * getIterations returan a specific projects iterations on given type
 * @param  {Int}   id   Project ID
 * @param  {Object}   obj  Query object
 * @param  {Function} cb   Callback
 */
exports.getIterations = function(id, obj, cb) {
  client.project(id).iterations.query(obj, function(error, data) {
    if (error) {
      console.log('[ERROR] client.project('+ id +').iterations.query');
      console.log(error);
      cb(error, {});
      return;
    }

    cb(null, data);
  });
};

/**
 * getUserList returns a list of users for a given project
 * @param {[type]}   projectId [description]
 * @param {Function} cb        [description]
 */
exports.getProjectUsers = function(id, cb) {
  var users = [];

  client.project(id).memberships.all(function(error, data) {
    if (error) {
      console.log('[ERROR] client.project('+ id +').memberships.all');
      console.log(error);
      cb(error, users);
      return;
    }

    for (var i = 0, imax = data.length; i < imax; i++) {
      users.push(data[i].person);
    }
    users = _.indexBy(users, 'id');

    cb(null, users);
  });
};

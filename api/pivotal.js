var config = require('../config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);

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

    var obj = {
      id: data.id,
      name: data.name,
      pointScale: data.pointScale,
      iterationLength: data.iterationLength
    };

    cb(null, obj);
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
    data.forEach(function(o) {
      list.push({
        id: o.id,
        name: o.name,
        pointScale: o.pointScale,
        iterationLength: o.iterationLength
      });
    });

    cb(null, list);
  });
};

/**
 * getIterations returan a specific projects iterations on given type
 * @param  {Int}   id   Project ID
 * @param  {String}   type Iteration type: done, current, backlog, current_backlog
 * @param  {Function} cb   Callback
 */
exports.getIterations = function(id, type, cb) {
  client.project(id).iterations.query({ 'scope': type }, function(error, data) {
    if (error) {
      console.log('[ERROR] client.project('+ id +').iterations.query');
      console.log(error);
      cb(error, {});
      return;
    }

    console.log('iterations data items: '+ data.length);
    cb(null, data);
  });
};

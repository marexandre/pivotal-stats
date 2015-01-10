var config = require('../config.json');
var tracker = require('pivotaltracker');
var client = new tracker.Client(config.token);

/**
 * getIterations returan a specific projects iterations on given type
 * @param  {Int}   id   Project ID
 * @param  {String}   type Iteration type: done, current, backlog, current_backlog
 * @param  {Function} cb   Callback
 */
exports.getIterations = function(id, type, cb) {
  client.project(id).iterations.query({ 'scope': type }, function(error, data) {
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

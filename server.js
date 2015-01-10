'use strict';

var express = require('express');
var morgan = require('morgan');
var API = require('./api/api');

/**
 * API
 */
var api = express()
  .get('/projects', API.projects)
  .get('/iterations/:type', API.iterations)
  .get('/user_stats', API.userStats);

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

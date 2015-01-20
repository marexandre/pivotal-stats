'use strict';

var express = require('express');
var morgan = require('morgan');
var API = require('./api/api');
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });


/**
 * API
 */
var api = express()
  .get('/projects', API.projects)
  .get('/project/:id', API.project)
  .get('/iterations/:project/:scope', API.iterations)
  .get('/iterations/:project/:scope/:offset/:limit', API.iterations)
  .get('/user_stats/:id', API.userStats)
  .get('/user_full_stats', API.userFullStats);

/**
 * Web App
 */
var app = express();
app.use('/api', api);
app.use(morgan('dev', { immediate: true }));
app.use(express.static(__dirname + '/public'));

app
  .engine('ect', ectRenderer.render)
  .set('view engine', 'ect')
  .get('/', function (req, res){
    res.render('index');
  })
  .get('/project/:id', function (req, res) {
    res.render('project');
  })
  .get('/users', function (req, res) {
    res.render('users');
  })

var port = process.env.PORT || 8999;
app.listen(port, function() {
  console.log('Point your browser at http://localhost:'+ port);
});

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
  .get('/iterations/:project/:scope/:offset', API.iterations)
  .get('/user_stats/:project_id', API.userStats)
  // .get('/user_history/:user_id/:offset', API.userHistory)
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
    res.render('project', {
      projectId: parseInt(req.params.id, 10)
    });
  })
  .get('/users', function (req, res) {
    res.render('users');
  });
  // .get('/history/:user_id', function (req, res) {
  //   res.render('history', {
  //     userId: parseInt(req.params.user_id, 10)
  //   });
  // });

var port = process.env.PORT || 8999;
app.listen(port, function() {
  console.log('Point your browser at http://localhost:'+ port);
});

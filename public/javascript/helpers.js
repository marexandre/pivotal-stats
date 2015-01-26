'use strict';

Date.prototype.getWeekNumber = function() {
  var d = new Date(+this);
  d.setHours(0,0,0);
  d.setDate(d.getDate()+4-(d.getDay()||7));
  return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

Handlebars.registerHelper('if_eq', function(a, b, opts) {
  if(a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

Handlebars.registerHelper('if_not', function(a, b, opts) {
  if(a !== b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    "+": lvalue + rvalue,
    "-": lvalue - rvalue,
    "*": lvalue * rvalue,
    "/": lvalue / rvalue,
    "%": lvalue % rvalue
  }[operator];
});

var getObjectSize = function(obj) {
  var s = 0;
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      s++;
    }
  }
  return s;
};

var initHighcharts = function($target, type, data) {
  $target.highcharts({
    exporting: { enabled: false },
    credits: { enabled: false },
    title: { text: '' },
    // tooltip: { enabled: false },
    tooltip: {
      pointFormat: '{point.percentage:.1f}% ({point.y}/{point.total})'
    },
    plotOptions: {
      pie: {
        size: '100%',
        animation: false,
        allowPointSelect: false,
        cursor: null,
        dataLabels: {
          enabled: false
        }
      },
      series: {
        states: {
          hover: { enabled: false }
        }
      }
    },
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      margin: [0, 0, 0, 0],
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0
    },
    series: [{
      showInLegend: false,
      type: 'pie',
      name: 'current',
      data: [
        {
          name: 'features',
          y: data.features,
          color: '#1CAD7E'
        },
        {
          name: 'chores',
          y: data.chores,
          color: '#4D4843'
        },
        {
          name: 'bugs',
          y: data.bugs,
          color: '#EA5E47'
        },
      ]
    }]
  });
};

var buildProjectHistoryChart = function($target, data) {
  $target.highcharts({
    chart: {
      type: 'line'
      // type: 'column'
    },
    exporting: { enabled: false },
    credits: { enabled: false },
    legend: { enabled: false },
    title: { text: '' },
    xAxis: {
      categories: data.weeks,
      labels: {
        format: 'w{value}'
      }
    },
    yAxis: {
      title: { text: '' },
      min: 0
    },
    tooltip: {
      headerFormat: '<span style="font-size: 10px;">Week {point.key}</span><br/>',
      valueSuffix: ''
    },
    // plotOptions: {
    //   column: {
    //     stacking: 'normal'
    //   }
    // },
    series: [{
      name: 'features',
      data: data.features,
      color: '#1CAD7E'
    }, {
      name: 'chores',
      data: data.chores,
      color: '#4D4843'
    }, {
      name: 'bugs',
      data: data.bugs,
      color: '#EA5E47'
    }]
  });
};

var getProjectIteration = function(data, type, cb) {
  $.ajax({
    url: '/api/iterations/'+ data.id +'/'+ type,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    var obj = res.data[0];
    obj.name = data.name;
    cb(obj);
  });
};

var getUserStats = function(id, cb) {
  $.ajax({
    url: '/api/user_stats/'+ id,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    cb(res);
  });
};

var createGraph = function($target, id, type) {
  $.ajax({
    url: '/api/iterations/'+ id +'/'+ type,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    initHighcharts($target.find('.pie'), type, res.data[0]);
  });
};

var createUserStats = function(data) {
  var source = $("#user-stats-template").html();
  var template = Handlebars.compile(source);
  var html     = template(data);
  $('.users').html(html);
};

var getGraph = function(data, type) {
  getProjectIteration(data, type, function(d) {
    var $t = $('#'+ d.name).find('.'+ type);
    $t.find('.total-count').html(d.total);
    initHighcharts($t.find('.pie'), type, d);
  });
};

var getCurrentGraph = function(data) {
  getProjectIteration(data, 'current', function(d) {
    // In progress stories
    var $inProgress = $('#'+ d.name).find('.current');
    var inProgress = {
      total   : d.total - d.state.accepted.total,
      features: d.features - d.state.accepted.features,
      chores  : d.chores - d.state.accepted.chores,
      bugs    : d.bugs - d.state.accepted.bugs
    };
    $inProgress.find('.total-count').html(inProgress.total);
    initHighcharts($inProgress.find('.pie'), 'current', inProgress);

    // Accepted stories
    var $accepted = $('#'+ d.name).find('.done');
    $accepted.find('.total').html('accepted: '+ d.state.accepted.total);
    initHighcharts($accepted.find('.pie'), 'done', d.state.accepted);
  });
};

var onProjectDataLoadComplete = function(data) {
  var source = $("#projects-template").html();
  var template = Handlebars.compile(source);
  var html     = template(data);
  $('.project-list').html(html);

  for (var i = 0, imax = data.length; i < imax; i++) {
    getGraph(data[i], 'backlog');
    getGraph(data[i], 'current');
    getGraph(data[i], 'done');
  }
};

var filterObjectByType = function(data, type) {
  var l = [];
  for (var i = 0, imax = data.length; i < imax; i++) {
    if (data[i].hasOwnProperty(type)) {
      l.push(data[i][type]);
    }
  }
  return l;
};

var getWeekList = function(data) {
  var l = [];
  for (var i = 0, imax = data.length; i < imax; i++) {
    l.push(new Date(data[i].start).getWeekNumber());
  }
  return l;
};

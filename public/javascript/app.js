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

var initHighcharts = function($target, type, data) {
  $target.highcharts({
    title: { text: type + ': '+ data.total },
    exporting: { enabled: false },
    credits: { enabled: false },
    // tooltip: { enabled: false },
    tooltip: {
      pointFormat: '{point.percentage:.1f}% ({point.y}/{point.total})'
    },
    plotOptions: {
      pie: {
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
      plotShadow: false
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

var createGraph = function($target, type) {
  $.ajax({
    url: 'http://localhost:8999/api/iterations/'+ type,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    initHighcharts($target, type, res.data);
  });
};

var createUserStats = function(data) {
  var html = [];

  var source   = $('#user-stats-template-2').html();
  var template = Handlebars.compile(source);
  var html     = template(data);
  $('.users').html(html);
};

$(function() {
  createGraph($('#container1'), 'backlog');
  createGraph($('#container2'), 'current');
  createGraph($('#container3'), 'done');

  $.ajax({
    url: 'http://localhost:8999/api/user_stats',
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    createUserStats(res);
  });
});

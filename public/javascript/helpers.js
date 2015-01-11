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
    title: { text: '' },
    exporting: { enabled: false },
    credits: { enabled: false },
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

var getProjectIteration = function(data, type, cb) {
  $.ajax({
    url: 'http://localhost:8999/api/iterations/'+ data.id +'/'+ type,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    var obj = res.data;
    obj.name = data.name;
    cb(obj);
  });
};

var getUserStats = function(id, cb) {
  $.ajax({
    url: 'http://localhost:8999/api/user_stats/'+ id,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    cb(res);
  });
};

var createGraph = function($target, id, type) {
  $.ajax({
    url: 'http://localhost:8999/api/iterations/'+ id +'/'+ type,
    type: 'GET',
    dataType: 'json'
  }).done(function(res) {
    initHighcharts($target.find('.pie'), type, res.data);
  });
};

var createUserStats = function(data) {
  var html = [];

  getTemplate('user-stats-template.handlebars', function(source) {
    var template = Handlebars.compile(source);
    var html     = template(data);
    $('.users').html(html);
  });
};

var getGraph = function(data, type) {
  getProjectIteration(data, type, function(d) {
    var $t = $('#'+ d.name).find('.'+ type);
    $t.find('.total-count').html(d.total);
    initHighcharts($t.find('.pie'), type, d);
  });
};

var getTemplate = function(name, cb) {
  $.ajax({
    url: '/handlebars/'+ name,
    type: 'GET'
  }).done(function(res) {
    cb(res);
  });
};

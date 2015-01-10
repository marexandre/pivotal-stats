
exports.isValidIterationsType = function(t) {
  return t === 'done' || t === 'current' || t === 'backlog' || t === 'current_backlog';
};

/**
 * [flatten description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
var flatten = function(list) {
  for (var key in list) {
    var l = list[key];

    var current = {
      features: [],
      chores: [],
      bugs: []
    };
    var backlog = {
      features: [],
      chores: [],
      bugs: []
    };

    for (var i = 0, imax = l.length; i < imax; i++) {
      if (l[i].hasOwnProperty('current')) {
        current.features =  current.features.concat(l[i].current.features);
        current.chores = current.chores.concat(l[i].current.chores);
        current.bugs = current.bugs.concat(l[i].current.bugs);
      }
      if (l[i].hasOwnProperty('backlog')) {
        backlog.features =  backlog.features.concat(l[i].backlog.features);
        backlog.chores = backlog.chores.concat(l[i].backlog.chores);
        backlog.bugs = backlog.bugs.concat(l[i].backlog.bugs);
      }
    }

    list[key] = {
      id: l[0].id,
      name: l[0].name,
      initials: l[0].initials,
      current: current,
      backlog: backlog
    };
  }

  return list;
};
exports.flatten = flatten;

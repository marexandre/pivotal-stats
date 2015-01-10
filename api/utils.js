
exports.isValidIterationsType = function(t) {
  return t === 'done' || t === 'current' || t === 'backlog' || t === 'current_backlog';
};

/**
 * merge merges  multiple objects into one
 * @return {Object} Merged object
 */
var merge = function() {
  var obj = {};
  var key;
  for (var i = 0, imax; i < arguments.length; i++) {
    for (key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        obj[key] = arguments[i][key];
      }
    }
  }
  return obj;
};
exports.merge = merge;

/**
 * [flatten description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
var flatten = function(list) {
  for (var key in list) {
    var l = list[key];
    var tmp = {};

    for (var i = 0, imax = l.length; i < imax; i++) {
      if (imax === 1) {
        tmp = merge(tmp, l[i]);
      } else {
        tmp = merge(tmp, l[i], l[i + 1]);
      }
    }
    list[key] = tmp;
  }

  return list;
};
exports.flatten = flatten;

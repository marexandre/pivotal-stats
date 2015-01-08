var fs = require('fs');

exports.saveJsonToFile = function(fileName, jsonData) {
  // Savedata to JSON file
  console.log('Save JSON to... ' + fileName);
  fs.writeFile(fileName, JSON.stringify(jsonData), function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('JSON saved to ' + fileName);
    }
  });
};

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

exports.flatten = function(list) {
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

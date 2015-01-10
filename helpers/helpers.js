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

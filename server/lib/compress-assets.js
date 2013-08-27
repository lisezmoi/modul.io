const CLIENT_SCRIPTS_JSON = __dirname + '/../../client/scripts.json';
const CLIENT_SCRIPTS_PATH = __dirname + '/../../client/scripts';
const FINAL_SCRIPT_PATH = CLIENT_SCRIPTS_PATH + '/mio.js';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');

function compressJsFiles(cb) {
  var uglifyResult = null;
  var scripts = require(CLIENT_SCRIPTS_JSON).app;
  scripts = _.map(scripts, function(script) {
    return path.resolve(CLIENT_SCRIPTS_PATH + '/' + script);
  });
  uglifyResult = uglifyjs.minify(scripts, {
    outSourceMap: 'mio.js.map'
  });
  fs.writeFile(FINAL_SCRIPT_PATH, uglifyResult.code, 'utf8', function(err) {
    if (err) throw err;
    if (cb) cb();
  });
}

module.exports = {
  js: compressJsFiles
};


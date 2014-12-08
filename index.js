/* jshint node:true */

var fs = require('fs');
var extend = require('util')._extend;
var to5 = require('6to5');
var q = require('q');
var tmp = require('tmp');

var PER_FILE_OPTIONS = [
  'filename',
  'sourceMapName',
  'sourceFileName'
];

/**
 * Configures the plugin to transpile ES6 to ES5
 *
 * @param {Object} pluginConfig The configuration for this plugin.
 * @param {Object} runnerConfig The configuration for the runner.
 * @public
 */
function setup(pluginConfig, runnerConfig) {
  return q.all(runnerConfig.specs.map(function(path, i) {
    console.log('Processing "%s".', path);
    return transform(path, pluginConfig)
      .then(function(tmpPath) {
        runnerConfig.specs[i] = tmpPath;
      });
  }));
}

function teardown(pluginConfig, runnerConfig) {
}

function transform(path, config) {
  var deferred = q.defer();

  tmp.tmpName(function(err, tmpPath) {
    if (err) {
      deferred.reject(new Error('Failed to create a tmp file for ' + path));
      return;
    }
    var options = createOptions(config, tmpPath);

    try {
      var content = fs.readFileSync(path, { encoding: 'utf8' });
      var processed = to5.transform(content, options).code;
      fs.writeFileSync(tmpPath, processed);
      deferred.resolve(tmpPath);
    } catch (e) {
      log.error('%s\n at %s', e.message, path);
      deferred.reject(e);
    }
  });

  return deferred.promise;
}

function createOptions(config, path) {
  config = config || {};
  var options = extend({ filename: path }, config.options || {});
  PER_FILE_OPTIONS.forEach(function(optionName) {
    var configFunc = config[optionName];
    if (typeof configFunc === 'function') {
      options[optionName] = configFunc(file);
    }
  });
  return options;
}

exports.setup = setup;
exports.teardown = teardown;

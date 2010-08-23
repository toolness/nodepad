var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var origAssert = require('assert');

var assert = exports.assert = {};

function addAssertMethod(name) {
  assert[name] = function() {
    origAssert[name].apply(origAssert, arguments);
    var maybeMsg = arguments[arguments.length-1];
    if (typeof(maybeMsg) == "string")
      console.log("[ok] " + maybeMsg);
  };
};

for (name in origAssert)
  addAssertMethod(name);

var rmpathSync = exports.rmpathSync = function rmpathSync(pathname) {
  var filenames = [];
  try {
    filenames = fs.readdirSync(pathname);
  } catch (e) {
    // Either it doesn't exist or it's a file.
    // If it's a file, try deleting it.
    try {
      fs.unlinkSync(pathname);
    } catch (e) {}
  }

  filenames.forEach(
    function(filename) {
      rmpathSync(path.join(pathname, filename));
    });

  try {
    fs.rmdirSync(pathname);
  } catch (e) {}
};

exports.withGitRepo = function withGitRepo(repoName, testFunc) {
  function cleanup() {
    rmpathSync(repoName);
  }

  cleanup();
  process.on('exit', cleanup);

  fs.mkdirSync(repoName, 0755);

  var git = child_process.spawn('git', ['init'], {cwd: repoName});
  git.on('exit',
         function(code) {
           if (code != 0)
             throw new Error('git init failed.');
           testFunc(repoName);
         });
};

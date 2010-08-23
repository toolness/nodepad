var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var assert = require('assert');

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
  var myAssert = {};
  var numLeft = 0;

  function addAssertMethod(name) {
    myAssert[name] = function() {
      if (numLeft == 0)
        throw new Error("test.assert." + name +
                        "() called but none expected!");
      assert[name].apply(assert, arguments);
      var maybeMsg = arguments[arguments.length-1];
      if (typeof(maybeMsg) == "string")
        console.log("[ok] " + maybeMsg);
    };
  };

  for (name in assert)
    addAssertMethod(name);

  function cleanup() {
    rmpathSync(repoName);
  }

  function onTimeout() {
    cleanup();
    throw new Error("FAIL: Timeout!");
  }

  var timeout = setTimeout(onTimeout, 5000);

  var test = {
    assert: myAssert,
    done: function() {
      numLeft--;
      if (numLeft == 0) {
        clearTimeout(timeout);
        cleanup();
      }
      if (numLeft < 0)
        throw new Error("test.done() called but none expected!");
    },
    expect: function(num) {
      numLeft = num;
    }
  };

  cleanup();

  fs.mkdirSync(repoName, 0755);

  var git = child_process.spawn('git', ['init'], {cwd: repoName});
  git.on('exit',
         function(code) {
           if (code != 0)
             throw new Error('git init failed.');
           testFunc(test, repoName);
         });
};

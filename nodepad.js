var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

const NOTHING_TO_COMMIT = /nothing to commit \(working directory clean\)\s$/;
const FILE_NOT_FOUND = /^ENOENT/;

function Serializer(target) {
  var inUse = false;
  var queuedCalls = [];

  function maybeExecNextInQueue() {
    if (!inUse && queuedCalls.length) {
      var callInfo = queuedCalls.shift();
      inUse = true;
      callInfo.method.apply(target, callInfo.args);
    }
  }

  function makeWrappedCb(cb) {
    return function wrappedCb() {
      inUse = false;
      maybeExecNextInQueue();
      cb.apply(this, arguments);
    };
  }

  this.wrap = function wrap(func) {
    return function serializedFunc() {
      var cb = arguments[arguments.length-1];

      arguments[arguments.length-1] = makeWrappedCb(cb);
      queuedCalls.push({args: arguments, method: func});
      maybeExecNextInQueue();
    };
  };
}

var GitRepo = exports.GitRepo = function GitRepo(repoPath) {
  function getFile(filename, cb) {
    function onRead(err, data) {
      if (err && err.message && FILE_NOT_FOUND.test(err.message))
        cb({message: "file not found",
            filename: filename});
      else
        cb.apply(this, arguments);
    }

    fs.readFile(path.join(repoPath, filename), 'utf8', onRead);
  };

  function putFile(filename, data, cb) {
    function onAdd(code) {
      var nothingToCommit = false;

      if (code)
        cb(code);
      else {
        var git = child_process.spawn('git',
                                      ['commit', filename,
                                       '-m', 'automated commit.'],
                                      {cwd: repoPath});
        git.stdout.setEncoding('ascii');
        git.stdout.on('data', function(data) {
                        nothingToCommit = NOTHING_TO_COMMIT.test(data);
                      });
        git.on('exit', function(code) {
                 if (code && !nothingToCommit)
                   cb(code);
                 else
                   cb(null);
               });
      }
    }

    function onWrite(err) {
      if (err)
        cb(err);
      else {
        var git = child_process.spawn('git', ['add', filename],
                                      {cwd: repoPath});
        git.on('exit', onAdd);
      }
    }

    fs.writeFile(path.join(repoPath, filename), data, onWrite);
  };

  var serializer = new Serializer(this);

  this.getFile = serializer.wrap(getFile);
  this.putFile = serializer.wrap(putFile);
};

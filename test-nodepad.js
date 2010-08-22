var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var origAssert = require('assert');

var nodepad = require('./nodepad');

var assert = {};

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

function rmpath(pathname) {
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
      rmpath(path.join(pathname, filename));
    });

  try {
    fs.rmdirSync(pathname);
  } catch (e) {}
}

function testRepo(repo) {
  repo.putFile(
    'bar.txt', 'hai2u',
    function(err) { assert.equal(err, null, "putFile() works"); }
  );

  repo.getFile(
    'foo.txt',
    function(err, data) {
      assert.deepEqual(
        err,
        { message: 'file not found', filename: 'foo.txt' },
        "getFile() on nonexistent file reports error"
      );
    });

  repo.getFile(
    'bar.txt',
    function(err, data) {
      assert.ifError(err);
      assert.equal(data, 'hai2u',
                   "getFile() on existing file returns contents");
    });

  repo.putFile(
    'bar.txt', 'hai2u',
    function(err) { assert.equal(err, null, "putFile() works on no-op"); }
  );

  repo.putFile(
    'bar.txt', 'hai3u',
    function(err) { assert.equal(err, null, "putFile() works on change"); }
  );

  repo.getFile(
    'bar.txt',
    function(err, data) {
      assert.ifError(err);
      assert.equal(data, 'hai3u',
                   "getFile() on changed file returns contents");
    });
}

function cleanup() {
  rmpath('test-repo');
}

cleanup();
process.on('exit', cleanup);

fs.mkdirSync('test-repo', 0755);

var git = child_process.spawn('git', ['init'], {cwd: 'test-repo'});
git.on(
  'exit',
  function(code) {
    if (code != 0)
      throw new Error('git init failed.');
    var repo = new nodepad.GitRepo('test-repo');
    testRepo(repo);
  });

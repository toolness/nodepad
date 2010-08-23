var testing = require('./testing');
var assert = testing.assert;
var nodepad = require('../nodepad');

function testRepo(repoName) {
  var repo = new nodepad.GitRepo(repoName);

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

testing.withGitRepo('nodepad-test-repo', testRepo);

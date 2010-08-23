var testing = require('./testing');
var nodepad = require('../nodepad');

function testRepo(test, repoName) {
  test.expect(6);

  var repo = new nodepad.GitRepo(repoName);

  repo.putFile(
    'bar.txt', 'hai2u',
    function(err) { test.assert.equal(err, null, "putFile() works");
                    test.done(); }
  );

  repo.getFile(
    'foo.txt',
    function(err, data) {
      test.assert.deepEqual(
        err,
        { message: 'file not found', filename: 'foo.txt' },
        "getFile() on nonexistent file reports error"
      );
      test.done();
    });

  repo.getFile(
    'bar.txt',
    function(err, data) {
      test.assert.ifError(err);
      test.assert.equal(data, 'hai2u',
                        "getFile() on existing file returns contents");
      test.done();
    });

  repo.putFile(
    'bar.txt', 'hai2u',
    function(err) { test.assert.equal(err, null, "putFile() works on no-op");
                    test.done(); }
  );

  repo.putFile(
    'bar.txt', 'hai3u',
    function(err) { test.assert.equal(err, null, "putFile() works on change");
                    test.done(); }
  );

  repo.getFile(
    'bar.txt',
    function(err, data) {
      test.assert.ifError(err);
      test.assert.equal(data, 'hai3u',
                        "getFile() on changed file returns contents");
      test.done();
    });
}

testing.withGitRepo('nodepad-test-repo', testRepo);

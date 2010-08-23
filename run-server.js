var nodepad = require('./nodepad');
var server = require('./nodepad/server');

if (process.argv.length < 4) {
  console.log('usage: ' + process.argv[0] + ' ' + 
              process.argv[1] + ' <port> <git-repo>');
  process.exit(1);
} else {
  var port = parseInt(process.argv[2]);
  var repoName = process.argv[3];
  var git = new nodepad.GitRepo(repoName);
  console.log('serving git repo @ ' + repoName + ' on port ' + port);
  var handler = server.makeRequestHandler(git);
  var httpd = require('http').createServer(handler);
  httpd.listen(port);
}

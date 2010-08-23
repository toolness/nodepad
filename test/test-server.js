var testing = require('./testing');
var server = require('../nodepad/server');

var fakeGit = {
  _files: {},
  getFile: function(filename, cb) {
    if (filename in this._files) {
      var contents = this._files[filename];
      process.nextTick(function() { cb(null, contents); });
    } else {
      process.nextTick(function() { cb({message: 'file not found'}); });
    }
  },
  putFile: function(filename, data, cb) {
    var self = this;
    process.nextTick(
      function() {
        self._files[filename] = data;
        cb(null);
      });
  }
};

var http = require('http');
var handler = server.makeRequestHandler(fakeGit);
var httpd = http.createServer(handler);
var assert = require('assert');

const PORT = 1234;

function nextTest() {
  if (tests.length > 0) {
    var test = tests.shift();
    console.log("running test: " + test.name);
    test();
  } else {
    console.log("all tests passed.");
    httpd.close();
  }
}

var tests = [
  function putMassiveEntity() {
    var localhost = http.createClient(PORT);
    var req = localhost.request('PUT', '/foo');
    var filler = '1234567890';
    var max = Math.ceil(server.MAX_REQUEST_BODY_SIZE / filler.length);
    for (var i = 0; i < max; i++)
      req.write(filler);
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 413);
             nextTest();
           });
    
  },
  function getNonexistentBin() {
    var localhost = http.createClient(PORT);
    var req = localhost.request('GET', '/foo');
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 404);
             nextTest();
           });
  },
  function putIntoBin() {
    var localhost = http.createClient(PORT);
    var req = localhost.request('PUT', '/foo');
    req.write('blop\u2026', 'utf8');
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 200);
             nextTest();
           });    
  },
  function getExistentBin() {
    var localhost = http.createClient(PORT);
    var req = localhost.request('GET', '/foo');
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 200);
             response.setEncoding('utf8');
             response.on('data',
                         function(chunk) {
                           assert.equal(chunk, 'blop\u2026');
                           nextTest();
                         });
           });
  },
  function ensureOptionsWorks() {
    var expect = { 'access-control-allow-origin': '*'
                   , 'access-control-allow-methods': 'OPTIONS,GET,PUT'
                   , 'access-control-allow-headers': 'Content-Type'
                   , 'content-length': '0'
                   , connection: 'close'
                 };
    var localhost = http.createClient(PORT);
    var req = localhost.request('OPTIONS', '/foo');
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 200);
             assert.deepEqual(expect, response.headers);
             nextTest();
           });
  },
  function putNonexistentPath() {
    var localhost = http.createClient(PORT);
    var req = localhost.request('PUT', '/foo.txt');
    req.end();
    req.on('response',
           function(response) {
             assert.equal(response.statusCode, 404);
             nextTest();
           });
  }
];

httpd.listen(PORT, nextTest);

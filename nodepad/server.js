const PAD = /^\/([A-Za-z0-9_\-]+)$/;

const MAX_REQUEST_BODY_SIZE = exports.MAX_REQUEST_BODY_SIZE = 65536;

exports.makeRequestHandler = function makeRequestHandler(git) {
  return function handleRequest(request, response) {
    function writeHead(status, extraHeaders) {
      var headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT',
        'Access-Control-Allow-Headers': 'Content-Type'
      };
      for (name in extraHeaders)
        headers[name] = extraHeaders[name];
      response.writeHead(status, headers);
    }

    function respondWith405() {
      writeHead(405, {'Content-Type': 'text/plain'});
      response.end('Method not allowed: ' + request.method + '\n');
    }

    function respondWith404() {
      writeHead(404, {'Content-Type': 'text/plain'});
      response.end('Not found: ' + request.url + '\n');
    }

    function respondWith500(err) {
      writeHead(500, {'Content-Type': 'text/plain'});
      response.end('Alas, an internal error occurred.\n');
    }

    var match = request.url.match(PAD);
    if (match) {
      var filename = match[1] + '.txt';
      if (request.method == 'GET')
        git.getFile(
          filename,
          function(err, data) {
            if (err) {
              if (err.message && err.message == "file not found")
                respondWith404();
              else
                respondWith500(err);
            } else {
              var byteLength = Buffer.byteLength(data, 'utf8');
              writeHead(200, {'Content-Type': 'text/plain',
                              'Content-Length': byteLength});
              response.end(data, 'utf8');
            }
          });
      else if (request.method == 'PUT') {
        var chunks = [];
        var length = 0;
        request.setEncoding('utf8');
        request.on(
          'data',
          function(chunk) {
            if (length + chunk.length <= MAX_REQUEST_BODY_SIZE) {
              chunks.push(chunk);
              length += chunk.length;
            } else {
              writeHead(413, {'Content-Type': 'text/plain'});
              response.end("Request entity too large.");
            }
          });
        request.on(
          'end',
          function() {
            git.putFile(
              filename,
              chunks.join(''),
              function(err) {
                if (err)
                  respondWith500(err);
                else {
                  writeHead(200, {'Content-Type': 'text/plain'});
                  response.end("Resource updated.");
                }
              });
          });
      } else if (request.method == 'OPTIONS') {
        writeHead(200, {'Content-Length': '0'});
        response.end("");
      } else
        respondWith405();
    } else
      respondWith404();
  };
};

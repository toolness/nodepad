## Nodepad ##

This is a crummy first attempt at a node.js server. It just provides a
RESTful API to storing plaintext data in "bins" on a server. The bins
are backed by a git repository, so that it's impossible to incur data
loss from use of the API, though actually retrieving old revisions of
bins is not currently possible.

To run tests:

  * Enter the `test` directory.
  * Run `node test-nodepad.js`.
  * Run `node test-server.js`.

To run the server:

  * From the root directory, run e.g. `node run-server.js 8000
    /var/foo` to run the server on port 8000 using the git repository
    at `/var/foo` as the backing store.

  * Issue `GET` and `PUT` requests to URLs to retrieve and set the
    value of bins, e.g. `PUT /foo` with a request body to set the
    value of the `foo` bin and `GET /foo` to retrieve it.

  * As you issue new `PUT` requests, note that a new revision is
    created in the backing git repository for each `PUT`.

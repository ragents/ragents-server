ragents-server - ragents server library
================================================================================

A library that implements the server end of the `ragents` protocol, and a
simple standalone server which uses it, named `ragentsd`



using the standalone server `ragentsd`
================================================================================

After [`npm install`](https://www.npmjs.com/package/ragents-server)ing this
module, a binary named `ragentsd` is installed.  To display help, use:

    ragentsd --help

The server only handles WebSocket traffic speaking the `ragents` protocol - all
other requests are handled in an undefined way.



deploy on Bluemix
================================================================================

You can deploy `ragentsd` on the [IBM Bluemix PaaS](https://bluemix.net) by
clicking the "Deploy to Bluemix" button below:

<a target="_blank" href="https://bluemix.net/deploy?repository=https://github.com/ragents/ragents-server.git">
  <img src="http://bluemix.net/deploy/button.png" alt="Deploy to Bluemix">
</a>
<!-- __ those two underscores are needed to fix atom hilighting - grumble -->



using the `ragents-server` package
================================================================================

The package exports a single function:

### `createServer(config)`

The `config` object must have a property `httpServer`, which is an `http`
server object (from the `http` package).  The function returns an instance
of a `RagentsServer` object.

### `RagentsServer` object

A `RagentsServer` object has two methods:

### `ragentsServer.start()`

Will start accepting WebSocket connections from the http server

### `ragentsServer.stop()`

Will stop accepting WebSocket connections from the http server, and
close all the connections to sessions created on this server.




hacking
================================================================================

This project uses [cake](http://coffeescript.org/#cake) as it's
build tool.  To rebuild the project continuously, use the command

    npm run watch

Other `cake` commands are available (assuming you are using npm v2) with
the command

    npm run cake -- <command here>

Run `npm run cake` to see the other commands available in the `Cakefile`.



license
================================================================================

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

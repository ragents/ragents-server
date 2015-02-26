#!/usr/bin/env node

// Licensed under the Apache License. See footer for details.

var URL  = require("url")
var http = require("http")

var ragentsServer = require("./ragents-server")

var utils    = require("./utils")
var getOpts  = require("./getOpts")

exports.main = main

//------------------------------------------------------------------------------
function main(args) {
  process.on("uncaughtException", onUncaughtException)

  var opts  = getOpts.parse(args).opts

  var webServer = http.createServer(onRequest)

  utils.log("version: " + utils.VERSION)
  utils.log("server starting")
  webServer.listen(opts.port, function() {
    utils.log("server started on http://localhost:" + opts.port)
  })

  var config = {
    httpServer: webServer
  }

  var rserver = ragentsServer.createServer(config)
  rserver.start()
}

//-----------------------------------
function onRequest(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"})
  response.end(getOpts.getHelp())
}

//-----------------------------------
function onWsRequest(request) {
  if (-1 == request.requestedProtocols.indexOf(ragentsServer.wsProtocol)) {
    return request.reject()
  }

  request.accept(ragentsServer.wsProtocol, request.origin)
}

//------------------------------------------------------------------------------
function onUncaughtException(err) {
  console.log("-------------------------------------------")
  console.log("uncaught exception: " + err)
  console.log(err.stack)
  console.log("")
}

//------------------------------------------------------------------------------
if (require.main == module) {
  main(process.argv.slice(2))
}

//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

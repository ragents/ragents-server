
// Licensed under the Apache License. See footer for details.

var util = require("util")

var _         = require("underscore")
var websocket = require("websocket")

var utils    = require("./utils")
var agents   = require("./agents")
var sessions = require("./sessions")
var channels = require("./channels")

exports.createServer = createServer
exports.wsProtocol   = "ragents-protocol"

//------------------------------------------------------------------------------
function createServer(config) {
  config = validateConfig(config)
  return new Server(config)
}

//------------------------------------------------------------------------------
function validateConfig(config) {
  var result = {}

  if (config.httpServer == null) throw Error("httpServer config property is null")
  result.httpServer = config.httpServer

  result.onRequest = config.onRequest || default_onRequest
  if (!_.isFunction(result.onRequest)) throw Error("onRequest config property is not a function")

  result.verbose = !!config.verbose

  return result

  //-----------------------------------
  function default_onRequest(request) {
    if (-1 == request.requestedProtocols.indexOf(exports.wsProtocol)) {
      return request.reject()
    }

    request.accept(exports.wsProtocol, request.origin)
  }
}

//------------------------------------------------------------------------------
function Server(config) {
  utils.verbose(config.verbose)

  this._wsStarted = false
  this._wsStopped = false

  this._wsConfig = config
  this._wsServer = new websocket.server()

  this._onRequest = config.onRequest

  this._wsServer.addListener("request", this._onRequest)
  this._wsServer.addListener("connect", onConnect)
}

Server.prototype.start = Server_start
Server.prototype.stop  = Server_stop

//------------------------------------------------------------------------------
function Server_start() {
  if (this._wsStarted) return
  if (this._wsStopped) throw Error("server already stopped")

  this._wsStarted = true

  this._wsServer.mount(this._wsConfig)
}

//------------------------------------------------------------------------------
function Server_stop() {
  if (!this._wsStarted) throw Error("server not started")
  if (this._wsStopped) return

  this._wsStopped = true

  sessions.shutDown()
  this._wsServer.shutDown()

  this._wsServer.removeListener("request", this._onRequest)
  this._wsServer.removeListener("connect", onConnect)

  self._wsConfig  = null
  self._wsServer  = null
}

//------------------------------------------------------------------------------
function onConnect(wsConn) {
  var done = false

  wsConn.addListener("message", onMessage)
  wsConn.addListener("close",   onClose)
  wsConn.addListener("error",   onError)

  //-----------------------------------
  function onMessage(message) {
    if (done) return
    if (message.type != "utf8") return sendConnectFailed(wsConn)

    try {
      message = JSON.parse(message.utf8Data)
    }
    catch(err) {
      return sendConnectFailed(wsConn)
    }

    var id  = message.id

    if (message.type != "request") return sendConnectFailed(wsConn)
    if (message.name != "connect") return sendConnectFailed(wsConn)
    if (message.to   != "server") return sendConnectFailed(wsConn)

    var body = message.body || {}

    if (!body.key) return sendConnectFailed(wsConn)

    var session = sessions.getSession(body.key)
    var channel = channels.createChannel(session, wsConn)

    message = {
      type: "response",
      name: "connect",
      from: "server",
      id:   message.id,
      body: null
    }

    wsConn.sendUTF(JSON.stringify(message))
    cleanUp()
  }

  //-----------------------------------
  function sendConnectFailed(wsConn) {
    var message = {
      type:  "response",
      name:  "connect",
      from:  "server",
      error: "invalid connect message"
    }

    wsConn.sendUTF(JSON.stringify(message))
    wsConn.close(1000, message.error)
    cleanUp()
  }

  //-----------------------------------
  function onClose(code, reason) {
    cleanUp()
  }

  //-----------------------------------
  function onError(err) {
    if (err.errno == "ECONNRESET") return

    console.log("websocket error: " + err)
    console.log(err.stack)
  }

  //-----------------------------------
  function cleanUp() {
    if (done) return
    done = true

    wsConn.removeListener("message", onMessage)
    wsConn.removeListener("close",   onClose)
    wsConn.removeListener("error",   onError)
  }
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

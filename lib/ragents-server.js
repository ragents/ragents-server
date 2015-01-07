// Licensed under the Apache License. See footer for details.

var websocket = require("websocket")

var utils   = require("./utils")
var agent   = require("./agent")
var session = require("./session")

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

  if (config.httpServer == null) throw Error("httpServer config property was null")
  result.httpServer = config.httpServer

  result.onRequest = config.onRequest || default_onRequest
  if (!_.isFunction(result.onRequest)) throw Error("onRequest config property was null")

  result.verbose = !!config.verbose

  return result

  //-----------------------------------
  function default_onRequest(request) {
    wsRequest.accept(exports.wsProtocol, request.origin)
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
Server.prototype.stop = Server_stop

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

  this._wsServer.shutDown()

  this._wsServer.removeListener("request", this._onRequest)
  this._wsServer.removeListener("connect", onConnect)

  self._wsConfig  = null
  self._wsServer  = null
}

//------------------------------------------------------------------------------
function onConnect(wsConnection) {
  var done = false

  wsConnection.addEventHandler("message", onMessage)
  wsConnection.addEventHandler("close",   onClose)
  wsConnection.addEventHandler("error",   onError)

  //-----------------------------------
  function onMessage(message) {
    if (done) return

    var origMessage = message

    message = agent.validateMessage(message)
    if (_.isString(message)) return
    if (message.type != "request") return
    if (message.name != "sys/connect") return

    var data = message.data || {}

    if (!data.key)  return
    if (!data.name) return
    if (!data.title) data.instance = "<anonymous>"

    var session = session.getSession(data.key)
    var agent   = agent.createAgent(wsConnection, session, data)

    agent.sysRequest_connect(message)

    cleanUp()
  }

  //-----------------------------------
  function onClose(code, reason) {
    cleanUp()
  }

  //-----------------------------------
  function onError(err) {
    cleanUp()
  }

  //-----------------------------------
  function cleanUp() {
    if (done) return
    done = true

    wsConnection.removeEventHandler("message", onMessage)
    wsConnection.removeEventHandler("close",   onClose)
    wsConnection.removeEventHandler("error",   onError)
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

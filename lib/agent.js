// Licensed under the Apache License. See footer for details.

var subscriptions = require("./subscriptions")
var requestCBs    = require("./requestCallbacks")

//------------------------------------------------------------------------------
exports.createAgent     = createAgent
exports.validateMessage = validateMessage
exports.systemPrefix    = "sys/"

var systemPrefixRegex = new RegExp("^sys\/(.*)?")

//------------------------------------------------------------------------------
function createAgent(wsConn, session, data) {
  return new Agent(wsConn, session, data)
}

//------------------------------------------------------------------------------
// given a WS message, return a string on error, object on success
//------------------------------------------------------------------------------
function validateMessage(message) {
  if (!message) return "message was null"

  if (message.type != "utf8") return "message was not text"

  try {
    message = JSON.parse(message.utf8Data)
  }
  catch (e) {
    return "message was not valid JSON: " + e
  }

  if (!message.name) return "message had no name"

  message.name = "" + message.name
  message.data = message.data || {}

  return message
}

//------------------------------------------------------------------------------
function Agent(wsConn, session, data) {
  this.wsConn  = wsConn
  this.session = session
  this.info = {
    id:     session.nextID(),
    name:   data.name,
    title:  data.title
  }

  this.connected  = false
  this.requestCBs = requestCBs.createRequestCallbacks()

  var self = this

  wsConnection.addEventHandler("message", onWsMessage)
  wsConnection.addEventHandler("close",   onWsClose)
  wsConnection.addEventHandler("error",   onWsError)

  function onWsMessage(message)    { onMessage(self, message) }
  function onWsClose(code, reason) { onClose(self, code, reason) }
  function onWsError(err)          { onError(self, err) }
}

Agent.prototype.shutdown = Agent_shutdown

Agent.prototype.sysRequest_connect     = Agent_sysRequest_connect
Agent.prototype.sysRequest_disconnect  = Agent_sysRequest_disconnect
Agent.prototype.sysRequest_getAgents   = Agent_sysRequest_getAgents
Agent.prototype.sysRequest_subscribe   = Agent_sysRequest_subscribe
Agent.prototype.sysRequest_unsubscribe = Agent_sysRequest_unsubscribe

//------------------------------------------------------------------------------
function onMessage(agent, message) {
  message = validateMessage()
  if (_.isString(message)) return

  if      (message.type == "request")  onMessageRequest(agent, message)
  else if (message.type == "response") onMessageResponse(agent, message)
  else if (message.type == "event")    onMessageEvent(agent, message)
  else return
}

//------------------------------------------------------------------------------
function onMessageRequest(fromAgent, message) {
  var name  = "" + message.name
  var sysMatch = name.match(systemPrefixRegex)

  if (sysMatch) return onSysMessageRequest(fromAgent, message, sysMatch[1])

  var toAgent = agent.session.getAgent(message.to)
  if (!toAgent) return

  var cbid = toAgent.requestCBs.add(sendResponse)

  message.requestID = cbid

  toAgent.sendMessage(message)

  function sendResponse(responseMessage) {
    var resultMessage = {
      type:      "response",
      name:      message.name,
      requestID: message.requestID,
      data:      responseMessage.data || {}
    }

    fromAgent.sendMessage(resultMessage)
  }
}

//------------------------------------------------------------------------------
function onSysMessageRequest(fromAgent, message, fnName) {
  var methodName = "sysRequest_" + fnName
  if (!_.has(fromAgent, methodName)) return

  var response = fromAgent[methodName].call(fromAgent, message) || {}

  var resultMessage = {
    type:      "response",
    name:      message.name,
    requestID: message.requestID,
    data:      response.data || {}
  }

  fromAgent.sendMessage(resultMessage)
}

//------------------------------------------------------------------------------
function onMessageResponse(fromAgent, message) {
  var name  = "" + message.name
  var sysMatch = name.match(systemPrefixRegex)

  if (sysMatch) return

  var cbid = message.requestID

  fromAgent.requestCBs.invoke(cbid)
}

//------------------------------------------------------------------------------
function onMessageEvent(fromAgent, message) {
  var name  = "" + message.name
  var sysMatch = name.match(systemPrefixRegex)

  if (sysMatch) return
}

//------------------------------------------------------------------------------
function Agent_shutdown() {

}

//------------------------------------------------------------------------------
function Agent_sysRequest_connect(message) {
  this.connected = true

  var data = _.clone(message.data)
  data.id = this.id

  sendSubscribers(agent, "sys/connected")

  return {data: data}
}

//------------------------------------------------------------------------------
function Agent_sysRequest_disconnect(message) {
  this.connected = false

  sendSubscribers(agent, "sys/disconnected")

  this.shutdown()
}

//------------------------------------------------------------------------------
function Agent_sysRequest_getAgents(message) {
  var agents = this.session.getAgents()

  agents = _.map(agents, function(agent){
    return agent.info
  })

  return {data: { agents: agents}}
}

//------------------------------------------------------------------------------
function Agent_sysRequest_subscribe(message) {
  var name = message.data.name

  this.session.subscribeAgent(this, name)
}

//------------------------------------------------------------------------------
function Agent_sysRequest_unsubscribe(message) {
  var name = message.data.name

  this.session.unsubscribeAgent(this, name)
}

//------------------------------------------------------------------------------
function Agent_sendMessage(message) {
  message = JSON.stringify(message)
  this.wsConn.sendUTF(message)
}

//------------------------------------------------------------------------------
function sendRequest(agent, message) {
  message.type = "request"

  agent.sendMessage(message)
}

//------------------------------------------------------------------------------
function sendResponse(agent, message) {
  message.type = "response"

  agent.sendMessage(message)
}

//------------------------------------------------------------------------------
function sendEvent(agent, message) {
  message.type = "event"

  agent.sendMessage(message)
}

//------------------------------------------------------------------------------
function sendSubscribers(agent, name, data) {
  process.nextTick(sendMessages)

  function sendMessages() {
    var subbedAgents = agent.session.getSubscribedAgents(name)

    subbedAgents.forEach(function(subbedAgent) {
      message = {
        name: name,
        data: data,
        from: agent.info
      }

      sendEvent(subbedAgent, message)
    })
  }
}

/*
//------------------------------------------------------------------------------
Agent.prototype._onMessage = function _onMessage(message) {
  if (message.package != "response") return
  if (!message.requestID) return

  var cb = this._requestCBs[message.requestID]
  if (!cb) return

  delete this._requestCBs[message.requestID]

  if (message.error) return cb(message.error)
  cb(null, message.data)
}

//------------------------------------------------------------------------------
Agent.prototype.sendEvent = function sendEvent(type, data) {
  if (!this._isConnected) return

  var message = {
    packet: "event",
    type:   type,
    data:   data
  }

  sendObject(this, message)
}

//------------------------------------------------------------------------------
Agent.prototype._onMessage = function _onMessage(message) {
  if (message.packet != "request") return

  var request = new Request(this, message)

  this.emit("request", request)
}

//------------------------------------------------------------------------------
function Request(target, message) {
  this.argv = message.argv

  this._target  = target
  this._message = message
  this._handled = false
}

//------------------------------------------------------------------------------
Request.prototype.wasHandled = function wasHandled(response) {
  return this._handled
}

//------------------------------------------------------------------------------
Request.prototype.sendResponse = function sendResponse(response) {
  if (this._handled) return

  this._handled = true

  var message = {
    packet:    "response",
    type:      this._message.type,
    requestID: this._message.requestID,
    data:      response
  }

  sendObject(this._target, message)
}

//------------------------------------------------------------------------------
Request.prototype.sendError = function sendError(error) {
  if (this._handled) return

  this._handled = true

  var message = {
    packet:    "response",
    type:      this._message.type,
    requestID: this._message.requestID,
    error:     error
  }

  sendObject(this._target, message)
}

//------------------------------------------------------------------------------
function SessionHandler(agent) {
  this.agent = agent
}

//------------------------------------------------------------------------------
SessionHandler.prototype.onOpen = function onOpen() {
  throw Error("unexpected websocket open event")
}

//------------------------------------------------------------------------------
SessionHandler.prototype.onMessage = function onMessage(event) {
  var message = JSON.parse(event.data)

  this.agent._onMessage(message)
}

//------------------------------------------------------------------------------
SessionHandler.prototype.onClose = function onClose(event) {
  this.agent.emit("close", {reason: event.reason})
  this.agent._connected = false
}

//------------------------------------------------------------------------------
SessionHandler.prototype.onError = function onError() {
  this.agent.emit("error", Error("websocket error"))
  this.agent._connected = false
}

//------------------------------------------------------------------------------
function sendObject(agent, obj) {
  if (!agent._isConnected) return

  obj = JSON.stringify(obj, null, 2)
  agent._ws.send(obj)
}
*/

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

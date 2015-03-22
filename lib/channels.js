// Licensed under the Apache License. See footer for details.

var util = require("util")

var _     = require("underscore")
var debug = require("debug")

var utils = require("./utils")
var SMap  = require("./smap")

var DEBUG    = debug("ragents:channels")
var DEBUGMSG = debug("ragents-messages")


exports.createChannel = createChannel

//------------------------------------------------------------------------------
function createChannel(session, wsConn) {
  return new Channel(session, wsConn)
}

//------------------------------------------------------------------------------
function Channel(session, wsConn) {
  DEBUG("new Channel()")
  this.session     = session
  this.wsConn      = wsConn
  this.agents      = new SMap()
  this.nextAgentID = session.nextAgentID

  this.session.addChannel(this)

  wsConn.addListener("message", onMessage)
  wsConn.addListener("close",   onClose)
  wsConn.addListener("error",   onError)

  var channel = this

  //-----------------------------------
  function onMessage(message) {
    if (message.type != "utf8") return

    DEBUGMSG("recv: " + message.utf8Data)
    message = JSON.parse(message.utf8Data)

    if      (message.type == "request")  session.onRequest(channel, message)
    else if (message.type == "response") session.onResponse(channel, message)
    else if (message.type == "event")    session.onEvent(channel, message)
  }

  //-----------------------------------
  function onClose() {
    DEBUG("channel.onClose()")
    channel.eachAgent(function(agent){
      agent.shutDown()
    })

    channel.session.delChannel(this)
  }

  //-----------------------------------
  function onError(err) {
    DEBUG("channel.onErr():" +  err)

    if (err.errno == "ECONNRESET") return

    console.log("websocket error: " + err)
    console.log(err.stack)
  }
}

Channel.prototype.nextAgentID     = Channel_nextAgentID
Channel.prototype.shutDown        = Channel_shutDown
Channel.prototype.sendMessage     = Channel_sendMessage
Channel.prototype.getAgent        = Channel_getAgent
Channel.prototype.getAgents       = Channel_getAgents
Channel.prototype.eachAgent       = Channel_eachAgent
Channel.prototype.addAgent        = Channel_addAgent
Channel.prototype.delAgent        = Channel_delAgent

//------------------------------------------------------------------------------
function Channel_nextAgentID() {
  return this.session.nextAgentID()
}

//------------------------------------------------------------------------------
function Channel_shutDown() {
  DEBUG("channel.shutDown()")
  this.wsConn.close()
  this.wsConn = null
}

//------------------------------------------------------------------------------
function Channel_sendMessage(message) {
  if (!this.wsConn) return
  if (!this.wsConn.connected) return

  DEBUGMSG("send: " + utils.JS(message))

  try {
    this.wsConn.sendUTF(JSON.stringify(message))
  }
  catch(e) {
    // occurs when socket closed, oh well
  }
}

//------------------------------------------------------------------------------
function Channel_getAgent(id) {
  return this.agents.get(id)
}

//------------------------------------------------------------------------------
function Channel_getAgents() {
  return this.agents.values()
}

//------------------------------------------------------------------------------
function Channel_eachAgent(fn) {
  return this.agents.forEach(fn)
}

//------------------------------------------------------------------------------
function Channel_addAgent(agent) {
  DEBUG("channel.addAgent(" + utils.JS(agent.info) + ")")
  this.agents.set(agent.info.id, agent)
  this.session.sendEvent("agentCreated", "server", agent.info)
}

//------------------------------------------------------------------------------
function Channel_delAgent(agent) {
  if (this.agents.get(agent.info.id) == null) return

  DEBUG("channel.delAgent(" + utils.JS(agent.info) + ")")
  this.agents.delete(agent.info.id)
  this.session.sendEvent("agentDestroyed", "server", agent.info)
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

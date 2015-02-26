// Licensed under the Apache License. See footer for details.

var _ = require("underscore")

var utils = require("./utils")
var SMap  = require("./smap")

exports.createChannel = createChannel

//------------------------------------------------------------------------------
function createChannel(session, wsConn) {
  return new Channel(session, wsConn)
}

//------------------------------------------------------------------------------
function Channel(session, wsConn) {
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

    message = JSON.parse(message.utf8Data)

    if      (message.type == "request")  session.onRequest(channel, message)
    else if (message.type == "response") session.onResponse(channel, message)
    else if (message.type == "event")    session.onEvent(channel, message)
  }

  //-----------------------------------
  function onClose() {
    channel.eachAgent(function(agent){
      agent.shutDown()
    })

    channel.session.delChannel(this)
  }

  //-----------------------------------
  function onError(err) {
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
  this.wsConn.close()
  this.wsConn = null
}

//------------------------------------------------------------------------------
function Channel_sendMessage(message) {
  if (!this.wsConn) return
  if (!this.wsConn.connected) return

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
  this.agents.set(agent.id, agent)
}

//------------------------------------------------------------------------------
function Channel_delAgent(agent) {
  this.agents.delete(agent.id)
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

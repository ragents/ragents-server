// Licensed under the Apache License. See footer for details.

var _ = require("underscore")

var utils  = require("./utils")
var SMap   = require("./smap")
var agents = require("./agents")

exports.getSession = getSession
exports.close      = close

var DEBUG = utils.createDEBUG(__filename)

var Sessions = new SMap()

//------------------------------------------------------------------------------
function getSession(apiKey) {
  var session = Sessions.get(apiKey)

  if (session) return session

  session = new Session()
  Sessions.set(apiKey, session)

  return session
}

//------------------------------------------------------------------------------
function close() {
  Sessions.forEach(function(session){
    session.close()
  })

  Sessions = new SMap()
}

//------------------------------------------------------------------------------
function Session() {
  this.channels    = []
  this.nextAgentID = utils.sequencer()
  this.reqCBs      = new SMap()
}

Session.prototype.onRequest    = Session_onRequest
Session.prototype.onResponse   = Session_onResponse
Session.prototype.onEvent      = Session_onEvent
Session.prototype.sendEvent    = Session_sendEvent
Session.prototype.getAgents    = Session_getAgents
Session.prototype.getAgentByID = Session_getAgentByID
Session.prototype.addChannel   = Session_addChannel
Session.prototype.delChannel   = Session_delChannel
Session.prototype.close        = Session_close

//------------------------------------------------------------------------------
function onRequestServer(session, channel, message) {
  if (message.name == "createAgent")  return onRequestCreateAgent(session, channel, message)
  if (message.name == "destroyAgent") return onRequestDestroyAgent(session, channel, message)
  if (message.name == "getAgents")    return onRequestGetAgents(session, channel, message)

  channel.sendMessage({
    type:  "response",
    name:  message.name,
    from:  message.to,
    id:    message.id,
    error: "unknown message"
  })
}

//------------------------------------------------------------------------------
function onRequestCreateAgent(session, channel, message) {
  var agent = agents.createAgent(channel, message.body)
  channel.addAgent(agent)

  channel.sendMessage({
    type:  "response",
    name:  message.name,
    from:  message.to,
    id:    message.id,
    body:  agent.info
  })

  session.sendEvent("agentCreated", "server", agent.info)
}

//------------------------------------------------------------------------------
function onRequestDestroyAgent(session, channel, message) {
  var id = message.body.id

  var agent = session.getAgentByID(id)
  if (!agent) return

  channel.sendMessage({
    type:  "response",
    name:  message.name,
    from:  message.to,
    id:    message.id,
    body:  message.body
  })

  agent.shutDown()
  channel.delAgent(agent)

  session.sendEvent("agentDestroyed", "server", agent.info)
}

//------------------------------------------------------------------------------
function onRequestGetAgents(session, channel, message) {
  var agents = session.getAgents()
  var infos  = agents.map(function(agent){
    return agent.info
  })

  channel.sendMessage({
    type:  "response",
    name:  message.name,
    from:  message.to,
    id:    message.id,
    body:  infos
  })

}

//------------------------------------------------------------------------------
function Session_onRequest(channel, message) {
  if (message.to == "server") {
    return onRequestServer(this, channel, message)
  }

  var agent = this.getAgentByID(message.to)

  if (!agent) {
    channel.sendMessage({
      type:  "response",
      name:  message.name,
      from:  message.to,
      id:    message.id,
      error: "agent not found"
    })
    return
  }

  this.reqCBs.set(message.id, channel)
  agent.channel.sendMessage(message)
}

//------------------------------------------------------------------------------
function Session_onResponse(channel, message) {
  channel = this.reqCBs.get(message.id)

  if (!channel) return

  this.reqCBs.delete(message.id)
  channel.sendMessage(message)
}

//------------------------------------------------------------------------------
function Session_onEvent(channel, message) {
  this.channels.forEach(function(channel){
    channel.sendMessage(message)
  })
}

//------------------------------------------------------------------------------
function Session_sendEvent(name, from, body) {
  var message = {
    type: "event",
    name: name,
    from: from,
    body: body
  }

  this.onEvent(null, message)
}

//------------------------------------------------------------------------------
function Session_getAgents() {
  var result = []

  this.channels.forEach(function(channel){
    result = result.concat(channel.getAgents())
  })

  return result
}

//------------------------------------------------------------------------------
function Session_getAgentByID(id) {
  for (var i=0; i<this.channels.length; i++) {
    var agents = this.channels[i].getAgents()
    for (var j=0; j<agents.length; j++) {
      var agent = agents[j]
      if (agent.info.id == id) return agent
    }
  }
}

//------------------------------------------------------------------------------
function Session_close() {
  this.channels.forEach(function(channel){
    channel.close()
  })
}

//------------------------------------------------------------------------------
function Session_addChannel(channel) {
  this.channels.push(channel)
}

//------------------------------------------------------------------------------
function Session_delChannel(channel) {
  var index = this.channels.indexOf(channel)
  if (-1 == index) return

  this.channels.splice(index, 1)
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

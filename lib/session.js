// Licensed under the Apache License. See footer for details.

var _ = require("underscore")

var utils = require("./utils")

exports.getSession = getSession
exports.shutDown   = shutDown

var Sessions = {}

//------------------------------------------------------------------------------
function getSession(apiKey) {
  var key = "key-" + apiKey
  var session = Sessions[key]

  if (session) return session

  session = new Session()
  Sessions[key] = session

  return session
}

//------------------------------------------------------------------------------
function shutDown() {
  _.values(Sessions).each(function(session){
    session.shutdown()
  })

  Sessions = {}
}

//------------------------------------------------------------------------------
function Session() {
  this.agents = {}
  this.subs   = subscriptions.newSubscription()


  var startTime = new Date().toTimeString().slice(0,8)

  // create a nextID() method which produces sequenced strings
  this.nextID = utils.sequencer(startTime + "-")
}

Session.prototype.getAgent            = Session_getAgent
Session.prototype.getAgents           = Session_getAgents
Session.prototype.eachAgent           = Session_eachAgent
Session.prototype.addAgent            = Session_addAgent
Session.prototype.delAgent            = Session_delAgent
Session.prototype.shutdown            = Session_shutdown

Session.prototype.getSubscribedAgents = Session_getSubscribedAgents
Session.prototype.subscribeAgent      = Session_subscribeAgent
Session.prototype.unsubscribeAgent    = Session_unsubscribeAgent

//------------------------------------------------------------------------------
function Session_getAgent(id) {
  return this.agents["id-" + id]
}

//------------------------------------------------------------------------------
function Session_getAgents() {
  return _.clone(this.agents)
}

//------------------------------------------------------------------------------
function Session_getSubscribedAgents(name) {
  var self = this

  var agents = _.map(this.subs.agentsMatching(name), function(agentID) {
    return self.getAgent(agentID)
  })

  return agents
}

//------------------------------------------------------------------------------
function Session_subscribeAgent(agentId, name) {
  return this.subs.add(agentId, name)
}

//------------------------------------------------------------------------------
function Session_unsubscribeAgent(agentId, name) {
  return this.subs.remove(agentId, name)
}

//------------------------------------------------------------------------------
function Session_eachAgent(fn) {
  return _.each(this.agents, fn)
}

//------------------------------------------------------------------------------
function Session_addAgent(agent) {
  this.agents["id-" + agent.id] = agent

  this.eachAgent(function(ragent){
    ragent.sendEvent({
      name:      "sys.agent-connected",
      agentInfo: agent.getInfo()
    })
  })
}

//------------------------------------------------------------------------------
function Session_delAgent(agent) {
  delete this.agents["id-" + agent.id]

  this.eachAgent(function(ragent){
    ragent.sendEvent({
      name:      "sys.agent-disconnected",
      agentInfo: agent.getInfo()
    })
  })
}

//------------------------------------------------------------------------------
function Session_shutdown() {
  var self = this
  _.values(this.agents).each(function(agent){
    agent.shutdown()
  })
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

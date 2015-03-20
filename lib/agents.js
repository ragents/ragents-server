// Licensed under the Apache License. See footer for details.

var debug = require("debug")

var SMap  = require("./smap")
var utils = require("./utils")

var DEBUG = debug("ragents:agents")

//------------------------------------------------------------------------------
exports.createAgent = createAgent

function createAgent(channel, info) {
  return new Agent(channel, info)
}

//------------------------------------------------------------------------------
function Agent(channel, info) {
  this.channel = channel
  this.info = {
    id:     channel.nextAgentID(),
    name:   info.name,
    title:  info.title
  }
  DEBUG("new Agent(" + utils.JS(this.info) + ")")
}

Agent.prototype.shutDown = Agent_shutDown

//------------------------------------------------------------------------------
function Agent_shutDown() {
  DEBUG("agent.shutdown()")
  this.channel.delAgent(this)
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

// Licensed under the Apache License. See footer for details.

var _ = require("underscore")

//------------------------------------------------------------------------------
exports.createSubscriptions = createSubscriptions

//------------------------------------------------------------------------------
function createSubscriptions() {
  return new Subscriptions()
}

//------------------------------------------------------------------------------
function Subscriptions() {
  this.names = {}
}

Subscriptions.prototype.add            = Subscriptions_add
Subscriptions.prototype.remove         = Subscriptions_remove
Subscriptions.prototype.agentsMatching = Subscriptions_agentsMatching

//------------------------------------------------------------------------------
function Subscriptions_add(agentId, name) {
  name = "-" + name

  var bucket = this.names[name]

  if (!bucket) {
    bucket = {}
    this.names[name] = bucket
  }

  bucket[agentId] = agentId
}

//------------------------------------------------------------------------------
function Subscriptions_remove(agentId, name) {
  name = "-" + name

  var bucket = this.names[name]
  if (!bucket) return

  delete bucket[agentId]
}

//------------------------------------------------------------------------------
function Subscriptions_agentsMatching(name) {
  name = "-" + name

  var bucket = this.names[name]
  if (!bucket) return []

  var self = this

  return _.keys(buckets)
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

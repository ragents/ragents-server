// Licensed under the Apache License. See footer for details.

var _ = require("underscore")

var utils = require("./utils")

//------------------------------------------------------------------------------
exports.createRequestCallbacks = createRequestCallbacks

//------------------------------------------------------------------------------
function createRequestCallbacks(agent) {
  return new RequestCallbacks(agent)
}

//------------------------------------------------------------------------------
function RequestCallbacks(agent) {
  this.cbs = {}

  // method to return sequenced request ids
  this.nextID = utils.sequencer()
}

RequestCallbacks.prototype.add     = RequestCallbacks_add
RequestCallbacks.prototype.invoke  = RequestCallbacks_invoke

//------------------------------------------------------------------------------
function RequestCallbacks_add(cb) {
  if (!_.isFunction(cb)) throw Error("expecting parameter cb to be a function")

  var id = this.nextID()

  this.cbs["cb-" + id] = {
    fn: cb
  }

  return id
}

//------------------------------------------------------------------------------
function RequestCallbacks_invoke(message) {
  var id = "cb-" + message.requestID
  var cb = this.cbs[id]

  if (null == cb) return

  cb.fn.call(null, message)

  delete this.cbs[id]
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

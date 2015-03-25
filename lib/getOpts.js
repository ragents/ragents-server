// Licensed under the Apache License. See footer for details.

fs   = require("fs")
path = require("path")

_     = require("underscore")
nopt  = require("nopt")
ports = require("ports")

utils = require("./utils")

//------------------------------------------------------------------------------
exports.parse       = parse
exports.getHelp     = getHelp
exports.getHelpHTML = getHelpHTML
exports.printHelp   = printHelp

//------------------------------------------------------------------------------
function parse(args, optsSpec) {
  if (args[0] == "?") return printHelp()

  optsSpec = optsSpec || {}
  optsSpec.port    = [ "p", Number  ]
  optsSpec.verbose = [ "v", Boolean ]
  optsSpec.help    = [ "h", Boolean ]

  var longOpts   = {}
  var shortOpts  = {}
  var defValues  = {}

  for (var name in optsSpec) {
    var fixedName = name.replace(/_/g, "-")

    var opt = optsSpec[name]

    var shortName = opt[0]
    var type      = opt[1]
    var defValue  = opt[2]

    if (type == Boolean) defValue = false

    shortOpts[shortName] = "--" + fixedName
    longOpts[fixedName]  = type

    if (defValue != null) {
      defValues[fixedName] = defValue
    }
  }

  var parsed = nopt(longOpts, shortOpts, args, 0)

  if (parsed.help) return printHelp()

  var opts

  args = parsed.argv.remain
  opts = _.pick(parsed, _.keys(longOpts))
  opts = _.defaults(opts, defValues)

  if (opts.port == null) {
    if (process.env.PORT != null) opts.port = process.env.PORT
  }

  if (opts.port == null) {
    opts.port = ports.getPort(utils.COMMAND)
  }

  utils.verbose(opts.verbose)

  return {args:args, opts:opts}
}

//------------------------------------------------------------------------------
var HelpText
var HelpHTML

//------------------------------------------------------------------------------
function getHelp() {
  if (HelpText) return HelpText

  var helpFile = path.join(__dirname, utils.COMMAND + ".help.txt" )
  var content  = fs.readFileSync(helpFile, "utf8")

  content = content.replace(/%COMMAND%/g,     utils.COMMAND    )
  content = content.replace(/%PACKAGE%/g,     utils.PACKAGE    )
  content = content.replace(/%VERSION%/g,     utils.VERSION    )
  content = content.replace(/%DESCRIPTION%/g, utils.DESCRIPTION)
  content = content.replace(/%HOMEPAGE%/g,    utils.HOMEPAGE   )

  HelpText = content
  return HelpText
}

//------------------------------------------------------------------------------
function getHelpHTML() {
  if (HelpHTML) return HelpHTML

  var helpFile = path.join(__dirname, utils.COMMAND + ".help.txt" )
  var content  = fs.readFileSync(helpFile, "utf8")

  var homepage = "<a href='" + utils.HOMEPAGE + "'>" + utils.HOMEPAGE + "</a>"

  content = content.replace(/%COMMAND%/g,     utils.COMMAND    )
  content = content.replace(/%PACKAGE%/g,     utils.PACKAGE    )
  content = content.replace(/%VERSION%/g,     utils.VERSION    )
  content = content.replace(/%DESCRIPTION%/g, utils.DESCRIPTION)
  content = content.replace(/%HOMEPAGE%/g,    homepage   )

  HelpHTML = "<pre>" + content + "</pre>"
  return HelpHTML
}

//------------------------------------------------------------------------------
function printHelp() {
  console.log(getHelp())
  process.exit(1)
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

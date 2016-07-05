var fs = require('fs')

var helptext = fs.readFileSync(__dirname + '/helpText.txt', 'utf8').split(/\n{3}/g)

helptext.forEach(function(txt) {
  var result = txt.trim().match(/^:([^:\n]+):\n/)
  if (result) {
    module.exports[result[1]] = txt.substring(result[0].length)
  } else {
    var alias = txt.trim().match(/^:([^:\n]+): = ([^\n]+)$/)
    module.exports[alias[1]] = module.exports[alias[2]]
  }
})

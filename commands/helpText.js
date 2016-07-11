'use strict'

const helptext = require('fs')
	.readFileSync(__dirname + '/helpText.txt', 'utf8')
	.split(/\n{3,}/g)

helptext.forEach(function(txt) {
  let result = txt.trim().match(/^:([^:\n]+):\n/)
  if (result) {
    module.exports[result[1]] = txt.substring(result[0].length)
  } else {
    let alias = txt.trim().match(/^:([^:\n]+): = ([^\n]+)$/)
    if (alias)
    	module.exports[alias[1]] = module.exports[alias[2]]
  }
})

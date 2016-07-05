var vm = require('vm')

var stringify = o => JSON.stringify(o, null, 2)
var fixargs = args => Array.prototype.slice.call(args)

function safer_eval(code) {
  // global context exposed to the sandboxed code.
  // needs to be recreated every call or the context will get polluted
  var ctx = {};
  Object.defineProperty(ctx, 'log', {
    enumerable: false, configurable: false, writable: false,
    value: log
  })
  Object.defineProperty(ctx, 'console', {
    enumerable: false, configurable: false, writable: false,
    value: Object.freeze({ log: log, info: log, warn: log, error: log })
  })

  // log buffer to emulate console.log
  var buffer = []
  function log() {
    buffer.push(fixargs(arguments).map(stringify).join(' '))
  }

  var last_expression, error
  try {
    last_expression = vm.runInNewContext(code, ctx, {timeout: 100})
  } catch (e) {
    error = e
    last_expression = e.toString()
  }

  return {code, buffer, last_expression, error, ctx}
}

module.exports = safer_eval

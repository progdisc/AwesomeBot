const vm = require('vm');

const stringify = o =>
  JSON.stringify(o, null, 2);

const fixargs = args =>
  Array.prototype.slice.call(args);

const unchangable = (obj, prop, value) =>
  Object.defineProperty(obj, prop, {
    enumerable: false, configurable: false, writable: false, value,
  });

function saferEval(code) {
  // log buffer to emulate console.log
  const buffer = [];
  function log() {
    buffer.push(fixargs(arguments).map(stringify).join(' '));
  }

  // global context exposed to the sandboxed code.
  // needs to be recreated every call or the context will get polluted
  const ctx = {};
  unchangable(ctx, 'log', log);
  unchangable(ctx, 'console', Object.freeze({ log, info: log, warn: log, error: log }));

  let lastExpression;
  let error;
  try {
    lastExpression = vm.runInNewContext(code, ctx, { timeout: 100 });
  } catch (e) {
    error = e;
    lastExpression = e.toString();
  }

  return { code, buffer, lastExpression, error, ctx };
}

const commentMultiLine = s => s.split('\n').map(line => `// ${line}`).join('\n');
function handleJSEval(bot, message, cmdArgs) {
  const code = cmdArgs;
  const result = saferEval(code);
  const buffer = result.buffer.length ? result.buffer.map(commentMultiLine).join('\n') : '';

  let output = 'here\'s the result:\n';
  output += '```js\n';
  output += `${result.code}\n${buffer}\n//=> ${result.lastExpression}\n`;
  output += '```';
  return message.channel.sendMessage(output);
}

module.exports = {
  usage: 'jseval <js expression> - runs <js expression>, displays the result',
  run: handleJSEval,
};

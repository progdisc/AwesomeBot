var Discord = require('discord.js');
var vm = require('vm');

var helpCommands = require('./commands/helpText');
var stream = require('./commands/stream');

var bot = new Discord.Client();

var botcmd = '!bot';
var helpcmd = 'help';

var basicHelp = "Awesome is my name, don't wear it out! " +
  `Please type '${botcmd} ${helpcmd} *channel you need help with*' for more info.`;

var helpObj = {};
helpObj[botcmd + ' ' + helpcmd] = helpObj[botcmd] = basicHelp;

// basic help commands
var simpleResponses = Object.assign(helpObj,
  Object.keys(helpCommands)
    .map(k => [`${botcmd} ${helpcmd} ${k}`, helpCommands[k]])
    .reduce((obj, row) => (obj[row[0]] = row[1], obj), {}));

bot.on('message', function (message) {
  var key = message.content.toLowerCase().trim();

  if (simpleResponses[key]) return bot.reply(message, simpleResponses[key]);

  stream.checkAndTrackJoinMeLinks(bot, message);

  if (key.indexOf(botcmd) !== 0) return;

  stream.handleJoinMeCommands(bot, message);

  var jscompileindex = message.content.indexOf('jseval');

  if (jscompileindex > 0) {
    return bot.reply(message, safer_eval(message.content.substr(jscompileindex + 7)));
  }
});

function safer_eval(code) {
  var result = 'Executing javascript ```js\n' + code + '\n';
  var buffer = '';

  function log() {
    buffer += '//[log] ' + Array.prototype.slice.call(arguments).join(' ') + '\n';
  }

  var context = {
    log: log,
    console: { log: log, info: log, warn: log, error: log },
  };

  var last_exp;
  try {
    last_exp = vm.runInNewContext(code, context, { timeout: 100 });
  } catch (e) {
    last_exp = e.toString();
  }

  result += buffer + '//=> ' + last_exp + '```';

  return result;
}

bot.loginWithToken('MTk4MjQ5NTI1ODU1NTE4NzIx.Cldcvw.xAQgYTI9IN_ACmCTBVydTQiM66k');

var Discord = require('discord.js');

var bot = new Discord.Client();

var helpCommands = require('./commands/helpText.js');
var stream = require('./commands/stream');
var jseval = require('./commands/jseval');

var comment_multi_line = s => s.split('\n').map(line => '// ' + line).join('\n');

var botcmd = '!bot';
var helpcmd = 'help';
// js_eval_cmd should end with a space
var js_eval_cmd = 'jseval ';

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

  if (simpleResponses[key])
    return bot.reply(message, simpleResponses[key]);

  stream.checkAndTrackJoinMeLinks(bot, message);

  if (key.indexOf(botcmd) !== 0)
    return;

  stream.handleJoinMeCommands(bot, message);

  var js_eval_idx = message.content.indexOf(js_eval_cmd);
  if (js_eval_idx > 0) {
    var code = message.content.substr(js_eval_idx + js_eval_cmd.length);
    var result = jseval(code);
    var buffer = result.buffer.length ?
      result.buffer.map(comment_multi_line).join('\n') + '\n' :
      '';

    var output = 'Executing javascript ```js\n' +
      result.code + '\n' + buffer +
      '//=> ' + result.last_expression + '```';
    return bot.reply(message, output);
  }

});

bot.loginWithToken('MTk4MjQ5NTI1ODU1NTE4NzIx.Cldcvw.xAQgYTI9IN_ACmCTBVydTQiM66k');

var Discord = require('discord.js');
var Settings = require('./settings.json');

var Help = require('./commands/help.js');
var Streams = require('./commands/streams.js');
var JSEval = require('./commands/jseval.js');

var cmds = {
  "help" : Help.handleHelp,
  "streams": Streams.handleStreams,
  "jseval": JSEval.handleJSEval,
};

var bot = new Discord.Client();

bot.on('message', function (message) {
  // don't respond to own messages
  if (bot.user.username == message.author.username) return;

  // check if message is a command
  var cmd_re = new RegExp(`^${Settings.bot_cmd} (${Object.keys(cmds).join('|')})(.*) *`, 'i');
  var cmd_match = message.cleanContent.match(cmd_re);

  if (!cmd_match) {
    // not a command
    return;
  } else {
    // process command
    var cmd = cmd_match[1];
    var cmd_args = cmd_match[2].trim();

    cmds[cmd](bot, message, cmd_args);
  }
});

bot.loginWithToken(Settings.api_token);

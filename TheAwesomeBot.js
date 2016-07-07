var Discord = require('discord.js');
var Settings = require('./settings.json');

var Help = require('./commands/help.js');
var Stream = require('./commands/stream.js');
var JSEval = require('./commands/jseval.js');

var cmds = {
  help: Help.handleHelp,
  stream: Stream.handleStreams,
  jseval: JSEval.handleJSEval,
};

var bot = new Discord.Client({autoReconnect: true});

// save the RE as they're expensive to create
var cmd_re = new RegExp(`^${Settings.bot_cmd} (${Object.keys(cmds).join('|')})(.*) *`, 'i');

bot.on('message', function (message) {
  // don't respond to own messages
  if (bot.user.username == message.author.username)
    return;

  // check if message is a command
  var cmd_match = message.cleanContent.match(cmd_re);

  // not a known command
  if (!cmd_match)
    return;

  // process command
  var cmd = cmd_match[1];
  var cmd_args = cmd_match[2].trim();

  cmds[cmd](bot, message, cmd_args);
});

bot.on('disconnected', function () {
  console.warn('Bot has been disconnected from server...')
})

bot.on('error', function (e) {
  console.error("error: ", e)
  console.error(e.trace)
})

bot.on('ready', function () {
  console.log('Connected to discord server')
})

console.log('Connecting...')
bot.loginWithToken(Settings.api_token);

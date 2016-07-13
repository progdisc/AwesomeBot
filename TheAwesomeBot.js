var Discord = require('discord.js');
var Settings = require('./settings.json');

// commands
var Help = require('./commands/help.js');
var Stream = require('./commands/stream.js');
var JSEval = require('./commands/jseval.js');
var Pros = require('./commands/pro.js');
var Vote = require('./commands/vote.js');
var Uptime = require('./commands/uptime.js');

function TheAwesomeBot(token, discord_opt) {
  this.token = token;
  this.bot = new Discord.Client(discord_opt || { autoReconnect: true });

  this.cmds = {
    help: Help.handleHelp,
    stream: Stream.handleStreams,
    pros: Pros.handlePro,
    jseval: JSEval.handleJSEval,
    vote: Vote.handleVote,
    uptime: Uptime.handleUptime,
  };

  // store the RE as they're expensive to create
  this.cmd_re = new RegExp(`^${Settings.bot_cmd} (${Object.keys(this.cmds).join('|')})(.*) *`, 'i');
};

TheAwesomeBot.prototype.onMessage = function () {
  var instance = this;
  return (function (message) {
    // don't respond to own messages
    if (instance.bot.user.username === message.author.username)
      return;

    // check if message is a command
    var cmd_match = message.cleanContent.match(instance.cmd_re);

    // not a known command
    if (!cmd_match) {
      if (message.content.indexOf(Settings.bot_cmd) === 0) {
        instance.cmds.help(instance.bot, message, cmd_args);
      }

      return;
    }

    // process commands
    var cmd = cmd_match[1];
    var cmd_args = cmd_match[2].trim();

    instance.cmds[cmd](instance.bot, message, cmd_args);
  });
};

TheAwesomeBot.prototype.onReady = function () {
  var instance = this;
  return (function () {
    console.log('Connected to discord server');

    console.log('Loading pros..');
    Pros.loadAndMatchPros(instance.bot, (err, status) => {
      if (err) console.log(err);
      else if (status == 'Done') console.log('Done reading in pros from #helpdirectory!');
    });

    console.log('Deleting all stream channels..');
    Stream.autoRemove(instance.bot);
  });
};

TheAwesomeBot.prototype.onDisconnected = function () {
  return (function () {
    console.warn('Bot has been disconnected from server...');
  });
};

TheAwesomeBot.prototype.onError = function () {
  return (function (err) {
    console.error('error: ', e);
    console.error(e.trace);
  });
};

TheAwesomeBot.prototype.init = function () {
  // setup bindings
  this.bot
    .on('message', this.onMessage())
    .on('ready', this.onReady())
    .on('disconnected', this.onDisconnected())
    .on('error', this.onError());

  console.log('Connecting...');
  this.bot.loginWithToken(this.token, this.discord_opt);
};

module.exports = TheAwesomeBot;

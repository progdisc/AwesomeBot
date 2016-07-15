var path = require('path');
var Discord = require('discord.js');

function TheAwesomeBot(token, discord_opt) {
  this.token = token;
  this.client = new Discord.Client(discord_opt || { autoReconnect: true });
  this.settings = require('./settings.json');
  this.commands = {};
  this.usageList = '';

  // store the RE as they're expensive to create
  this.cmd_re = new RegExp(`^${this.settings.bot_cmd}[\\s]+([^ ]*)[\\s]*(.*)[\\s]*`, 'i');
};

TheAwesomeBot.prototype.onMessage = function () {
  var instance = this;
  return (function (message) {
    // don't respond to own messages
    if (instance.client.user.username === message.author.username)
      return;

    // check if message is a command
    var cmd_match = message.cleanContent.match(instance.cmd_re);

    // not a known command
    if (!cmd_match || Object.keys(instance.commands).indexOf(cmd_match[1]) === -1) {

      if (message.content.match(new RegExp(`^${instance.settings.bot_cmd}[\\s]*( .*)?$`, 'i'))) {
        var helpText = 'maybe try these valid commands? *kthnxbye!*\n\n```';
        helpText += instance.usageList;
        helpText += '```';
        instance.client.reply(message, helpText);
      }

      return;
    }

    // process commands
    var cmd = cmd_match[1];
    var cmd_args = cmd_match[2].trim();

    instance.commands[cmd].run(instance, message, cmd_args);
  });
};

TheAwesomeBot.prototype.onReady = function () {
  var instance = this;
  return (function () {
    console.log('\nConnected to discord server!');

    console.log('Running initializations...');
    for (var cmd in instance.commands) {
      if (typeof instance.commands[cmd].init == 'function') {
        instance.commands[cmd].init(instance);
      }
    };
  });
};

TheAwesomeBot.prototype.serverNewMember = function () {
  var instance = this;
  return (function (server, user) {
    instance.client.sendMessage(user, instance.usageList);
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

TheAwesomeBot.prototype.loadCommands = function (cmdList) {
  var instance = this;
  instance.usageList = '';
  cmdList.forEach(cmd => {
    var fullpath = path.join(__dirname, 'commands', cmd, `${cmd}.js`);
    var script = require(fullpath);
    instance.commands[cmd] = script;

    var usageObj = script.usage;
    var usageStrs = [];
    if (Array.isArray(usageObj)) {
      usageObj.forEach(u => usageStrs.push(u));
    } else {
      usageStrs.push(usageObj.toString());
    }

    usageStrs.forEach(u => instance.usageList += `
- ${instance.settings.bot_cmd} ${u}`);
  });
};

TheAwesomeBot.prototype.init = function () {
  // load commands
  console.log('Loading commands...');
  this.loadCommands(this.settings.commands);

  // setup events
  console.log('Setting up event bindings...');
  this.client
    .on('message', this.onMessage())
    .on('ready', this.onReady())
    .on('serverNewMember', this.serverNewMember())
    .on('disconnected', this.onDisconnected())
    .on('error', this.onError());

  console.log('Connecting...');
  this.client.loginWithToken(this.token, this.discord_opt);
};

module.exports = TheAwesomeBot;

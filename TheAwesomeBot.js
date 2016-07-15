const path = require('path');
const Discord = require('discord.js');
const Settings = require('./settings.json');

function TheAwesomeBot(token, discordOpt) {
  this.token = token;
  this.client = new Discord.Client(discordOpt || { autoReconnect: true });
  this.settings = Settings;
  this.commands = {};
  this.usageList = '';

  // store the RE as they're expensive to create
  this.cmd_re = new RegExp(`^${this.settings.bot_cmd}[\\s]+([^ ]*)[\\s]*(.*)[\\s]*`, 'i');
}

TheAwesomeBot.prototype.onMessage = () => {
  const instance = this;
  return (message => {
    // don't respond to own messages
    if (instance.client.user.username === message.author.username) {
      return;
    }

    // check if message is a command
    const cmdMatch = message.cleanContent.match(instance.cmd_re);

    // not a known command
    if (!cmdMatch || Object.keys(instance.commands).indexOf(cmdMatch[1]) === -1) {
      if (message.content.match(new RegExp(`^${instance.settings.bot_cmd}[\\s]*( .*)?$`, 'i'))) {
        let helpText = 'maybe try these valid commands? *kthnxbye!*\n\n```';
        helpText += instance.usageList;
        helpText += '```';
        instance.client.reply(message, helpText);
      }
      return;
    }

    // process commands
    const cmd = cmdMatch[1];
    const cmdArgs = cmdMatch[2].trim();

    instance.commands[cmd].run(instance, message, cmdArgs);
  });
};

TheAwesomeBot.prototype.onReady = () => {
  const instance = this;
  return (() => {
    console.log('\nConnected to discord server!');

    console.log('Running initializations...');
    Object.keys(instance.commands).forEach(cmd => {
      if (typeof instance.commands[cmd].init === 'function') {
        instance.commands[cmd].init(instance);
      }
    });
  });
};

TheAwesomeBot.prototype.serverNewMember = () => {
  const instance = this;
  return ((server, user) => {
    instance.client.sendMessage(user, instance.usageList);
  });
};

TheAwesomeBot.prototype.onDisconnected = () =>
  (() => console.warn('Bot has been disconnected from server...'));

TheAwesomeBot.prototype.onError = () =>
  ((err) => {
    console.error('error: ', err);
    console.error(err.trace);
  });

TheAwesomeBot.prototype.loadCommands = (cmdList) => {
  const instance = this;
  instance.usageList = '';
  cmdList.forEach(cmd => {
    const fullpath = path.join(__dirname, 'commands', cmd, `${cmd}.js`);
    const script = require(fullpath); // eslint-disable-line global-require
    instance.commands[cmd] = script;

    const usageObj = script.usage;
    const usageStrs = [];
    if (Array.isArray(usageObj)) {
      usageObj.forEach(u => usageStrs.push(u));
    } else {
      usageStrs.push(usageObj.toString());
    }

    usageStrs.forEach(u => (instance.usageList += `\n- ${instance.settings.bot_cmd} ${u}`));
  });
};

TheAwesomeBot.prototype.init = () => {
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

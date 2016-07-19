const path = require('path');
const Discord = require('discord.js');
const Settings = require('./settings.json');

class TheAwesomeBot {
  constructor(token, discordOpt) {
    this.token = token;
    this.client = new Discord.Client(discordOpt || { autoReconnect: true });
    this.settings = Settings;
    this.commands = {};
    this.usageList = '';

    // store the RE as they're expensive to create
    this.cmd_re = new RegExp(`^${this.settings.bot_cmd}[\\s]+([^ ]*)[\\s]*(.*)[\\s]*`, 'i');
  }

  onMessage() {
    return (message => {
      // don't respond to own messages
      if (this.client.user.username === message.author.username) {
        return;
      }

      // check if message is a command
      const cmdMatch = message.cleanContent.match(this.cmd_re);

      // not a known command
      if (!cmdMatch || Object.keys(this.commands).indexOf(cmdMatch[1]) === -1) {
        if (message.content.match(new RegExp(`^${this.settings.bot_cmd}[\\s]*( .*)?$`, 'i'))) {
          let helpText = 'maybe try these valid commands? *kthnxbye!*\n\n```';
          helpText += this.usageList;
          helpText += '```';
          this.client.reply(message, helpText);
        }
        return;
      }

      // process commands
      const cmd = cmdMatch[1];
      const cmdArgs = cmdMatch[2].trim();

      this.commands[cmd].run(this, message, cmdArgs);
    });
  }

  onReady() {
    return (() => {
      console.log('\nConnected to discord server!');

      console.log('Running initializations...');
      Object.keys(this.commands).forEach(cmd => {
        if (typeof this.commands[cmd].init === 'function') {
          this.commands[cmd].init(this);
        }
      });
    });
  }

  serverNewMember() {
    return ((server, user) => {
      this.client.sendMessage(user, this.usageList);
    });
  }

  onDisconnected() {
    return (() =>
      console.warn('Bot has been disconnected from server...'));
  }

  onError() {
    return ((err) => {
      console.error('error: ', err);
      console.error(err.trace);
    });
  }

  loadCommands(cmdList) {
    this.usageList = '';
    cmdList.forEach(cmd => {
      const fullpath = path.join(__dirname, 'commands', cmd, `${cmd}.js`);
      const script = require(fullpath); // eslint-disable-line global-require
      this.commands[cmd] = script;

      const usageObj = script.usage;
      if (usageObj) {
        const usageStrs = [];
        if (Array.isArray(usageObj)) {
          usageObj.forEach(u => usageStrs.push(u));
        } else {
          usageStrs.push(usageObj.toString());
        }

        usageStrs.forEach(u => (this.usageList += `\n- ${this.settings.bot_cmd} ${u}`));
      }
    });
  }

  init() {
    // load commands
    console.log('Loading commands...');
    this.loadCommands(this.settings.commands);

    // setup events
    console.log('Setting up event bindings...');
    this.client
      .on('ready', this.onReady())
      .on('serverNewMember', this.serverNewMember())
      .on('message', this.onMessage())
      .on('error', this.onError());

    console.log('Connecting...');
    this.client.loginWithToken(this.token, this.discord_opt);
  }
}

module.exports = TheAwesomeBot;


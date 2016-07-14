'use strict'

const helpCommands = require('./helpText.js');
const helpObj = {};

// basic help commands
const simpleResponses = Object.assign(
  helpObj,
  Object.keys(helpCommands)
    .map(k => [`${k}`, helpCommands[k]])
    .reduce((obj, row) => (obj[row[0]] = row[1], obj), {}));

module.exports = {
  usage: 'help <topic> - displays known resources about <topic>',

  run: (bot, message, cmd_args) => {
    if (cmd_args) {
      let response = simpleResponses[cmd_args.toLowerCase()];
      bot.client.reply(message, response ? response :
                "I don't know anything about that. If you have a suggestion, let us know!");
    } else {
      bot.client.reply(message, "Awesome is my name, don't wear it out! Please give a me topic for more info.");
    }
  }
}


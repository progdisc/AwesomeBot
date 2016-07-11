'use strict'
const Settings = require('../settings.json');
const helpCommands = require('./helpText.js');

const basicHelp = "Awesome is my name, don't wear it out! " +
  `Please type '${Settings.bot_cmd} help *channel you need help with*' for more info.`;

const helpObj = {};
helpObj[Settings.bot_cmd + ' help'] = helpObj[Settings.bot_cmd] = basicHelp;

// basic help commands
const simpleResponses = Object.assign(
  helpObj,
  Object.keys(helpCommands)
    .map(k => [`${Settings.bot_cmd} help ${k}`, helpCommands[k]])
    .reduce((obj, row) => (obj[row[0]] = row[1], obj), {}))

function handleHelp(bot, message, cmd_args) {
  let response = simpleResponses[message.cleanContent.toLowerCase()]

  return bot.reply(message, response ? response :
    "I don't know anything about that. If you have a suggestion, let us know!")
}

module.exports = {handleHelp}

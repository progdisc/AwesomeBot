var Settings = require('../settings.json');
var helpCommands = require('./helpText.js');

function handleHelp(bot, message, cmd_args) {
  var basicHelp = "Awesome is my name, don't wear it out! " + `Please type '${Settings.bot_cmd} help *channel you need help with*' for more info.`;

  var helpObj = {};
  helpObj[Settings.bot_cmd + ' help'] = helpObj[Settings.bot_cmd] = basicHelp;

  // basic help commands
  var simpleResponses = Object.assign(
    helpObj,
    Object.keys(helpCommands)
      .map(k => [`${Settings.bot_cmd} help ${k}`, helpCommands[k]])
      .reduce((obj, row) => (obj[row[0]] = row[1], obj), {})
  );

  if (simpleResponses[message.cleanContent.toLowerCase()]) {
    return bot.reply(message, simpleResponses[message.cleanContent.toLowerCase()]);
  } else {
    return bot.reply(message, "I don't know anything about that. If you have a suggestion, let us know!");
  }
}

module.exports = {
  handleHelp: handleHelp
}

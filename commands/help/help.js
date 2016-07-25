const fs = require('fs');
const path = require('path');

const getFileList = (dirName) => {
  const fileList = fs.readdirSync(dirName);
  return fileList || [];
};

const loadHelpText = (filename) => {
  const content = fs.readFileSync(filename);
  return content || '';
};

// basic help commands
const simpleResponses = {};

module.exports = {
  usage: 'help <topic> - displays known resources about <topic>',

  run: (bot, message, cmdArgs) => {
    if (cmdArgs) {
      const response = simpleResponses[cmdArgs.toLowerCase()];
      bot.client.reply(message, response ||
        "I don't know anything about that. If you have a suggestion, let us know!");
    } else {
      bot.client.reply(message,
        "Awesome is my name, don't wear it out! Please give a me topic for more info.");
    }
  },

  init: () => {
    console.log('Loading help topics');
    getFileList(path.join(__dirname, 'topics')).forEach(fn => {
      simpleResponses[path.basename(fn, '.txt')] = loadHelpText(path.join(__dirname, 'topics', fn));
    });
  },
};


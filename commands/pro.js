var proTerms = require('./proTerms.js');

/*
  This module is meant to handle the command '!bot pro [lang]'
*/

//in-memory-object to hold tutors and terms
var pros = {};

function _initProsObject() {
  proTerms = proTerms
    .filter(term => term.length > 0)
    .map(term => term.toLowerCase().trim());

  proTerms.forEach(term => {
    pros[term] = [];
  });
}

function loadAndMatchPros(bot, cb) {

  _initProsObject();

  var helpChannel = bot.channels.get('name', 'helpdirectory');

  bot.getChannelLogs(helpChannel, 50, (err, messages) => {

    if (err) {
      console.log(err);
      cb(err, null);
    }

    messages.forEach((messageObj) => {
      proTerms.forEach((term) => {
        if (messageObj.content.toLowerCase().includes(term)) {
          pros[term].push(messageObj.author);
        }
      });
    });

    cb(null, 'Done');
  });
}

function listPros(bot, message, cmd_args) {
  var lang = cmd_args.toLowerCase().trim();
  var replyString = `Here are some pros online that can help with ${cmd_args}: `;

  if (pros[lang]) {
    pros[lang].forEach(pro => {
      if (pro.status == 'online') {
        replyString += '\n' + `${pro.mention()}`;
      }
    });
    bot.reply(message, replyString);
  }
}

function handlePro(bot, message, cmd_args) {
  listPros(bot, message, cmd_args);
}

module.exports = {
  loadAndMatchPros: loadAndMatchPros,
  handlePro: handlePro,
};

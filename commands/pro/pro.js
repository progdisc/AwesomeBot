var proTerms = require('./proTerms.js');

/*
  This module is meant to handle the command '!bot pro [lang]'
*/

//in-memory-object to hold pros and terms
var pros = {};

function _initProsObject() {
  proTerms = proTerms
    .filter(term => term.length > 0)
    .map(term => term.toLowerCase().trim());

  proTerms.forEach(term => {
    pros[term] = [];
  });
}

function _getProsOnline(server) {
  var prosRole = server.roles.get('name', 'Pros');

  var prosOnline = server.usersWithRole(prosRole)
    .filter(pros => pros.status == 'online')
    .map(pro => pro.username);

  return new Set(prosOnline);
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
          pros[term].push(
            {
              username: messageObj.author.username,
              mention: messageObj.author.mention(),
            }
          );
        }
      });
    });

    cb(null, 'Done');
  });
}

function listPros(bot, message, cmd_args) {
  var lang = cmd_args.toLowerCase().trim();
  var replyString = `Here are some pros online that can help with ${cmd_args}: `;
  var server = bot.servers['0'];

  var prosOnline = _getProsOnline(server);

  if (pros[lang] && pros[lang].length > 0) {
    pros[lang].forEach(pro => {
      if (prosOnline.has(pro.username)) {
        replyString += '\n' + `${pro.mention}`;
      }
    });
    return bot.reply(message, replyString);
  } else {
    return bot.reply(message, `No pros found for ${cmd_args} :(`);
  }
}

function handlePro(bot, message, cmd_args) {
  listPros(bot, message, cmd_args);
}

module.exports = {
  loadAndMatchPros: loadAndMatchPros,
  handlePro: handlePro,
};

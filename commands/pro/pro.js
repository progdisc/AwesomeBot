//in-memory object to hold pros and terms
var pros = {};

function _initProsObject() {
  proTerms = require('./proTerms.js')
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

  var helpChannel = bot.client.channels.get('name', 'helpdirectory');

  bot.client.getChannelLogs(helpChannel, 50, (err, messages) => {

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

module.exports = {
  usage: 'pro <topic> - list of people who knows about <topic>',

  run: (bot, message, cmd_args) => {
    if (!cmd_args) {
      bot.client.reply(message, 'please gimme a topic, will\'ya?');
      return;
    }
    var lang = cmd_args.toLowerCase().trim();
    var replyString = `Here are some pros online that can help with "${cmd_args}": `;
    var server = bot.client.servers['0'];

    var prosOnline = _getProsOnline(server);

    if (pros[lang] && pros[lang].length > 0) {
      pros[lang].forEach(pro => {
        if (prosOnline.has(pro.username)) {
          replyString += '\n' + `${pro.mention}`;
        }
      });
      return bot.client.reply(message, replyString);
    } else {
      return bot.client.reply(message, `No pros found for ${cmd_args} :(`);
    }
  },

  init: bot => {
    console.log('Loading pros...');
    loadAndMatchPros(bot, (err, status) => {
      if (err) console.log(err);
      else if (status == 'Done') console.log('Done reading in pros from #helpdirectory!');
    });
  }
}


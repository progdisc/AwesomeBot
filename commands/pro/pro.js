let proTerms = require('./proTerms.js');

// in-memory object to hold pros and terms
const pros = {};

function initProsObject() {
  proTerms = proTerms
    .filter(term => term.length > 0)
    .map(term => term.toLowerCase().trim());

  proTerms.forEach(term => {
    pros[term] = [];
  });
}

function getProsOnline(server) {
  const prosRole = server.roles.find('name', 'Pros');
  const prosOnline = server.usersWithRole(prosRole)
    .filter(p => p.status === 'online')
    .map(p => p.username);

  return new Set(prosOnline);
}

function loadAndMatchPros(bot, cb) {
  initProsObject();

  const helpChannel = bot.client.channels.find('name', 'helpdirectory');

  helpChannel.fetchMessages({limit: 50})
  .then(messages => {
    messages.forEach((messageObj) => {
      proTerms.forEach((term) => {
        if (messageObj.content.toLowerCase().includes(term)) {
          pros[term].push({
              username: messageObj.author.username,
              mention: messageObj.author.toString(), // mention() ?
          });
        }
      });
    });

    cb(null, 'Done');
  })
  .catch(err => {
      console.error(err);
      cb(err, null);
  });
}

module.exports = {
  usage: 'pro <topic> - list of people who knows about <topic>',

  run: (bot, message, cmdArgs) => {
    if (!cmdArgs) {
      message.channel.sendMessage('please gimme a topic, will\'ya?');
      return;
    }
    const lang = cmdArgs.toLowerCase().trim();
    let replyString = `Here are some pros online that can help with "${cmdArgs}": `;
    const server = bot.client.servers['0'];

    const prosOnline = getProsOnline(server);

    if (pros[lang] && pros[lang].length > 0) {
      pros[lang].forEach(pro => {
        if (prosOnline.has(pro.username)) {
          replyString += `\n${pro.mention}`;
        }
      });
    
      message.channel.sendMessage(replyString);
    } else {
      message.channel.sendMessage(`No pros found for ${cmdArgs} :(`);
    }
  },

  init: bot => {
    console.log('Loading pros...');
    loadAndMatchPros(bot, (err, status) => {
      if (err) console.log(err);
      else if (status === 'Done') console.log('Done reading in pros from #helpdirectory!');
    });
  },
};


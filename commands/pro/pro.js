let proTerms = require('./proTerms.js');
const proRegs = {};

// in-memory object to hold pros and terms
const pros = {};
const alphabet = 'abcdefghijklmnopqrstuvwxyz';

function initProsObject() {
  proTerms = proTerms
    .filter(terms => terms[0].length > 0);

  proTerms.forEach(termList => {
    pros[termList[0]] = [];
    const list = termList.join('|').toLowerCase().split('').map(c => alphabet.includes(c)||c=='|'?c:'\\'+c).join('');
    proRegs[termList[0]] = new RegExp(`(^|[^a-z])(${list})($|[^a-z])`, 'i');
  });
}

function getProsOnline(guild) {
  const prosOnline = guild.members.filterArray(member => member.roles.find('name', 'Pros'))
    .filter(p => p.presence.status === 'online' || p.presence.status === 'idle')
    .map(p => p.user.username);

  return new Set(prosOnline);
}

function loadAndMatchPros(bot, cb) {
  initProsObject();

  const helpChannel = bot.client.channels.find('name', 'helpdirectory');

  helpChannel.fetchMessages({limit: 100})
  .then(messages => {
    messages.forEach((messageObj) => {
      proTerms.forEach(termList => {
        if (messageObj.content.toLowerCase().match(proRegs[termList[0]])) {
          pros[termList[0]].push({
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
    let lang = cmdArgs.toLowerCase().trim();
    const guild = bot.client.guilds.first();

    proTerms.forEach(termList => {
      if (termList.map(t => t.toLowerCase()).includes(lang)) lang = termList[0];
    });

    let replyString = `Here are some pros online that can help with **${lang}**: `;

    const prosOnline = getProsOnline(guild);

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


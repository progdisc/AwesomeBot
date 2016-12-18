let proTerms = require('./proTerms.js');
const proRegs = {};

// in-memory object to hold pros and terms
const pros = {};
const alphabet = 'abcdefghijklmnopqrstuvwxyz';

let pro_re;

proTerms = proTerms
  .filter(terms => terms[0].length > 0);


function fix_escapes(str) {
  return str.replace(fix_escapes.re, '\\$&')
}
fix_escapes.re = /[^a-z0-9|]/ig


function initProsMatcher() {
  const pro_re_terms = proTerms.map(function(termList) {
    const termPros = new Set();

    termPros.original = termList[0]
    for (let term of termList)
      pros[term.toLowerCase()] = termPros;

    return fix_escapes(termList.join('|'));
  });
  
  pro_re = new RegExp(`(?:^|\\W)(${pro_re_terms.join('|')})(?:$|\\W)`, 'gi')
}


function getProsOnline(guild) {
  return new Set(guild.members
    .filter(m => m.roles.find('name', 'Pros') && ['online', 'idle'].includes(m.presence.status))
    .map(p => p.user.username));
}


function loadAndMatchPros(bot) {
  const helpChannel = bot.client.channels.find('name', 'helpdirectory');

  return helpChannel.fetchMessages({limit: 100})
  .then(messages => {
    messages.forEach((messageObj) => {
      pro_re.lastIndex = 0;
      let match;
      while (match = pro_re.exec(messageObj.content)) {
        pros[match[1].toLowerCase()].add(messageObj.author.username)
      }
    });
  })
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

    {
      pro_re.lastIndex = 0;
      let match = pro_re.exec(lang);
      lang = (match && match[1] || lang).toLowerCase();
    }

    let replyString;
    const online = getProsOnline(guild);

    if (pros[lang] && pros[lang].size > 0) {
      let langName = pros[lang].original;
      replyString = `Here are some pros online that can help with **${langName}**: \n`;

      for (let user of pros[lang]) {
        if (online.has(user))
          replyString += `\n${user}`
      }
    } else {
      replyString = `No pros found for ${cmdArgs} :(`
    }

    message.channel.sendMessage(replyString);
  },

  init: bot => {
    console.log('Loading pros...');
    initProsMatcher();
    loadAndMatchPros(bot)
      .then(function(status) {
        console.log('Done reading in pros from #helpdirectory!')
      })
      .catch(function() {
        console.error(err);
        console.error(err.stack);
      })
  },
};


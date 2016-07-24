function handleKick(bot, user, server) {
  bot.client.kickMember(user, server, (err) => {
    if (err) console.log(err);
  });
}

function handleMute(bot, user, server) {
  bot.client.muteMember(user, server, (err) => {
    if (err) console.log(err);
  });
}

const voteTypes = {
  kick: handleKick,
  mute: handleMute,
};

/*
 * currentVotes: dictionary of votings.
 * Each voting should look like:
 * {
 *  username: <username>,
 *  votes: [<people who voted]
 * }
 */
const currentVotes = {};
Object.keys(voteTypes).forEach(k => {
  currentVotes[k] = {};
});

function getUserRoles(server, user) {
  return new Set(server.rolesOfUser(user.id).map(r => r.name));
}

function setIntersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

function processVote(type, bot, message, server, user) {
  let voting = currentVotes[type][user.username];

  if (!voting) {
    // sets a timeout for this voting
    const timeoutClj = () => {
      bot.client.sendMessage(message.channel,
        `Vote to ${type} ${user.mention()} has timed out. Phew!`);
      delete currentVotes[type][user.username];
    };
    const timeoutObj = setTimeout(timeoutClj, bot.settings.voting.timeout_in_minutes * 1000 * 60);

    voting = {
      username: user.username,
      votes: [],
      timeout: timeoutObj,
    };
    currentVotes[type][user.username] = voting;
  }

  // ignore votes by the same user
  if (voting.votes.indexOf(message.author.username) >= 0) {
    return;
  }
  voting.votes.push(message.author.username);
  if (voting.votes.length >= bot.settings.voting.voteThreshold) {
    clearTimeout(voting.timeout);
    bot.client.sendMessage(message.channel,
      `Sorry, ${user.mention()}, but their wish is my command!`);
    voteTypes[type](bot, user, server);
    delete currentVotes[type][user.username];
  } else {
    let msg = `[${voting.votes.length}/${bot.settings.voting.voteThreshold}]`;
    msg += ` votes to ${type} ${user.mention()}!`;
    bot.client.sendMessage(message.channel, msg);
  }
}

module.exports = {
  usage: `vote <${Object.keys(voteTypes).join('|')}> <@user> - start a vote against <@user>`,

  run: (bot, message, cmdArgs) => {
    if (bot.client.user.username === message.author.username) return;

    // command validation
    const voteRe = new RegExp(`^(${Object.keys(voteTypes).join('|')})[\\s]+@(.*)`, 'i');
    const reMatch = cmdArgs.match(voteRe);
    if (!reMatch) return;

    const server = bot.client.servers['0'];
    const voteType = reMatch[1];

    const user = message.mentions[0];
    if (!user) return;

    // user validation
    // warning: assume bot is in one server only
    if (user.username === message.author.username) {
      bot.client.reply(message, ' you can\'t start a vote against yourself, silly.');
      return;
    }
    if (!user) {
      return;
    }

    // roles validation
    const userRoles = getUserRoles(server, user);
    if (setIntersection(userRoles, new Set(bot.settings.voting.immuneRoles)).size > 0) {
      bot.client.sendMessage(message.channel,
        `I'm afraid I can't do that, ${message.author.mention()}...`);
      return;
    }

    processVote(voteType, bot, message, server, user);
  },
};


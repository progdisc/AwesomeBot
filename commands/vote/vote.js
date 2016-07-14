var voteTypes = {
  'kick' : handleKick,
  'mute' : handleMute
};

function handleKick(bot, user, server) {
  bot.client.kickMember(user, server, function(err) {
    if (err) console.log(err);
  });
}

function handleMute(bot, user, server) {
  bot.client.muteMember(user, server, function(err) {
    if (err) console.log(err);
  });
}

/*
 * currentVotes: dictionary of votings.
 * Each voting should look like:
 * {
 *  username: <username>,
 *  votes: [<people who voted]
 * }
 */
var currentVotes = {};
Object.keys(voteTypes).forEach(function(k) {
  currentVotes[k] = {};
});

function getUserRoles(server, user) {
  return new Set(server.rolesOfUser(user.id).map(r => r.name));
}

function setIntersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

function processVote(type, bot, message, server, user) {
  var voting = currentVotes[type][user.username];

  if (!voting) {
    // sets a timeout for this voting
    var timeoutClj = function() {
      bot.client.sendMessage(message.channel, `Vote to ${type} ${user.mention()} has timed out. Phew!`);
      delete currentVotes[type][user.username];
    };
    var timeoutObj = setTimeout(timeoutClj, bot.settings.voting.timeout_in_minutes * 1000 * 60);

    voting = {
      username: user.username,
      votes: [],
      timeout: timeoutObj
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
    bot.client.sendMessage(message.channel, `Sorry, ${user.mention()}, but their wish is my command!`);
    voteTypes[type](bot, user, server);
    delete currentVotes[type][user.username]
  } else {
    bot.client.sendMessage(message.channel, `[${voting.votes.length}/${bot.settings.voting.voteThreshold}] votes to ${type} ${user.mention()}!`);
  }
}

module.exports = {
  usage: `vote <${Object.keys(voteTypes).join('|')}> <@user> - start a vote against <@user>`,

  run: (bot, message, cmd_args) => {
    if (bot.client.user.username == message.author.username) return;

    // command validation
    var vote_re = new RegExp(`^(${Object.keys(voteTypes).join('|')})[\\s]+@(.*)`, 'i');
    var re_match = cmd_args.match(vote_re);
    if (!re_match) return;

    var server = bot.client.servers['0'];
    var voteType = re_match[1];

    var user = message.mentions[0];
    if (!user) return;

    // user validation
    // warning: assume bot is in one server only
    if (user.username == message.author.username) {
      bot.client.reply(message, ' you can\'t start a vote against yourself, silly.');
      return;
    }
    if (!user) {
      return;
    }

    // roles validation
    var userRoles = getUserRoles(server, user);
    if (setIntersection(userRoles, new Set(bot.settings.voting.immuneRoles)).size > 0) {
      bot.client.sendMessage(message.channel, `I'm afraid I can't do that, ${message.author.mention()}...`);
      return;
    }

    processVote(voteType, bot, message, server, user);
  }

} 

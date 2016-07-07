var Settings = require('../settings.json');

var immuneRoles = new Set(Settings.voting.immuneRoles);
var voteThreshold = Settings.voting.voteThreshold;

var botcmd = '!bot';
var votecmd = 'vote';

var voteTypes = {
  'kick' : handleKick,
  'mute' : handleMute
};

function handleKick(bot, user, server) {
  bot.kickMember(user, server, function(err) {
    if (err) console.log(err);
  });
}

function handleMute(bot, user, server) {
  bot.muteMember(user, server, function(err) {
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
      bot.sendMessage(message.channel, `Vote to ${type} ${user.mention()} has timed out. Whew!`);
      delete currentVotes[type][user.username];
    };
    var timeoutObj = setTimeout(timeoutClj, Settings.voting.timeout_in_minutes * 1000 * 60);

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
  if (voting.votes.length >= voteThreshold) {
    clearTimeout(voting.timeout);
    bot.sendMessage(message.channel, `Sorry, ${user.mention()}, but their wish is my command!`);
    voteTypes[type](bot, user, server);
    delete currentVotes[type][user.username]
  } else {
    bot.sendMessage(message.channel, `[${voting.votes.length}/${voteThreshold}] votes to ${type} ${user.mention()}!`);
  }
}

function handleVote(bot, message) {
  if (bot.user.username == message.author.username) return;

  // command validation
  var vote_re = new RegExp(`^${botcmd} ${votecmd} (${Object.keys(voteTypes).join('|')}) @(.*)`, 'i');
  var re_match = message.cleanContent.match(vote_re);
  if (!re_match) return;

  var server = bot.servers['0'];
  var voteType = re_match[1];

  var user = message.mentions[0];
  if (!user) return;

  // user validation
  // warning: assume bot is in one server only
  if (user.username == message.author.username) {
    bot.reply(message, ' you can\'t start a vote against yourself, silly.');
    return;
  }
  if (!user) {
    return;
  }

  // roles validation
  var userRoles = getUserRoles(server, user);
  if (setIntersection(userRoles, immuneRoles).size > 0) {
    bot.sendMessage(message.channel, `I'm afraid I can't do that, ${message.author.mention()}...`);
    return;
  }

  processVote(voteType, bot, message, server, user);
}

module.exports = {
  handleVote: handleVote
};

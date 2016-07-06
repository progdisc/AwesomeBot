/*
  This module is meant to handle the command '!bot streams #channel'

  Notes:
  - streamCommands is an array with the valid stream commands
    for the keys in channels.js:

    e.g ['!bot stream python', '!bot streams php'...]
    e.g [`!bot create stream [user] [topic]`]

  How it works:
  - joinMeStreams is an object with the following schema:

    joinMeStreams: {
      [channel] : {
               [user]: { link, description, channel } ,
               [user]: { link, description, channel } ,
                    .
                    .
                    .
        }
      }
    - joinMeStreams is an in-memory-object of sorts to keep track of streams.
*/

var botcmd = '!bot';
var streamcmd = 'stream';

//!bot new stream [topic]
var createStreamChannel = `${botcmd} create ${streamcmd}`;

//!bot remove stream [topic] [user]
var removeStream = `${botcmd} remove ${streamcmd}`;

//!bot list streams
var listStreams = `${botcmd} list streams`;

//in memory object containing join.me streams
var joinMeStreams = {};

function handleJoinMeCommands(bot, message) {
  if (_isCommandInMessage(message, removeStream)) {
    _handleDelete(bot, message);
  } else if (_isCommandInMessage(message, createStreamChannel)) {
    _handleCreateStreamChannel(bot, message);
  } else if (_isCommandInMessage(message, listStreams)) {
    _listStreams(bot, message);
  }
}

function _isCommandInMessage(message, command) {
  var messageString = message.content.trim().toLowerCase();
  return (messageString.indexOf(command) == 0) ? true : false;
}

function _handleDelete(bot, message) {
  var user = message.content.trim().split(' ')[3];

  var topics = Object.keys(joinMeStreams);

  topics.forEach(topic => {
    if (joinMeStreams[topic][user]) {

      var channelToDelete = joinMeStreams[topic][user].channel;

      if (Object.keys(joinMeStreams[topic]).length == 1) {
        delete joinMeStreams[topics];
      } else {
        delete joinMeStreams[topics][user];
      }

      bot.deleteChannel(channelToDelete, (err) => {
        if (err) return bot.sendMessage(message.channel,
        'Sorry, could not delete channel');
      });

      return bot.sendMessage(message.channel,
      `Removed ${user} from active streamers list and deleted ${channelToDelete.name}`);
    }
  });

  return bot.reply(message, 'No stream to delete');
}

function _handleCreateStreamChannel(bot, message) {
  var messageString = message.content.toLowerCase().trim();

  var topic = messageString.split(' ')[3];
  var link = messageString.split(' ')[4];
  var user = messageString.split(' ')[5];

  if (!topic) {
    return bot.reply(message, 'Please provide a topic');
  }

  if (!link) {
    return bot.reply(message, 'Please provide a link');
  }

  if (link.indexOf('http') == -1 || link.indexOf('https://') == -1) {
    return bot.reply(message,
      'A valid http/https link must be supplied as 2nd arg `!bot create stream [topic] [link] [optional_user]`');
  }

  var channelFormat = `${message.author.username}_${topic}`;
  if (user) {
    var userId = user.substr(2, 19);
    var otherUser = bot.client.users.get('id', userId);
    channelFormat = `${otherUser.author.username}_${topic}`;
  } else {
    user = message.author.mention();
  }

  var defaultDescription =
    `${message.author.mention()} is streaming about ${topic}`;

  _putStreamInObject(topic, user, link, defaultDescription);

  var channelExists =
    typeof bot.channels.get('name', channelFormat) != 'undefined';

  if (channelExists) {
    joinMeStreams[topic][user].channel = bot.channels.get('name', channelFormat);
    return bot.sendMessage(message.channel, `Channel already exists.. but updated stream link`);
  } else {
    bot.createChannel(message.server, channelFormat, (err, channel) => {
        if (err) return bot.reply(message, 'Could not create the channel, sorry');

        user = message.author.mention();

        joinMeStreams[topic][user].channel = channel;

        return bot.sendMessage(message.channel, `Created ${channel.mention()}!`);
      });
  }
}

function _listStreams(bot, message) {
  var buildMessage = 'Available streams: \n';

  var topics = Object.keys(joinMeStreams);

  if (topics.length == 0) {
    return bot.sendMessage(message.channel,
    'No streams! :(');
  }

  topics.forEach((topic, index) => {
    var streams = Object.keys(joinMeStreams[topic]);

    buildMessage += ` - ${topic}:` + '\n';

    streams.forEach((stream, index) => {

      var link = joinMeStreams[topic][stream].link;
      var description = joinMeStreams[topic][stream].description;

      buildMessage += `${index + 1}. ${link} - ${description}`
      + '\n';
    });
  });

  return bot.sendMessage(message.channel, buildMessage);
}

function _putStreamInObject(topic, user, link, description) {
  if (!joinMeStreams[topic]) {
    joinMeStreams[topic] = {};
  }

  joinMeStreams[topic][user] = {
    link: '',
    description: '',
    channel: '',
  };

  joinMeStreams[topic][user].link = link;
  joinMeStreams[topic][user].description = description;
}

module.exports = {
  handleJoinMeCommands: handleJoinMeCommands,
};

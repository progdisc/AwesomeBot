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

//!bot scrap stream [user]
var removeStream = `${botcmd} scrap ${streamcmd}`;

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
  var topic = message.content.trim().toLowerCase().split(' ')[3];
  var user = message.content.trim().toLowerCase().split(' ')[4];
  var links = joinMeStreams[topic];

  if (!links) {
    return bot.reply(message,
      'No streams for this topic! Nothing to remove!');
  }

  if (joinMeStreams[topic][user]) {
    var channelToDelete = joinMeStreams[topic][user].channel;

    if (Object.keys(joinMeStreams[topic]).length == 1) {
      //If there is only 1 stream in the topic, delete the topic
      delete joinMeStreams[topic];
    } else {
      delete joinMeStreams[topic][user];
    }

    //delete the channel

    bot.deleteChannel(channelToDelete, (err) => {
      if (err) return bot.sendMessage(message.channel,
        'Sorry, could not delete channel');
    });

    return bot.sendMessage(message.channel,
      `Removed ${user} from active streamers list and deleted ${channelToDelete.name}`);
  }

  return bot.sendMessage(topic, `No stream to delete.`);
}

function _handleCreateStreamChannel(bot, message) {
  var messageString = message.content.toLowerCase().trim();

  var topic = messageString.split(' ')[3];
  var link = messageString.split(' ')[4];

  if (link.indexOf('http') == -1 || link.indexOf('https://') == -1) {
    return bot.reply(message,
      'A valid link must be supplied `!bot new stream [topic] [link] [optional_description]`');
  }

  var descriptionStartsFrom = messageString.indexOf(messageString.split(' ')[5]);
  var descriptionEndsTo = messageString.length;

  var description = messageString.substring(descriptionStartsFrom, descriptionEndsTo);

  if (!topic) {
    return bot.reply(message, 'Please provide a topic');
  }

  if (!link) {
    return bot.reply(message, 'Please provide a link');
  }

  var channelFormat = `${message.author.username}_${topic}`;

  var defaultDescription =
    `${message.author.mention()} is streaming about ${topic}`;

  var doesChannelExist = bot.channels.get('name', channelFormat);

  //create the channel
  bot.createChannel(message.server, channelFormat, (err, channel) => {
    if (err) return bot.reply(message, 'Could not create the channel, sorry');

    //add it to the streams object
    var user = message.author.mention();

    if (!joinMeStreams[topic]) {
      joinMeStreams[topic] = {};
    }

    joinMeStreams[topic][user] = {
      link: '',
      description: '',
      channel: '',
    };

    joinMeStreams[topic][user].link = link;
    joinMeStreams[topic][user].channel = channel;

    if (description) {
      joinMeStreams[topic][user].description = description;
    } else {
      joinMeStreams[topic][user].description = defaultDescription;
    }

    return bot.sendMessage(message.channel, `Created ${channel.mention()}!`);
  });
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

module.exports = {
  handleJoinMeCommands: handleJoinMeCommands,
};

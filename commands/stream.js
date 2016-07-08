var Settings = require('../settings');

/*
  This module is meant to handle the command '!bot streams #channel'

  Notes:
  - streamCommands is an array with the valid stream commands for the keys in channels.js:
    e.g ['!bot streams python', '!bot streams php'...]
    e.g ['!bot streams remove [channel] [user]']

  How it works:
  - joinMeStreams is an object with the following schema:

    joinMeStreams: {
      [channel] : {
               [user]: link ,
               [user]: link ,
                    .
                    .
                    .
        }
      }
    - joinMeStreams is an in-memory-object of sorts to keep track of streams.
*/

var streamcmd = 'stream';
var bot_cmd = Settings.bot_cmd;

//!bot stream create [topic] [link]
var createStreamChannel = `${bot_cmd} ${streamcmd} create`;

//!bot stream remove [user]
var removeStream = `${bot_cmd} ${streamcmd} remove`;

//!bot stream list
var listStreams = `${bot_cmd} ${streamcmd} list`;

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

}

function _handleCreateStreamChannel(bot, message) {
  var messageString = message.content.toLowerCase().trim();

  var topic = messageString.split(' ')[3];
  var link = messageString.split(' ')[4];
  var user = messageString.split(' ')[5];

  if (!topic || !link) {
    return bot.reply(message, 'Err, please provide link and topic `!bot stream create [topic] [link]`');
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

  var channelExists = bot.channels.get('name', channelFormat);

  if (channelExists) {
    joinMeStreams[topic][user].channel = bot.channels.get('name', channelFormat);
    joinMeStreams[topic][user].link = link;
    bot.setChannelTopic(channel, link, (err) => {
      if (err) {
        return bot.reply(message,
          'There was an error setting the existings channel topic!');
      }
    });
    return bot.sendMessage(message.channel, `Channel already exists.. but updated stream link`);
  } else {
    return _createChannel(channelFormat, bot, message, topic, user)

          .then((createdChannel) => _setTopicToLink(createdChannel,
            link, bot, topic, user))

          .then((channelWithTopic) => {
            return bot.reply(message.channel, `Created ${channelWithTopic.mention()}!`);
          })

          .catch((errMessage) => {
            return bot.reply(message.channel, `Sorry, could not create channel`);
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

function _createChannel(title, bot, message, topic, user) {
  return new Promise((resolve, reject) => {
    bot.createChannel(message.server, title, (err, channel) => {
        if (err) reject(new Error('An error occured in creating a channel'));
        joinMeStreams[topic][user].channel = channel;
        resolve(channel);
      });
  });
};

function _setTopicToLink(channel, link, bot, topic, user) {
  return new Promise((resolve, reject) => {
    bot.setChannelTopic(channel, link, (err) => {
      if (err) reject(new Error('An error occured in setting a topic to the channel'));
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
};

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

function handleStreams(bot, message, cmd_args) {
  handleJoinMeCommands(bot, message);
}

module.exports = {
  handleStreams: handleStreams,
};

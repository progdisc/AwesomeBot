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

function handleJoinMeCommands(bot, message, cmd_args) {
  var cmd = cmd_args.split(' ')[0];

  switch (cmd) {
    case 'create': {
      _handleCreateStreamChannel(bot, message, cmd_args);
      break;
    }

    case 'remove': {
      _handleRemove(bot, message, cmd_args);
      break;
    }

    case 'list': {
      _listStreams(bot, message);
      break;
    }
  }
}

function _handleRemove(bot, message, args) {
  var mentionString = args.split(' ')[1];

  var extractNameFromMention = mentionString.substr(1,
    mentionString.indexOf('#') - 1);

  var user = bot.users.get('name', extractNameFromMention).mention();

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
    } else {
      return bot.sendMessage(message.channel, `Could not find ${user}`);
    }
  });

}

function _handleCreateStreamChannel(bot, message, args) {
  var topic = args.split(' ')[1];
  var link = args.split(' ')[2];
  var user = args.split(' ')[3];

  if (!topic || !link) {
    return bot.reply(message, 'Err, please provide link and topic `!bot stream create [topic] [link] [optional_user]`');
  }

  if (link.indexOf('http') == -1 && link.indexOf('https://') == -1) {
    return bot.reply(message,
      'A valid http/https link must be supplied as 2nd arg `!bot stream create [topic] [link] [optional_user]`');
  }

  var channelFormat = `${message.author.username}_${topic}`;

  if (user) {
    //Creating a channel for someone else
    var indexOfhash = user.indexOf('#');
    var otherUsername = user.substr(1, indexOfhash - 1).trim();
    var otherUser = bot.users.get('name', otherUsername);
    channelFormat = `${otherUser.username}_${topic}`;
    user = otherUser.mention();
  } else {
    //Creating a channel for you
    user = message.author.mention();
  }

  var defaultDescription =
    `${message.author.mention()} is streaming about ${topic}`;

  _putStreamInObject(topic, user, link, defaultDescription);

  var existingChannel = bot.channels.get('name', channelFormat);

  if (existingChannel) {
    joinMeStreams[topic][user].channel = existingChannel;
    joinMeStreams[topic][user].link = link;
    bot.setChannelTopic(existingChannel, link, (err) => {
      if (err) {
        console.error(err);
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
    link: link,
    description: description,
    channel: '',
  };

  console.log(`Key: ${topic}, User Key: ${user}`);
}

function handleStreams(bot, message, cmd_args) {
  handleJoinMeCommands(bot, message, cmd_args);
}

module.exports = {
  handleStreams: handleStreams,
};

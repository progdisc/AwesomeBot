var Settings = require('../../settings');

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

//in memory object containing join.me stream
var joinMeStreams = {};

function _isAdminOrMod(server, user) {
  var immuneRoles = new Set(Settings.voting.immuneRoles);
  var userRoles = new Set(server.rolesOfUser(user.id).map(r => r.name));
  var setIntersection = [...userRoles].filter(r => immuneRoles.has(r));
  return setIntersection.length > 0;
}

function handleJoinMeCommands(bot, message, cmd_args) {
  var cmd = cmd_args.split(' ')[0];

  switch (cmd) {
    case 'create':
      _handleCreateStreamChannel(bot, message, cmd_args);
      break;

  case 'remove':
    _handleRemove(bot, message, cmd_args);
    break;

case 'list':
  _listStreams(bot, message, cmd_args);
  break;

    case 'removeall':
      if (_isAdminOrMod(bot.client.servers['0'], message.author)) {
        autoRemove(bot);
      } else {
        return bot.client.reply(message, 'Only Admins or Mods can delete all stream channels');
      }
      break;
  }
}

function _handleRemove(bot, message, args) {
  var user = message.mentions[0];

  var topics = Object.keys(joinMeStreams);

  topics.forEach(topic => {
    if (joinMeStreams[topic][user]) {

      var channelToDelete = joinMeStreams[topic][user].channel;

      _deleteStreamInObject(topic, user);

      bot.client.deleteChannel(channelToDelete, (err) => {
        if (err) return bot.client.sendMessage(message.channel,
                                        'Sorry, could not delete channel');
      });

      return bot.client.sendMessage(message.channel,
                             `Removed ${user} from active streamers list and deleted #${channelToDelete.name}`);
    } else {
      // user has no stream in this topic
      //return bot.client.sendMessage(message.channel, `Could not find ${user}`);
    }
  });
}

function _handleCreateStreamChannel(bot, message, args) {
  var [, topic, link, user] = args.split(' ');

  if (!topic || !link) {
    return bot.client.reply(message, 'err, please provide topic and link!');
  }

  if (link.indexOf('http://') == -1 && link.indexOf('https://') == -1) {
    return bot.client.reply(message, 'a valid link must be supplied (starting with http/https)!');
  }

  var user = message.mentions[0];
  if (user) {
    //Creating a channel for someone else
    //The keys in the topics object are username mention id
  } else {
    //Creating a channel for you
    //The keys in the topics object are username mention id
    user = message.author;
  }
  channelFormat = `stream_${user.username}_${topic}`;
  user = user.mention();

  var defaultDescription =
    `${user} is streaming about ${topic}`;

    _putStreamInObject(topic, user, link, defaultDescription);

    var existingChannel = bot.client.channels.get('name', channelFormat);

    if (existingChannel) {
      joinMeStreams[topic][user].channel = existingChannel;
      joinMeStreams[topic][user].link = link;

      bot.client.setChannelTopic(existingChannel, link, (err) => {
        if (err) {
          console.error(err);
          return bot.client.reply(message,
                           'There was an error setting the existings channel topic!');
        }
      });

      return bot.client.sendMessage(message.channel, `Channel already exists.. Updated stream link!`);
    } else {
      return _createChannel(channelFormat, bot, message, topic, user)
      .then((createdChannel) => _setTopicToLink(createdChannel, link, bot, topic, user))
      .then((channelWithTopic) => {
        return bot.client.reply(message.channel, `Created ${channelWithTopic.mention()}!`);
      })
      .catch((errMessage) => {
        return bot.client.reply(message.channel, `Sorry, could not create channel`);
      });
    }
}

function autoRemove(bot) {
  var channels = bot.client.servers[0].channels;

  Object.keys(channels).forEach(key => {
    if (channels[key] && channels[key].name != undefined)
      if (channels[key].name.startsWith('stream')) {
        var channelName = channels[key].name;
        bot.client.deleteChannel(channels[key], (err) => {
          if (err) return console.log(err);
          //console.log(`Removed ${channelName}`);
        });
      }
  });

  if (Object.keys(joinMeStreams).length > 0) {
    Object.keys(joinMeStreams).forEach(topic => delete joinMeStreams[topic]);
  }
}

function _listStreams(bot, message, cmd_args) {
  var buildMessage = 'Available streams: \n';

  var topics = Object.keys(joinMeStreams);

  if (topics.length == 0) {
    return bot.client.sendMessage(message.channel, 'No streams! :frowning:');
  }

  topics.forEach((topic, index) => {
    var streams = Object.keys(joinMeStreams[topic]);

    buildMessage += `**\n${topic}**\n`;

    streams.forEach((stream, index) => {

      var link = joinMeStreams[topic][stream].link;
      var description = joinMeStreams[topic][stream].description;

      buildMessage += `   ${index + 1}. ${link} - ${description}\n`;
    });
  });

  return bot.client.sendMessage(message.channel, buildMessage);
}

function _createChannel(title, bot, message, topic, user) {
  return new Promise((resolve, reject) => {
    bot.client.createChannel(message.server, title, (err, channel) => {
      if (err) reject(new Error('An error occured in creating a channel'));
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
};

function _setTopicToLink(channel, link, bot, topic, user) {
  return new Promise((resolve, reject) => {
    bot.client.setChannelTopic(channel, link, (err) => {
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

  //console.log(`Put in Object: Key: ${topic}, User Key: ${user}`);
}

function _deleteStreamInObject(topic, user) {
  if (Object.keys(joinMeStreams[topic]).length == 1) {
    delete joinMeStreams[topic];
  } else {
    delete joinMeStreams[topic][user];
  }
}

function init(bot) {
  console.log('Removing all stream channels..');
  autoRemove(bot);
}

module.exports = {
  usage: [
    'stream create <topic> <link> [@user] - creates stream about <topic> [by @user]',
    'stream list <topic> - displays streamings about <topic>',
    'stream remove <@user> - removes a streaming by <@user>',
    'stream removeall - removes every streaming (Mods only)',
  ],

  run: handleJoinMeCommands,

  init: init
};



let Settings;

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

// in memory object containing join.me stream
const joinMeStreams = {};

function isAdminOrMod(server, user) {
  const immuneRoles = new Set(Settings.voting.immuneRoles);
  const userRoles = new Set(server.rolesOfUser(user.id).map(r => r.name));
  const setIntersection = [...userRoles].filter(r => immuneRoles.has(r));
  return setIntersection.length > 0;
}

function putStreamInObject(topic, user, link, description) {
  if (!joinMeStreams[topic]) {
    joinMeStreams[topic] = {};
  }

  joinMeStreams[topic][user] = { link, description, channel: '' };

  // console.log(`Put in Object: Key: ${topic}, User Key: ${user}`);
}

function createChannel(title, bot, message, topic, user) {
  return new Promise((resolve, reject) => {
    bot.client.createChannel(message.server, title, (err, channel) => {
      if (err) reject(new Error('An error occured in creating a channel'));
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
}

function setTopicToLink(channel, link, bot, topic, user) {
  return new Promise((resolve, reject) => {
    bot.client.setChannelTopic(channel, link, (err) => {
      if (err) reject(new Error('An error occured in setting a topic to the channel'));
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
}

function handleCreateStreamChannel(bot, message, args) {
  let [, topic, link, user] = args.split(' '); // eslint-disable-line prefer-const

  if (!topic || !link) {
    return bot.client.reply(message, 'err, please provide topic and link!');
  }

  if (link.indexOf('http://') === -1 && link.indexOf('https://') === -1) {
    return bot.client.reply(message, 'a valid link must be supplied (starting with http/https)!');
  }

  user = message.mentions[0];
  if (user) {
    // Creating a channel for someone else
    // The keys in the topics object are username mention id
  } else {
    // Creating a channel for you
    // The keys in the topics object are username mention id
    user = message.author;
  }
  const channelFormat = `stream_${user.username}_${topic}`;
  user = user.mention();

  const defaultDescription =
    `${user} is streaming about ${topic}`;

  putStreamInObject(topic, user, link, defaultDescription);

  const existingChannel = bot.client.channels.get('name', channelFormat);

  if (existingChannel) {
    joinMeStreams[topic][user].channel = existingChannel;
    joinMeStreams[topic][user].link = link;

    bot.client.setChannelTopic(existingChannel, link, (err) => {
      if (err) {
        console.error(err);
        bot.client.reply(message,
          'There was an error setting the existings channel topic!');
      }
    });

    return bot.client.sendMessage(message.channel, 'Channel already exists.. Updated stream link!');
  }
  return createChannel(channelFormat, bot, message, topic, user)
    .then((createdChannel) => setTopicToLink(createdChannel, link, bot, topic, user))
    .then((channelWithTopic) =>
      bot.client.reply(message.channel, `Created ${channelWithTopic.mention()}!`))
    .catch((errMessage) => {
      bot.client.reply(message.channel, `Sorry, could not create channel (${errMessage})`);
    });
}

function deleteStreamInObject(topic, user) {
  if (Object.keys(joinMeStreams[topic]).length === 1) {
    delete joinMeStreams[topic];
  } else {
    delete joinMeStreams[topic][user];
  }
}

function handleRemove(bot, message) {
  const user = message.mentions[0];

  const topics = Object.keys(joinMeStreams);

  topics.forEach(topic => {
    if (joinMeStreams[topic][user]) {
      const channelToDelete = joinMeStreams[topic][user].channel;

      deleteStreamInObject(topic, user);

      bot.client.deleteChannel(channelToDelete, (err) => {
        if (err) bot.client.sendMessage(message.channel, 'Sorry, could not delete channel');
      });

      bot.client.sendMessage(message.channel,
        `Removed ${user} from active streamers list and deleted #${channelToDelete.name}`);
    } else {
      // user has no stream in this topic
      // return bot.client.sendMessage(message.channel, `Could not find ${user}`);
    }
  });
}

function listStreams(bot, message) {
  let buildMessage = 'Available streams: \n';

  const topics = Object.keys(joinMeStreams);

  if (topics.length === 0) {
    return bot.client.sendMessage(message.channel, 'No streams! :frowning:');
  }

  topics.forEach(topic => {
    const streams = Object.keys(joinMeStreams[topic]);

    buildMessage += `**\n${topic}**\n`;

    streams.forEach((stream, index) => {
      const link = joinMeStreams[topic][stream].link;
      const description = joinMeStreams[topic][stream].description;

      buildMessage += `   ${index + 1}. ${link} - ${description}\n`;
    });
  });

  return bot.client.sendMessage(message.channel, buildMessage);
}

function autoRemove(bot) {
  const channels = bot.client.servers[0].channels;

  Object.keys(channels).forEach(key => {
    if (channels[key] && channels[key].name !== undefined) {
      if (channels[key].name.startsWith('stream')) {
        // const channelName = channels[key].name;
        bot.client.deleteChannel(channels[key], (err) => {
          if (err) console.log(err);
          // console.log(`Removed ${channelName}`);
        });
      }
    }
  });
  if (Object.keys(joinMeStreams).length > 0) {
    Object.keys(joinMeStreams).forEach(topic => delete joinMeStreams[topic]);
  }
}


function handleJoinMeCommands(bot, message, cmdArgs) {
  const cmd = cmdArgs.split(' ')[0];

  switch (cmd) {
    case 'create':
      handleCreateStreamChannel(bot, message, cmdArgs);
      break;

    case 'remove':
      handleRemove(bot, message, cmdArgs);
      break;

    case 'list':
      listStreams(bot, message, cmdArgs);
      break;

    case 'removeall':
      if (isAdminOrMod(bot.client.servers['0'], message.author)) {
        autoRemove(bot);
      } else {
        bot.client.reply(message, 'Only Admins or Mods can delete all stream channels');
      }
      break;

    default:
      break;
  }
}

module.exports = {
  usage: [
    'stream create <topic> <link> [@user] - creates stream about <topic> [by @user]',
    'stream list <topic> - displays streamings about <topic>',
    'stream remove <@user> - removes a streaming by <@user>',
    'stream removeall - removes every streaming (Mods only)',
  ],

  run: handleJoinMeCommands,

  init: (bot) => {
    Settings = bot.settings;
    console.log('Removing all stream channels..');
    autoRemove(bot);
  },
};


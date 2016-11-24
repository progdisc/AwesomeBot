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

function isAdminOrMod(member) {
  const immuneRoles = new Set(Settings.voting.immuneRoles);
  const userRoles = new Set(member.roles.array().map(r => r.name));
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
    message.guild.createChannel(title, 'text').then(channel => {
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
}

function setTopicToLink(channel, link, bot, topic, user) {
  return new Promise((resolve, reject) => {
    channel.setTopic(link).then(() => {
      joinMeStreams[topic][user].channel = channel;
      resolve(channel);
    });
  });
}

function handleCreateStreamChannel(bot, message, args) {
  let [, topic, link, user] = args.split(' '); // eslint-disable-line prefer-const

  if (!topic || !link) {
    return message.channel.sendMessage('err, please provide topic and link!');
  }

  if (link.indexOf('http://') === -1 && link.indexOf('https://') === -1) {
    return message.channel.sendMessage('a valid link must be supplied (starting with http/https)!');
  }

  user = message.mentions.users.first();
  if (user) {
    // Creating a channel for someone else
    // The keys in the topics object are username mention id
  } else {
    // Creating a channel for you
    // The keys in the topics object are username mention id
    user = message.author;
  }
  const channelFormat = `stream_${user.username}_${topic}`;

  const defaultDescription =
    `${user} is streaming about ${topic}`;

  putStreamInObject(topic, user.id, link, defaultDescription);

  const existingChannel = bot.client.channels.get('name', channelFormat);

  if (existingChannel) {
    joinMeStreams[topic][user.id].channel = existingChannel;
    joinMeStreams[topic][user.id].link = link;

    existingChannel.setTopic(link).catch(err => {
      existingChannel.sendMessage('There was an error setting the existings channel topic!');
    });

    return message.channel.sendMessage('Channel already exists.. Updated stream link!');
  }
  return createChannel(channelFormat, bot, message, topic, user.id)
    .then((createdChannel) => setTopicToLink(createdChannel, link, bot, topic, user.id))
    .then((channelWithTopic) =>
      message.channel.sendMessage(`Created ${channelWithTopic}!`))
    .catch((errMessage) => {
      message.channel.sendMessage(`Sorry, could not create channel (${errMessage})`);
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
  const user = message.mentions.users.first();

  const topics = Object.keys(joinMeStreams);
  const id = user ? user.id : message.author.id;

  if (!isAdminOrMod(message.member) && id != message.author.id) {
    message.channel.sendMessage(`Only admins or mods can remove others' streams.`);
    return;
  }

  topics.forEach(topic => {
    if (joinMeStreams[topic][id]) {
      const channelToDelete = joinMeStreams[topic][id].channel;

      deleteStreamInObject(topic, id);

      channelToDelete.delete().catch(err => {
        message.channel.sendMessage('Sorry, could not delete channel');
      });

      message.channel.sendMessage(
        `Removed ${user||message.author} from active streamers list and deleted #${channelToDelete.name}`);
    } else {
      // user has no stream in this topic
      // return message.channel.sendMessage(`Could not find ${user}`);
    }
  });
}

function listStreams(bot, message) {
  let buildMessage = 'Available streams: \n';

  const topics = Object.keys(joinMeStreams);

  if (topics.length === 0) {
    return message.channel.sendMessage('No streams! :frowning:');
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

  return message.channel.sendMessage(buildMessage);
}

function autoRemove(bot) {
  const channels = bot.client.guilds.first().channels;

  channels.forEach(channel => {
    if (channel && channel.name !== undefined) {
      if (channel.name.startsWith('stream')) {
        // const channelName = channels[key].name;
        channel.delete().then(() => {
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
      if (isAdminOrMod(message.member)) {
        autoRemove(bot);
      } else {
        message.channel.sendMessage('Only Admins or Mods can delete all stream channels');
      }
      break;

    default:
      return true;
      break; // I mean, it just pains me not to see it
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


var Settings = require('../settings');
var channels = require('../channels');

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

var streamcmd = 'streams';

//!bot streams [channel]
var streamCommands = Object.keys(channels).map(k => `${Settings.bot_cmd} ${streamcmd} ${k}`);

//!bot streams remove [channel] [user]
var removeStream = `${Settings.bot_cmd} ${streamcmd} remove`;

//in memory object containing join.me streams
var joinMeStreams = {};

/**
 * Checks if the message contains a join.me one-time link.
 * If so, it adds to joinMeStreams.
 * If the user in the channel posts another stream, it updates the stream.
 * in TheAwesomeBot.js, all are passed through here
 * @param bot - the client
 * @param message - message received
 * @returns - void
 */

function checkAndTrackJoinMeLinks(bot, message) {
  //if message contains a join me link
  if (message.content.indexOf('https://join.me/') == 0) {
    var linkIndex = message.content.indexOf('https://join.me/');
    //assuming it's a one time link, this should work, will not WORK on personal links
    var link = message.content.substr(linkIndex, linkIndex + 27).trim().toLowerCase();
    var channel = message.channel.name;
    var response = `${message.author.mention()} is streaming from ${channel} at ${link}`;

    if (!joinMeStreams[channel]) {
      joinMeStreams[channel] = {};
    }
    joinMeStreams[channel][message.author.mention()] = response;
  }
}

/**
 * Handles client response on '!bot streams [channel]'
 * Handles client response on '!bot streams remove [channel] [user]'
 *
 * @param bot - bot client
 * @param message - message received
 * @returns - bot.reply, sends a reply to the client.
 */

function handleJoinMeCommands(bot, message) {
  if (message.content.trim().toLowerCase().indexOf(removeStream) == 0) {
    _handleDelete(bot, message);
  }

  streamCommands.forEach((command) => {
    if (message.content.trim().toLowerCase() == command.trim().toLowerCase()) {
      var channel = message.content.trim().toLowerCase().split(' ')[2];
      var obj = joinMeStreams[channel];
      var linkMessage = '';
      if (obj) {
        if (Object.keys(obj).length > 0) {
          Object.keys(obj).forEach((user) => {
            linkMessage += joinMeStreams[channel][user] + '\n';
          });
          return bot.sendMessage(message.channel, linkMessage);
        } else {
          return bot.reply(message, 'No streams for this channel.. be the first?');
        }
      } else {
        return bot.reply(message, 'No streams for this channel.. be the first?');
      }
    }
  });
}

function _handleDelete(bot, message) {
  var channel = message.content.trim().toLowerCase().split(' ')[3];
  var user = message.content.trim().toLowerCase().split(' ')[4];

  var links = joinMeStreams[channel];

  if (!links) return bot.reply(message, 'No streams for this channel! Nothing to remove!');

  if (joinMeStreams[channel][user]) {
    delete joinMeStreams[channel][user];
  } else {
    return bot.sendMessage(channel, `No stream to delete.`);
  }

  return bot.sendMessage(bot.channels.get('name', channel), `Removed ${user} from active streamers list`);
}

function handleStreams(bot, message, cmd_args) {
  checkAndTrackJoinMeLinks(bot, message);
  handleJoinMeCommands(bot, cmd_args);
}

module.exports = {
  handleStreams: handleStreams
};

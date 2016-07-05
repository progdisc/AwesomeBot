var helpCommands = require('./helpText');
var channels = require('../channels');

/*
  This module is meant to handle the command '!bot streams #channel'

  Notes:
  - streamCommands is an array with the valid stream commands for the keys in channels.js:
    e.g ['!bot streams python', '!bot streams php'...]

  How it works:
  - joinMeStreams is an object with the following schema:

    joinMeStreams: {
      [channel] : {
        streams: [
          { user: link },
          { user: link },
                .
                .
                .
        ]
      }
    }
    - joinMeStreams is an in-memory-object of sorts to keep track of streams.
*/

var botcmd = '!bot';
var streamcmd = 'streams';

var streamCommands = Object.keys(channels).map(k => `${botcmd} ${streamcmd} ${k}`);

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
  //Don't add join.me links the bot itself posts
  if (bot.user.username == message.author.username) return;

  if (message.content.indexOf('https://join.me/') !== -1) {
    var linkIndex = message.content.indexOf('https://join.me/');
    //assuming it's a one time link, this should work, will not WORK on personal links
    var link = message.content.substr(linkIndex, linkIndex + 27).trim().toLowerCase();

    var channel = message.channel.name;

    var response = `${message.author.mention()} is streaming from ${channel} at ${link}`;

    var linksInObject = Object.keys(joinMeStreams).filter(key => joinMeStreams[key] === response);

    if (linksInObject.length == 0) {
      //add it to the object
      //heres assuming they post the join.me in the right channel

      if (joinMeStreams[channel]) {
        var tempObj = {};
        tempObj[message.author.username] = '\n' + response;

        //Check if an existing user posted another new stream
        var existing = joinMeStreams[channel].filter((objects) => {
          if (objects) {
            if (objects[message.author.username]) {
              return true;
            }
          }

          return false;
        });

        if (existing.length > 0) {
          var existingKey = Object.keys(existing[0])[0];
          joinMeStreams[channel].forEach((objects, index) => {
            var username = Object.keys(objects)[0];
            if (username === existingKey) {
              //Update stream for existing user
              joinMeStreams[channel][index][username] = '\n' + response;
            }
          });
        } else {
          joinMeStreams[channel].push(tempObj);
        }
      } else {
        joinMeStreams[channel] = [];
        var tempObj = {};
        tempObj[message.author.username] = '\n' + response;
        joinMeStreams[channel].push(tempObj);
      }
    }
  }
}

/**
 * Handles client response on '!bot streams [channel]'
 *
 * @param bot - bot client
 * @param message - message received
 * @returns - bot.reply, sends a reply to the client.
 */

function handleJoinMeCommands(bot, message) {
  streamCommands.forEach((command) => {
    if (message.content.trim().toLowerCase() == command.trim().toLowerCase()) {
      var lang = message.content.trim().toLowerCase().split(' ')[2];
      var links = joinMeStreams[lang];
      var linkMessage = '';
      if (links) {
        if (links.length > 0) {
          links.forEach((link) => {
            var userStreaming = Object.keys(link)[0];
            linkMessage += link[userStreaming] + '\n';
          });
          return bot.reply(message, linkMessage);
        }
      } else {
        return bot.reply(message, 'No streams for this channel.. be the first?');
      }
    }
  });
}

module.exports = {
  checkAndTrackJoinMeLinks: checkAndTrackJoinMeLinks,
  handleJoinMeCommands: handleJoinMeCommands,
  streamCommands: streamCommands,
};

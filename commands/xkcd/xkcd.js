const google = require(`google`);
const request = require(`request`);
const cheerio = require(`cheerio`);
let timeLimit = 60;
let config;
let lastMessageTime;

module.exports = {
  usage: 'xkcd <keywords> - finds a xkcd comic with relevant keywords',
  run: (bot, message, cmdArgs) => {
    let xkcdLink = false;

    if ((Math.floor(Date.now() / 1000) - lastMessageTime) >= timeLimit) {

      if (!cmdArgs) {
        return true;
      }

      google(`${cmdArgs} xkcd`, (err, res) => {
        for (let i = 0; i < res.links.length; i++) {
          if (res.links[i].link.includes(`//xkcd.com`)) {
            xkcdLink = res.links[i].link;
            break;
          }
        }
        // we are done with finding a link
        if (!xkcdLink) {
          // link is either empty (this should NOT happen) or we don't have a link
          message.channel.sendMessage(`I'm sorry ${message.author}, i couldn't find a xkcd.`);
        } else {
          request(xkcdLink, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              // we have successfully got a response
              let htmlBody = cheerio.load(body);

              if (htmlBody('#comic').children().get(0).tagName === 'img') {
                // some xkcd comics have comic in a <a> tag because of hd image
                // TODO (samox) : Add support for large comics
                let xkcdImg = htmlBody('#comic').children().first();
                message.channel.sendMessage(`\`\`\`diff\nTitle: ${htmlBody('#ctitle').text()}\nAlt Text: ${xkcdImg.attr('title')}\n\`\`\`\nhttps:${xkcdImg.attr('src')}`);

                if (config.limitMessages) {
                  // we don't want users spamming it
                  lastMessageTime = Math.floor(Date.now() / 1000);
                }
              } else {
                message.channel.sendMessage(`I'm sorry ${message.author}, i couldn't find a xkcd.`);
              }
            }
          });
        }
      });
    } else {
      // message isn't sent because of time limit
    }
  },
  init: (bot) => {
    config = bot.settings.xkcd;
    timeLimit = config.timeLimit || timeLimit;
    lastMessageTime = Math.floor(Date.now() / 1000) - timeLimit;
  },
};

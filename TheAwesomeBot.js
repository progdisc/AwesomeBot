var Discord = require('discord.js');

var bot = new Discord.Client();

var helpCommands = require('./commands/helpText.js');

var interpolate = require('interpolate');

var result = interpolate('{greeting}! I am {name}.', {
  greeting: 'Hello',
  name: 'TheAwesomeBot',
});

console.log(result); // 'Hello! I am TheAwesomeBot.'

bot.on('message', function (message)
{

    switch (message.content)
    {

    case '!bot help':
      {
        bot.reply(message, "Awesome is my name, don't wear it out! Please type '!bot help *channel you need help with*' for more info.");
        break;
      }

    case '!bot help python':
      {
        bot.reply(message, helpCommands.pythonText);
        break;
      }

    case '!bot help java':
      {
        bot.reply(message, helpCommands.javaText);
        break;
      }

    case '!bot help c_cpp':
      {
        bot.reply(message, helpCommands.cppText);
        break;
      }

    case '!bot help style':
      {
        bot.reply(message, "Here is a link to Discord's text styles: https://support.discordapp.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-");
        break;
      }

    case '!bot':
      {
        bot.reply(message, "Awesome is my name, don't wear it out! Please type '!bot help *channel you need help with*' for more info.");
        break;
      }

    case '!bot help javascript':
      {
        bot.reply(message, helpCommands.jsText);
        break;
      }

      case '!bot help dotnet':
      case '!bot help c#':
      {
        bot.reply(message, helpCommands.dnText);
        break;
      }
  }
  });

bot.loginWithToken('MTk4MjQ5NTI1ODU1NTE4NzIx.Cldcvw.xAQgYTI9IN_ACmCTBVydTQiM66k');

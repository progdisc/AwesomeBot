var Discord = require('discord.js');

var bot = new Discord.Client();

var helpCommands = require('./commands/helpText.js');

// var interpolate = require('interpolate');

// var result = interpolate('{greeting}! I am {name}.', {
//   greeting: 'Hello',
//   name: 'TheAwesomeBot',
// });
// console.log(result); // 'Hello! I am TheAwesomeBot.'

// also, in es2015 (node >= 4.x)
// var data = {
//   greeting: 'Hello',
//   name: 'TheAwesomeBot',
// };
// var result = `${data.greeting}! I am ${data.name}.`;
// console.log(result); // 'Hello! I am TheAwesomeBot.'

var botcmd = '!bot',
  helpcmd = 'help';

var basicHelp = "Awesome is my name, don't wear it out! " + 
  "Please type '!bot help *channel you need help with*' for more info.";

var helpObj = {};
helpObj[botcmd + ' ' + helpcmd] = helpObj[botcmd] = basicHelp


var simpleResponses = Object.assign(helpObj,
  Object.keys(helpCommands)
    .map(k => [`${botcmd} ${helpcmd} ${k}`, helpCommands[k]])
    .reduce( (obj, row) => (obj[row[0]] = row[1], obj), {}))

console.log(simpleResponses)



bot.on('message', function (message) {
  var key = message.toLowerCase().trim()
  if (simpleResponses[key]) return bot.reply(message, simpleResponses[key])

});

bot.loginWithToken('MTk4MjQ5NTI1ODU1NTE4NzIx.Cldcvw.xAQgYTI9IN_ACmCTBVydTQiM66k');

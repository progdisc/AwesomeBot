var Discord = require("discord.js");
 
var bot = new Discord.Client();

var interpolate = require('interpolate');

var result = interpolate('{greeting}! I am {name}.', {
  greeting: 'Hello',
  name: 'TheAwesomeBot'
});

var pythonText = "See these links/courses for learning Python: \
https://docs.python.org/2/ \
https://docs.python.org/3/ \
https://www.udacity.com/course/programming-foundations-with-python--ud036 \
http://learnpythonthehardway.org/book/ \
"
var javaText = "See these links/courses for learning Java: \
https://docs.oracle.com/javase/7/docs/api/ \
https://docs.oracle.com/javase/8/docs/api/ \
https://docs.oracle.com/javase/tutorial/ \
"
var cppText = "See these links/courses for learning C++: \
http://www.cplusplus.com/doc/tutorial/ \
"

var javascriptText = "See these links/courses for learning JavaScript: \
https://www.codecademy.com/learn/javascript \
https://www.udacity.com/course/javascript-basics--ud804 \
https://developer.mozilla.org/en-US/docs/Web/JavaScript \
"

 console.log(result); // 'Hello! I am TheAwesomeBot.'

bot.on("message", function(message)
{

    switch(message.content)
    {

      case '!bot help': 
      {
        bot.reply(message, "Awesome is my name, don't wear it out! Please type '!bot help *channel you need help with*' for more info.");  
        break;
      }
	  
	  case '!bot help python': 
      {
        bot.reply(message, pythonText);  
        break;
      }
      
      case '!bot help java': 
      {
        bot.reply(message, javaText);  
        break;
      }
      
      case '!bot help c_cpp': 
      {
        bot.reply(message, cppText);  
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
        bot.reply(message, javascriptText); 
        break;
      }
    }
});
 
bot.loginWithToken("MTk4MjQ5NTI1ODU1NTE4NzIx.Cldcvw.xAQgYTI9IN_ACmCTBVydTQiM66k");
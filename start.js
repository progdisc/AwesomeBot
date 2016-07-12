const Settings = require('./settings.json');
const Bot = require('./TheAwesomeBot.js');

function start() {
  // check for the discord token
  var token = Settings.api_token || process.env.DISCORD_TOKEN;
  if (!token) {
    throw Error('Discord token not set');
  }
  
  (new Bot(token).init());
}

start();


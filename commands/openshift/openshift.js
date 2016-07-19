const http         = require('http'),
      env          = process.env;

module.exports = {
  usage: false,

  init: (bot) => {
    // setup "heartbeat" message
    const heartbeatChannel = bot.settings.openshift.heartbeat_channel || 'bots';
    const heartbeatInterval = (bot.settings.openshift.heartbeat_interval_in_minutes || 30) * 1000 * 60;
    let channel = bot.client.channels.get('name', heartbeatChannel);
    if (!channel) {
      channel = bot.client.createChannel(bot.client.servers[0], heartbeatChannel, (err, channel) => {
        if (err) throw `Couldn't find nor create hearbeat channel "${heartbeatChannel}"`;
      });
    }
    console.log(`Setting up hearbeat messages for #${heartbeatChannel} every ${heartbeatInterval/1000/60} minutes...`);
    setInterval(function () {
      const msg = `I'm still alive! - ${(new Date()).toUTCString()}`;
      bot.client.sendMessage(channel, msg);
      console.log(msg);
    }, heartbeatInterval);

    // launch health check server
    this.server = http.createServer(function (req, res) {
      let url = req.url;
      if (url.match(/^\/(health)?$/i)) {
        res.writeHead(200);
        res.end();
      }
    });

    this.server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
      console.log(`Webserver for health checks launched...`);
    });
  },

  run: (bot, message, cmd_args) => {
    // do nothing
    return;
  }
}


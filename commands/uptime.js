var start_time = Date.now()

var magnitudes = [
  ['days', 1000 * 60 * 60 * 24],
  ['hours', 1000 * 60 * 60],
  ['minutes', 1000 * 60],
  ['seconds', 1000],
]

function getUptime(diff) {
  return magnitudes.map(function(m) {
    if (diff / m[1] > 1) {
      var mdiff = diff / m[1] | 0
      diff -= mdiff * m[1]
      return mdiff + ' ' + m[0]
    }
  }).filter(x => !!x).join(', ')
}

function handleUptime(bot, message, cmd_args) {
  var diff = Date.now() - start_time;
  return bot.reply(message, 'uptime: ' + getUptime(diff));
}

module.exports = {handleUptime, getUptime}

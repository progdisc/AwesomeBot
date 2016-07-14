'use strict'

module.exports = {
  usage: 'uptime - prints my uptime',

  run: (bot, message, cmd_args) => {
    bot.client.reply(message, 'uptime: ' + getUptime(Date.now() - start_time))
  }
}

const start_time = Date.now()

const magnitudes = [
  ['days', 1000 * 60 * 60 * 24],
  ['hours', 1000 * 60 * 60],
  ['minutes', 1000 * 60],
  ['seconds', 1000],
]

const LABEL = 0
const VALUE = 1

const getUptime = diff =>
magnitudes.map(function(m) {
  if (diff / m[VALUE] > 1) {
    let mdiff = diff / m[VALUE] | 0
    diff -= mdiff * m[VALUE]
    return mdiff + ' ' + m[LABEL]
  }
}).filter(x => !!x).join(', ')


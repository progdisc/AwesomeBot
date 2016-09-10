const startTime = new Date();

const getUptime = () => {
  const now = new Date();
  let diff = Math.abs(now - startTime);

  const h = Math.floor(diff / 1000 / 60 / 60);
  diff -= h * 1000 * 60 * 60;

  const m = Math.floor(diff / 1000 / 60);
  diff -= m * 1000 * 60;

  const s = Math.floor(diff / 1000);
  diff -= s * 1000;

  const ms = diff;

  let output = '';
  if (h > 0) output += `${h} hours, `;
  if (m > 0) output += `${m} minutes, `;
  if (s > 0) output += `${s} seconds, `;
  output += `${ms} milliseconds`;

  return output;
};

module.exports = {
  usage: 'uptime - prints my uptime',

  run: (bot, message) => {
    message.channel.sendMessage(`uptime: ${getUptime()}`);
  },
};


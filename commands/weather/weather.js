const request = require('request');
const discord = require('discord.js');

let weatherConfig;
const geocodeEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json?key=gkey&address=input';
const darkskyEndpoint = 'https://api.darksky.net/forecast/key/lat,lng';

function fahrenheitToCelcius(degree) {
  return ((degree - 32) * 5 / 9).toFixed(0);
}

module.exports = {
  usage: 'weather <adress> - brings current weather info for given address',

  init: (bot) => {
    weatherConfig = bot.settings.weather;
  },

  run: (bot, message, cmdArgs) => {
    if (!cmdArgs) return true;

    // get geocode info
    let request_url = geocodeEndpoint
                            .replace('gkey', weatherConfig.geocode_api_key)
                            .replace('input', cmdArgs);
    // do percentage encoding
    request_url = encodeURI(request_url);

    request(request_url, (err, res, bod) => {
      if (err) {
        message.reply('There was a problem with geocoding request.');
        return;
      }

      let geocode_data = JSON.parse(bod);

      if (geocode_data.status !== 'OK') {
        message.reply(`I'm sorry ${message.author}, your address couldn't be detected.`);
        return;
      }

      let address = geocode_data.results[0].formatted_address;
      let coordinate = geocode_data.results[0].geometry.location;
      //get weather data
      request_url = darkskyEndpoint
                          .replace('key', weatherConfig.darksky_api_key)
                          .replace('lat', coordinate.lat)
                          .replace('lng', coordinate.lng);

      request(request_url, (error, response, body) => {
        let weather_data = JSON.parse(body);

        let offset = weather_data.offset;
        let utc_time = weather_data.currently.time;
        let local_time = new Date(utc_time * 1000);
        local_time.setHours(local_time.getHours() + offset);
        let date_string = local_time.toGMTString().slice(0, -4);
        let temperature_f = weather_data.currently.temperature.toFixed(0);
        let temperature_c = fahrenheitToCelcius(temperature_f);
        let summary = weather_data.currently.summary;

        let embed = new discord.RichEmbed();
        embed.setColor('#4286f4')
             .setFooter(`Local Time: ${date_string}`)
             .setTitle(`Weather in ${address}`)
             .addField('Summary', summary)
             .addField('Temperature °C', `${temperature_c} °C`, true)
             .addField('Temperature °F', `${temperature_f} °F`, true);

        message.channel.sendEmbed(embed);
      });
    });
  },
};

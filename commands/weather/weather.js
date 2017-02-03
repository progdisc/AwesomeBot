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
    let requestURL = geocodeEndpoint
                            .replace('gkey', weatherConfig.geocode_api_key)
                            .replace('input', cmdArgs);
    // do percentage encoding
    requestURL = encodeURI(requestURL);

    request(requestURL, (err, res, bod) => {
      if (err) {
        message.reply('There was a problem with geocoding request.');
        return;
      }

      let geocodeData = JSON.parse(bod);

      if (geocodeData.status !== 'OK') {
        message.reply(`I'm sorry ${message.author}, your address couldn't be detected.`);
        return;
      }

      let address = geocodeData.results[0].formatted_address;
      let coordinate = geocodeData.results[0].geometry.location;
      //get weather data
      requestURL = darkskyEndpoint
                          .replace('key', weatherConfig.darksky_api_key)
                          .replace('lat', coordinate.lat)
                          .replace('lng', coordinate.lng);

      request(requestURL, (error, response, body) => {
        let weatherData = JSON.parse(body);

        let offset = weatherData.offset;
        let utcTime = weatherData.currently.time;
        // datetime is weird in javascript, please do change this part if you can
        let localTime = new Date(utcTime * 1000);
        localTime.setHours(localTime.getHours() + offset);
        // toGMTString prints out timezone of host so we slice it off
        let dateString = localTime.toGMTString().slice(0, -4);
        let temperatureF = weatherData.currently.temperature.toFixed(0);
        let temperatureC = fahrenheitToCelcius(temperatureF);
        let summary = weatherData.currently.summary;

        let embed = new discord.RichEmbed();
        embed.setColor('#4286f4')
             .setFooter(`Local Time: ${dateString}`)
             .setTitle(`Weather in ${address}`)
             .addField('Summary', summary)
             .addField('Temperature °C', `${temperatureC} °C`, true)
             .addField('Temperature °F', `${temperatureF} °F`, true)
             .setDescription(weatherConfig.icons[weatherData.currently.icon]);

        message.channel.sendEmbed(embed);
      });
    });
  },
};

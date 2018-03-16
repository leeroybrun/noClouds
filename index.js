const creds = require('./credentials.json');

const moment = require('moment');

const googleMapsClient = require('@google/maps').createClient({
  Promise: Promise,
  key: creds.googleMaps
});

const DarkSky = require('dark-sky')
const darksky = new DarkSky(creds.darkSky);

const SunCalc = require('suncalc');

class NoClouds {
  async geocode(address) {
    const pos = await googleMapsClient.geocode({
      address: address
    }).asPromise();

    return pos.json.results[0].geometry.location;
  }

  async darkSkyWeather(pos) {
    return darksky
      .coordinates(pos)
      .units('ca')
      .language('en')
      .exclude('minutely')
      .get();
  }

  async getWeatherForHour(date, pos) {
    const startOfDay = moment(date).utc().startOf('day');
    const startOfNextDay = moment(date).utc().add(1, 'days').startOf('day');
    const weather = await this.darkSkyWeather(pos);

    console.log(weather);

    const hourly = weather.hourly.data.filter((hourly) => {
      const time = hourly.time * 1000;
      return time == startOfDay.valueOf() || time == startOfNextDay.valueOf();
    });

    console.log(hourly);
  }

  getSunCalc(date, pos) {
    // Because of https://github.com/mourner/suncalc/issues/11
    const midDay = moment(date).utc().startOf('day').add(12, 'hours').toDate();
    return SunCalc.getTimes(midDay, pos.lat, pos.lng);
  }

  getSunrise(date, pos) {
    return this.getSunCalc(date, pos).sunrise;
  }
}

const noClouds = new NoClouds();

var tomorrow = moment().utc().add(1, 'days').startOf('day').toDate();

noClouds.geocode('Chardonne, Switzerland').then(pos => {
  const sunrise = noClouds.getSunrise(tomorrow, pos);

  console.log(sunrise);

  noClouds.getWeatherForHour(sunrise, pos);
}).catch((r) => {
  console.log(r);
});

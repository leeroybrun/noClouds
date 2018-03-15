const creds = require('./credentials.json');

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
    const weather = await this.darkSkyWeather(pos);

    weather.hourly.data.forEach((hourly) => {
      console.log(new Date(hourly.time*1000));
    })
  }

  getSunCalc(date, pos) {
    return SunCalc.getTimes(new Date(), pos.lat, pos.lng);
  }

  getSunrise(date, pos) {
    return this.getSunCalc(date, pos).sunrise;
  }
}

const noClouds = new NoClouds();

var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate()+1);

noClouds.geocode('Chardonne, Switzerland').then(pos => {
  const sunrise = noClouds.getSunrise(tomorrow, pos);

  noClouds.getWeatherForHour(sunrise, pos);
}).catch((r) => {
  console.log(r);
});

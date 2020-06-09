const apiKey = '570c92340d384eea8eb180128200806';
const apiURL = 'https://api.weatherapi.com/v1/forecast.json';
const corsHack = 'https://cors-anywhere.herokuapp.com/';
const apiImageURL =
  'https://cors-anywhere.herokuapp.com/https://www.flickr.com/services/rest/?method=flickr.photos.search&tags=nature,spring,morning&tag_mode=all&extras=url_h&format=json&nojsoncallback=1';
const apiKeyImage = '8cb61d73c757a9c87c9ca27d5ce9b80b';
const apiKeyGeo = 'dcb27ce8a7e240bc81680f4b36b918a9';
const apiGeolocationUrl =
  'https://api.opencagedata.com/geocode/v1/json?q=Minsk&pretty=1&no_annotations=1';

const getCityWeather = (city) =>
  fetch(
    `${corsHack}${apiURL}?key=${apiKey}&q=${city}&lang=en&days=3`,
  ).then((r) => r.json());

const getImageBackground = () => {
  return fetch(`${corsHack}${apiImageURL}&api_key=${apiKeyImage}`).then((r) =>
    r.json(),
  );
};

const getGeoLocation = () => {
  return fetch(`${corsHack}${apiGeolocationUrl}&key=${apiKeyGeo}`).then((r) =>
    r.json(),
  );
};

const backgroundUpdate = async () => {
  const response = await getImageBackground();

  function* imagesGenerator() {
    for (let photo of response.photos.photo) {
      yield photo.url_h;
    }
  }
  const images = imagesGenerator();
  images.next(); // undefined
  document.body.style.background = `url(${images.next().value})`;

  console.log(images.next().value);

  setInterval(() => {
    const curImage = images.next().value;
    document.body.style.background = `url(${curImage || images.next().value})`;
  }, 40000);
};
backgroundUpdate();

class Map {
  constructor(selector) {
    this.selector = selector;

    this.render();
  }

  update(lat, lon) {
    this.map.panTo(new L.LatLng(lat, lon));
    this.latitude.innerText = `Latitude: ${lat}`;
    this.longitude.innerText = `Longitude: ${lon}`;
  }

  render() {
    const lat = 50.0614;
    const lon = 19.9366;
    // Creating map options
    const mapOptions = {
      center: [lat, lon],
      zoom: 12,
    };

    // Creating a map object
    this.map = new L.map(this.selector, mapOptions);

    // Creating a Layer object
    const layer = new L.TileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );

    // Adding layer to the map
    this.map.addLayer(layer);

    this.latitude = document.createElement('p');
    this.latitude.innerText = `Latitude: ${lat}`;
    this.longitude = document.createElement('p');
    this.longitude.innerText = `Longitude: ${lon}`;

    const mapContainer = document.getElementById(this.selector).parentNode;
    mapContainer.appendChild(this.latitude);
    mapContainer.appendChild(this.longitude);
  }
}

class CitySearch {
  constructor(parent, citydata, weather, map, forecast) {
    this.parent = parent;
    this.citydata = citydata;
    this.weather = weather;
    this.map = map;
    this.forecast = forecast;

    this.render();
    this.loadCity('Cracow');
  }

  loadCity(city) {
    getCityWeather(city).then(({ location, current, forecast }) => {
      this.citydata.update(location);
      this.weather.update(current);
      this.map.update(location.lat, location.lon);
      this.forecast.update(forecast.forecastday);
    });
  }

  render() {
    const input = document.createElement('input');
    input.classList.add('form-control');
    input.type = 'search';
    input.placeholder = 'Search city or ZIP';

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-secondary');
    button.type = 'submit';
    button.innerText = 'Search';

    this.parent.appendChild(input);
    this.parent.appendChild(button);
    this.parent.addEventListener('submit', (e) => {
      e.preventDefault();
      this.loadCity(input.value);
      input.value = '';
    });
  }
}

class CityData {
  constructor(parent) {
    this.parent = parent;

    this.render();
  }

  update({ name, country, localtime }) {
    this.location.innerText = `${name}, ${country}`;
    this.data.innerText = this.formatDate(localtime);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-EN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(date));
  }

  render() {
    this.location = document.createElement('p');
    this.location.classList.add('weather__location');

    this.data = document.createElement('p');
    this.data.classList.add('weather__data');

    this.parent.appendChild(this.location);
    this.parent.appendChild(this.data);
  }
}

class Forecast {
  constructor(parent) {
    this.parent = parent;
  }

  update(days) {
    this.parent.innerHTML = '';
    days.forEach((dayData) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('col-4', 'forecast');

      const forecastDay = document.createElement('p');
      forecastDay.classList.add('forecast__day');
      forecastDay.innerText = new Intl.DateTimeFormat('en-EN', {
        weekday: 'long',
      }).format(new Date(dayData.date));
      wrapper.appendChild(forecastDay);

      const forecastTemperature = document.createElement('p');
      forecastTemperature.classList.add('forecast__temperature');
      forecastTemperature.innerText = `${Math.round(dayData.day.avgtemp_c)}°`;
      wrapper.appendChild(forecastTemperature);

      const img = document.createElement('img');
      img.classList.add('forecast__icon');
      img.src = `https:${dayData.day.condition.icon}`;
      wrapper.appendChild(img);

      this.parent.appendChild(wrapper);
    });
  }
}

class Weather {
  constructor(parent) {
    this.parent = parent;

    this.render();
  }

  update({ temp_c, condition, feelslike_c, wind_kph, humidity }) {
    const { text, icon } = condition;
    this.temperature.innerText = Math.round(temp_c);
    this.image.src = `https:${icon}`;

    this.dataCluster.innerHTML = '';

    const conditionText = document.createElement('p');
    conditionText.innerText = text;
    this.dataCluster.appendChild(conditionText);

    const feelsLike = document.createElement('p');
    feelsLike.innerText = `Feels like: ${feelslike_c}°`;
    this.dataCluster.appendChild(feelsLike);

    const wind = document.createElement('p');
    wind.innerText = `Wind: ${wind_kph} kph`;
    this.dataCluster.appendChild(wind);

    const humidityBlock = document.createElement('p');
    humidityBlock.innerText = `Humidity: ${humidity}%`;
    this.dataCluster.appendChild(humidityBlock);
  }

  render() {
    this.temperature = document.createElement('p');
    this.temperature.classList.add('weather__temperature-today');
    const temperatureContainer = document.createElement('div');
    temperatureContainer.classList.add('col-8');
    temperatureContainer.appendChild(this.temperature);

    this.image = document.createElement('img');
    this.dataCluster = document.createElement('div');
    this.dataCluster.classList.add('weather__data-cluster');
    const conditionContainer = document.createElement('div');
    conditionContainer.classList.add('col-4');
    conditionContainer.appendChild(this.image);
    conditionContainer.appendChild(this.dataCluster);

    this.parent.appendChild(temperatureContainer);
    this.parent.appendChild(conditionContainer);
  }
}

const city = new CityData(document.getElementById('city-data'));
const weather = new Weather(document.getElementById('weather-data'));
const map = new Map('map');
const forecast = new Forecast(document.getElementById('forecast-data'));

const search = new CitySearch(
  document.getElementById('search-form'),
  city,
  weather,
  map,
  forecast,
);

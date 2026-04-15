// DOM Elements
const searchForm = document.getElementById('searchForm');
const locationInput = document.getElementById('locationInput');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const currentWeatherElement = document.getElementById('currentWeather');
const forecastElement = document.getElementById('forecast');

// API Configuration (Replace with your own API key)
const API_KEY = '#'; // Your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Clothing suggestions data
const clothingSuggestions = {
  temperature: [
    { max: 0, suggestion: "Heavy coat, gloves, scarf, boots" },
    { min: 1, max: 10, suggestion: "Warm jacket or sweater, scarf" },
    { min: 11, max: 20, suggestion: "Light jacket or long-sleeve shirt" },
    { min: 21, max: 30, suggestion: "T-shirt, shorts or light pants" },
    { min: 31, suggestion: "Shorts, tank top, breathable fabrics, stay hydrated" }
  ],
  weatherCondition: {
    rain: "Carry umbrella or raincoat, waterproof shoes",
    drizzle: "Carry umbrella or raincoat, waterproof shoes",
    snow: "Snow boots, heavy coat, gloves, scarf",
    storm: "Stay indoors if possible, protective clothing",
    thunder: "Stay indoors if possible, protective clothing",
    windy: "Windbreaker or jacket to avoid chill",
    fog: "Reflective or visible clothing for safety",
    mist: "Reflective or visible clothing for safety",
    cloudy: "Comfortable layers, may need a light jacket"
  },
  humidity: {
    high: "Choose breathable fabrics, avoid heavy layers",
    low: "Moisturizing layers, avoid static-prone clothes"
  },
  timeOfDay: {
    morning: "Extra layer for warmth",
    evening: "Extra layer for warmth",
    midday: "Light clothing, sun protection (hat, sunglasses)",
    afternoon: "Light clothing, sun protection (hat, sunglasses)"
  }
};

// Format date function
function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get weather icon URL
function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Convert Kelvin to Celsius
function kelvinToCelsius(kelvin) {
  return Math.round(kelvin - 273.15);
}

// Show loading state
function showLoading() {
  loadingElement.classList.remove('hidden');
  errorElement.classList.add('hidden');
  currentWeatherElement.classList.add('hidden');
  forecastElement.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  loadingElement.classList.add('hidden');
}

// Show error message
function showError(message) {
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
  currentWeatherElement.classList.add('hidden');
  forecastElement.classList.add('hidden');
}

// Get temperature-based suggestion
function getTemperatureSuggestion(tempC) {
  for (const range of clothingSuggestions.temperature) {
    if (
      (range.min === undefined || tempC >= range.min) &&
      (range.max === undefined || tempC <= range.max)
    ) {
      return range.suggestion;
    }
  }
  return "";
}

// Get weather condition suggestion
function getWeatherConditionSuggestion(condition) {
  condition = condition.toLowerCase();
  for (const key in clothingSuggestions.weatherCondition) {
    if (condition.includes(key)) {
      return clothingSuggestions.weatherCondition[key];
    }
  }
  return "";
}

// Get humidity suggestion
function getHumiditySuggestion(humidityPercent) {
  if (humidityPercent > 70) return clothingSuggestions.humidity.high;
  if (humidityPercent < 30) return clothingSuggestions.humidity.low;
  return "";
}

// Get time of day suggestion
function getTimeOfDaySuggestion() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return clothingSuggestions.timeOfDay.morning;
  if (hour >= 10 && hour < 17) return clothingSuggestions.timeOfDay.midday;
  if (hour >= 17 && hour < 20) return clothingSuggestions.timeOfDay.evening;
  return ""; // night or late night - no suggestion
}

// Update current weather UI and show clothing suggestions
function updateCurrentWeather(data) {
  const {
    name,
    dt,
    main: { temp, feels_like, humidity, pressure },
    weather: [{ description, icon }],
    wind: { speed },
  } = data;

  const tempC = kelvinToCelsius(temp);

  document.getElementById('locationName').textContent = name;
  document.getElementById('currentDate').textContent = formatDate(dt);
  document.getElementById('temperature').textContent = `${tempC}°C`;
  document.getElementById('weatherDescription').textContent = description;
  document.getElementById('feelsLike').textContent = `${kelvinToCelsius(feels_like)}°C`;
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${speed} m/s`;
  document.getElementById('pressure').textContent = `${pressure} hPa`;

  const weatherIcon = document.getElementById('weatherIcon');
  weatherIcon.src = getWeatherIconUrl(icon);
  weatherIcon.alt = `${description} weather condition icon`;

  // Generate clothing suggestions
  const tempSuggestion = getTemperatureSuggestion(tempC);
  const conditionSuggestion = getWeatherConditionSuggestion(description);
  const humiditySuggestion = getHumiditySuggestion(humidity);
  const timeSuggestion = getTimeOfDaySuggestion();

  const combinedSuggestion = [
    tempSuggestion,
    conditionSuggestion,
    humiditySuggestion,
    timeSuggestion
  ].filter(Boolean).join("; ");

  // Create or update suggestion element
  let suggestionEl = document.getElementById('clothingSuggestion');
  if (!suggestionEl) {
    suggestionEl = document.createElement('div');
    suggestionEl.id = 'clothingSuggestion';
    suggestionEl.style.marginTop = '20px';
    suggestionEl.style.padding = '15px';
    suggestionEl.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
    suggestionEl.style.borderRadius = '12px';
    suggestionEl.style.color = '#2d3748';
    suggestionEl.style.fontWeight = '600';
    currentWeatherElement.appendChild(suggestionEl);
  }
  suggestionEl.textContent = combinedSuggestion
    ? `Clothing suggestion: ${combinedSuggestion}.`
    : "No specific clothing suggestions available.";

  currentWeatherElement.classList.remove('hidden');
  currentWeatherElement.classList.add('fade-in');
}

// Update forecast UI
function updateForecast(data) {
  const forecastCards = document.getElementById('forecastCards');
  forecastCards.innerHTML = '';

  // Group forecast by day (get one forecast per day)
  const dailyForecasts = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = item;
    }
  });

  // Display next 5 days
  Object.values(dailyForecasts)
    .slice(0, 5)
    .forEach((day) => {
      const {
        dt,
        main: { temp },
        weather: [{ description, icon }],
      } = day;

      const forecastCard = document.createElement('div');
      forecastCard.className = 'forecast-card';
      forecastCard.innerHTML = `
          <div class="forecast-date">${formatDate(dt)}</div>
          <img src="${getWeatherIconUrl(icon)}" alt="${description} forecast icon" class="forecast-icon">
          <div class="forecast-temp">${kelvinToCelsius(temp)}°C</div>
          <div class="forecast-desc">${description}</div>
        `;
      forecastCards.appendChild(forecastCard);
    });

  forecastElement.classList.remove('hidden');
  forecastElement.classList.add('fade-in');
}

// Fetch weather data
async function fetchWeatherData(location) {
  showLoading();

  try {
    // First, get coordinates for the location
    const geoResponse = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}`
    );

    if (!geoResponse.ok) {
      throw new Error('Location not found. Please check the spelling and try again.');
    }

    const geoData = await geoResponse.json();
    const { lat, lon } = geoData.coord;

    // Then get current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch weather data. Please try again.');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    return { current: currentData, forecast: forecastData };
  } catch (error) {
    throw error;
  } finally {
    hideLoading();
  }
}

// Handle form submission
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const location = locationInput.value.trim();
  if (!location) return;

  try {
    const weatherData = await fetchWeatherData(location);
    updateCurrentWeather(weatherData.current);
    updateForecast(weatherData.forecast);
    errorElement.classList.add('hidden');
  } catch (error) {
    showError(error.message);
  }
});



  const suggestionEl = document.getElementById('clothingSuggestion');
suggestionEl.classList.remove('hidden');
suggestionEl.innerHTML = `
  <div class="icon">👚</div>
  <div class="suggestion-text">${formattedSuggestionText}</div>
  <div class="info-icon">
    ℹ️
    <div class="info-tooltip">
      These suggestions are based on current weather conditions to help you dress comfortably and stylishly.
    </div>
  </div>
`;

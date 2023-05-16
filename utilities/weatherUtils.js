//noinspection JSUnresolvedVariable

// const point = {
//     latitude: 47.2529,
//     longitude: -122.4443
// }

/**
 * Converts Celsius into Fahrenheit.
 * @param {number} degrees degrees in Celsius.
 * @return {number} degrees in Fahrenheit.
 */
const celsiusToFahrenheit = (degrees) => degrees * 9/5 + 32;

/**
 * Extracts current weather condition data from JSON objects.
 * @param {JSON} forecastGridDataJson the forecast grid data JSON
 * @param {JSON} forecastJson the forecast JSON.
 * @return {{temperature: string,
 *           highTemperature: string,
 *           lowTemperature: string,
 *           forecast: string}} the current weather conditions.
 */
const getCurrentConditions = (forecastGridDataJson, forecastJson) => {
    const maxTemp = celsiusToFahrenheit(forecastGridDataJson.properties.maxTemperature.values[0].value);
    const minTemp = celsiusToFahrenheit(forecastGridDataJson.properties.minTemperature.values[0].value);
    const now = forecastJson.properties.periods[0];
    
    return {
        temperature: `${now.temperature}°${now.temperatureUnit}`,
        highTemperature: `${Math.floor(maxTemp)}°${now.temperatureUnit}`,
        lowTemperature: `${Math.floor(minTemp)}°${now.temperatureUnit}`,
        forecast: now.detailedForecast
    }
}

/**
 * Extracts 24-hour forecast data from JSON object.
 * @param {JSON} forecastHourlyJson the hourly forecast JSON.
 * @return {[{time: string,
 *            temperature: string,
 *            forecast: string}]} the 24-hour forecast.
 */
const getTwentyFourHourForecast = (forecastHourlyJson) => {
    const twentyFourHourForecast = [];
    for (let i = 0; i < 24; i++) {
        const hour = forecastHourlyJson.properties.periods[i];
        const time = new Date(Date.parse(hour.startTime)).toLocaleTimeString('en-US');
        
        twentyFourHourForecast.push({
            time: time,
            temperature: `${hour.temperature}°${hour.temperatureUnit}`,
            forecast: hour.shortForecast
        });
    }
    return twentyFourHourForecast;
}

/**
 * Extracts 7-day forecast data from JSON object.
 * @param forecastJson the 7-day forecast JSON
 * @return {[{day: string,
 *            temperature: string,
 *            forecast: string}]} the 7-day forecast.
 */
const getSevenDayForecast = (forecastJson) => {
    const sevenDayForecast = [];
    forecastJson.properties.periods
        .filter(day => day.isDaytime)
        .forEach(day => {
            sevenDayForecast.push({
                name: day.name,
                temperature: `${day.temperature}°${day.temperatureUnit}`,
                forecast: day.shortForecast
            })
        });
    return sevenDayForecast;
}

/**
 * Gets the weather data at a latitude/longitude point.
 * @param {Object} point the latitude/longitude point.
 * @param {number} point.latitude the latitude.
 * @param {number} point.longitude the longitude.
 * @return {Promise<{currentConditions: {temperature: string, highTemperature: string, lowTemperature: string, forecast: string},
 *                   sevenDayForecast: {day: string, temperature: string, forecast: string}[],
 *                   twentyFourHourForecast: {time: string, temperature: string, forecast: string}[]}>}
 *         The weather data at the given latitude/longitude point.
 */
const { getWeatherData } = require("../utilities/weatherUtils");
const getWeatherData = async (point) => {
    const url = `https://api.weather.gov/points/${point.latitude},${point.longitude}`;
    const pointJson = await fetch(url).then(response => response.json());
    
    const forecastGridDataUrl = pointJson.properties.forecastGridData;
    const forecastUrl = pointJson.properties.forecast;
    const forecastHourlyUrl = pointJson.properties.forecastHourly;
    
    const forecastGridDataJson = await fetch(forecastGridDataUrl).then(response => response.json());
    const forecastJson = await fetch(forecastUrl).then(response => response.json());
    const forecastHourlyJson = await fetch(forecastHourlyUrl).then(response => response.json());
    
    return {
        currentConditions: getCurrentConditions(forecastGridDataJson, forecastJson),
        sevenDayForecast: getSevenDayForecast(forecastJson),
        twentyFourHourForecast: getTwentyFourHourForecast(forecastHourlyJson),
    };
}

module.exports = { getWeatherData };


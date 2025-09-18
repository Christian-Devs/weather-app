import axios from "axios";
import { getApiKeys } from "../database.js";

// Fetch current weather data from OpenWeatherMap
export async function getCurrWeather(lat, lon) {
    const owmKey = await getApiKeys('OPENWEATHER_KEY');
    const url = 'https://api.openweathermap.org/data/2.5/weather';
    const { data } = await axios.get(url, {
        params: {
            lat,
            lon,
            appid: owmKey,
            units: 'metric'
        }
    });
    return data;
}

// Fetch hourly weather forecast from OpenWeatherMap
export async function getHourlyWeather(lat, lon) {
    const owmKey = await getApiKeys('OPENWEATHER_KEY');
    const url = 'https://api.openweathermap.org/data/2.5/forecast';
    const { data } = await axios.get(url, {
        params: {
            lat,
            lon,
            appid: owmKey,
            units: 'metric'
        }
    });
    return data;
}

// Summarize the weather data for easier consumption
export function getSummary(current, hourly) {
    const now = {
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        wind_speed: current.wind.speed,
        weather: current.weather[0].description,
        icon: current.weather[0].icon,
        city: current.name,
    };
    const next24h = hourly.list.slice(0, 8).map(item => ({
        time: item.dt_txt,
        temp: item.main.temp,
        weather: item.weather[0].description,
        icon: item.weather[0].icon,
    }));
    return { now, next24h };
}
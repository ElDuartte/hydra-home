/**
 * Weather Component - Shows weather info (full or mini variant)
 */

import { BaseComponent } from './BaseComponent.js';
import { fetchWeather, getWeatherEmoji } from '../api.js';

export class Weather extends BaseComponent {
    defaults() {
        return {
            city: '',
            lat: 0,
            lon: 0,
            units: 'metric',
            updateInterval: 1800000, // 30 minutes
            variant: 'full', // 'full' or 'mini'
        };
    }

    render() {
        this.html('<div class="loading">Loading...</div>');
    }

    async update() {
        try {
            const data = await fetchWeather({
                lat: this.options.lat,
                lon: this.options.lon,
                units: this.options.units,
            });
            this.renderWeather(data);
        } catch (error) {
            this.renderError(error);
        }
    }

    renderWeather(data) {
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const icon = getWeatherEmoji(data.weather[0].icon);
        const description = data.weather[0].description;
        const unit = this.options.units === 'metric' ? '°C' : '°F';

        if (this.options.variant === 'mini') {
            this.renderMini({ temp, feelsLike, humidity, icon, description, unit });
        } else {
            this.renderFull({ temp, feelsLike, humidity, icon, description, unit, data });
        }
    }

    renderFull({ temp, feelsLike, humidity, icon, description, unit, data }) {
        const windSpeed = Math.round(data.wind.speed * 3.6);
        const cityName = data.name;

        this.html(`
            <div class="weather-main">
                <span class="weather-icon">${icon}</span>
                <div class="weather-temp">${temp}<span class="weather-temp-unit">${unit}</span></div>
            </div>
            <div class="weather-description" style="text-align:center;color:var(--text-secondary);text-transform:capitalize;">
                ${description}
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Sensación</div>
                    <div class="weather-detail-value">${feelsLike}${unit}</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Humedad</div>
                    <div class="weather-detail-value">${humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Viento</div>
                    <div class="weather-detail-value">${windSpeed} km/h</div>
                </div>
            </div>
            <div class="weather-location">📍 ${cityName}</div>
        `);
    }

    renderMini({ temp, feelsLike, humidity, icon, description, unit }) {
        const city = this.options.city;

        this.html(`
            <div class="weather-mini-header">
                <span class="weather-mini-city">📍 ${city}</span>
                <span class="weather-mini-icon">${icon}</span>
            </div>
            <div class="weather-mini-temp">${temp}<span class="weather-mini-unit">${unit}</span></div>
            <div class="weather-mini-desc">${description}</div>
            <div class="weather-mini-details">
                <span>Sensación: ${feelsLike}${unit}</span>
                <span>Humedad: ${humidity}%</span>
            </div>
        `);
    }

    renderError(error) {
        const city = this.options.city || 'Weather';

        if (this.options.variant === 'mini') {
            this.html(`
                <div class="weather-mini-error">
                    <span class="weather-mini-city">📍 ${city}</span>
                    <span class="weather-mini-error-icon">⚠️</span>
                </div>
            `);
        } else {
            this.html(`
                <div class="weather-error">
                    <div class="weather-error-icon">⚠️</div>
                    <div>Error loading weather</div>
                </div>
            `);
        }
    }
}

// Alias for backward compatibility
export class WeatherMini extends Weather {
    defaults() {
        return { ...super.defaults(), variant: 'mini' };
    }
}

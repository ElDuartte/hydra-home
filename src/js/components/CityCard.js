/**
 * CityCard Component - Displays weather and time for a specific city
 */

import { BaseComponent } from './BaseComponent.js';
import { fetchWeather, getWeatherEmoji } from '../api.js';

export class CityCard extends BaseComponent {
    defaults() {
        return {
            city: '',
            lat: 0,
            lon: 0,
            timezone: '',
            units: 'metric',
            updateInterval: 1800000, // 30 minutes for weather
        };
    }

    async init() {
        this.intervals = [];
        this.timeElement = null;
        this.weatherElement = null;
        await this.update();
        this.startUpdates();
    }

    async update() {
        await this.updateWeather();
        this.updateTime();
    }

    async updateWeather() {
        try {
            const data = await fetchWeather({
                lat: this.options.lat,
                lon: this.options.lon,
                units: this.options.units,
            });
            this.renderWeather(data);
        } catch (error) {
            console.error('Weather error:', error);
            this.renderWeatherError();
        }
    }

    updateTime() {
        if (!this.options.timezone) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', {
            timeZone: this.options.timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const timeEl = this.$('[data-city-time]');
        if (timeEl) {
            timeEl.textContent = timeStr;
        }
    }

    renderWeather(data) {
        const temp = Math.round(data.main.temp);
        const icon = getWeatherEmoji(data.weather[0].icon);
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const unit = this.options.units === 'metric' ? '°C' : '°F';

        const weatherEl = this.$('[data-city-weather]');
        if (!weatherEl) return;

        weatherEl.innerHTML = `
            <div class="city-weather-main">
                <span class="city-weather-icon">${icon}</span>
                <span class="city-weather-temp">${temp}${unit}</span>
            </div>
            <div class="city-weather-desc">${description}</div>
            <div class="city-weather-humidity">💧 ${humidity}%</div>
        `;
    }

    renderWeatherError() {
        const weatherEl = this.$('[data-city-weather]');
        if (!weatherEl) return;

        weatherEl.innerHTML = `
            <div class="city-weather-error">
                <span>⚠️</span>
                <span>Weather unavailable</span>
            </div>
        `;
    }

    startUpdates() {
        // Update weather every 30 minutes
        this.intervals.push(setInterval(() => this.updateWeather(), this.options.updateInterval));

        // Update time every second
        this.intervals.push(setInterval(() => this.updateTime(), 1000));
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

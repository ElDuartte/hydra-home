/**
 * Main.js - Dashboard entry point
 */

import { loadConfig } from './config.js';
import { Clock } from './components/Clock.js';
import { Weather, WeatherMini } from './components/Weather.js';
import { SystemStats } from './components/SystemStats.js';
import { DockerContainers } from './components/DockerContainers.js';
import { WorldClocks } from './components/WorldClocks.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { JellyfinCard } from './components/JellyfinCard.js';
import { applyTheme, getCurrentTheme } from './themes.js';

class Dashboard {
    constructor() {
        this.components = [];
        this.config = null;
    }

    async init() {
        console.log('🚀 Starting Hydra Dashboard...');

        // Load config from server
        this.config = await loadConfig();

        // Apply theme and layout
        this.applyTheme();
        this.applyLayout();

        // Initialize components
        await this.initComponents();

        console.log('✅ Dashboard ready');
    }

    applyTheme() {
        // Apply saved theme from localStorage or default to tokyo-night
        const savedTheme = getCurrentTheme();
        applyTheme(savedTheme);

        // Also apply any custom theme overrides from config
        const root = document.documentElement;
        if (this.config.theme) {
            Object.entries(this.config.theme).forEach(([prop, value]) => {
                if (value) root.style.setProperty(prop, value);
            });
        }
    }

    applyLayout() {
        const { weatherCities, clockCities } = this.config;
        const hasMiddleContent = weatherCities.length > 0 || clockCities.length > 0;

        // If no cities configured, use 2-column layout
        if (!hasMiddleContent) {
            document.querySelector('.dashboard').classList.add('two-columns');
            document.querySelector('.column-center')?.remove();
        }

        // Hide weather cities section if empty
        if (weatherCities.length === 0) {
            document.querySelector('.weather-cities')?.remove();
        }

        // Hide world clocks section if empty
        if (clockCities.length === 0) {
            document.getElementById('world-clocks')?.remove();
        }
    }

    async initComponents() {
        const { config } = this;

        // Theme selector (always shown)
        await this.initComponent('theme-selector', ThemeSelector, {});

        // Clock (always shown)
        await this.initComponent('clock', Clock, config.clock);

        // Main weather
        await this.initComponent('weather', Weather, {
            ...config.location,
        });

        // Weather cities (dynamic)
        await this.initWeatherCities(config.weatherCities, config.location.units);

        // Docker containers
        await this.initComponent('docker-containers', DockerContainers, {
            glancesUrl: config.glances.url,
            updateInterval: config.glances.updateInterval,
        });

        // Jellyfin card (if enabled)
        if (config.jellyfin?.enabled) {
            await this.initComponent('jellyfin-card', JellyfinCard, {
                url: config.jellyfin.url,
                webUrl: config.jellyfin.webUrl,
                apiKey: config.jellyfin.apiKey,
                glancesUrl: config.glances.url,
            });
        }

        // System stats
        await this.initComponent('system-stats', SystemStats, {
            glancesUrl: config.glances.url,
            updateInterval: config.glances.updateInterval,
        });

        // World clocks (dynamic)
        if (config.clockCities.length > 0) {
            await this.initComponent('world-clocks', WorldClocks, {
                cities: config.clockCities,
            });
        }
    }

    async initWeatherCities(cities, units) {
        const container = document.querySelector('.weather-cities');
        if (!container || cities.length === 0) return;

        // Clear existing placeholder divs
        container.innerHTML = '';

        // Create weather cards for each city
        for (const city of cities) {
            const div = document.createElement('div');
            div.className = 'weather-card-mini';
            container.appendChild(div);

            const instance = new WeatherMini(div, {
                city: city.name,
                lat: city.lat,
                lon: city.lon,
                units: units || 'metric',
            });
            await instance.init();
            this.components.push(instance);
        }
    }

    async initComponent(id, Component, options) {
        const el = document.getElementById(id);
        if (!el) return;

        const instance = new Component(el, options);
        await instance.init();
        this.components.push(instance);
    }

    destroy() {
        this.components.forEach(c => c.destroy?.());
        this.components = [];
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
    window.dashboard = dashboard;
});

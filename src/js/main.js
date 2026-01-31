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
import { JellyfinNowPlaying } from './components/JellyfinNowPlaying.js';
import { CityCard } from './components/CityCard.js';
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
        // Center column is always shown with the new 3-row layout
        // No dynamic layout adjustments needed
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

        // City cards (Austin and Bogotá)
        await this.initCityCards(config);

        // Jellyfin Now Playing (if enabled)
        if (config.jellyfin?.enabled) {
            await this.initComponent('jellyfin-now-playing', JellyfinNowPlaying, {});
        }

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
    }

    async initCityCards(config) {
        // Austin city card
        const austinCity = config.weatherCities.find(c => c.name.toLowerCase().includes('austin'));
        const austinClock = config.clockCities.find(c => c.name.toLowerCase().includes('austin'));

        if (austinCity && austinClock) {
            const austinCard = document.getElementById('city-card-austin');
            if (austinCard) {
                const instance = new CityCard(austinCard, {
                    city: austinCity.name,
                    lat: austinCity.lat,
                    lon: austinCity.lon,
                    timezone: austinClock.timezone,
                    units: config.location.units || 'metric',
                });
                await instance.init();
                this.components.push(instance);
            }
        }

        // Bogotá city card
        const bogotaCity = config.weatherCities.find(c => c.name.toLowerCase().includes('bogot'));
        const bogotaClock = config.clockCities.find(c => c.name.toLowerCase().includes('bogot'));

        if (bogotaCity && bogotaClock) {
            const bogotaCard = document.getElementById('city-card-bogota');
            if (bogotaCard) {
                const instance = new CityCard(bogotaCard, {
                    city: bogotaCity.name,
                    lat: bogotaCity.lat,
                    lon: bogotaCity.lon,
                    timezone: bogotaClock.timezone,
                    units: config.location.units || 'metric',
                });
                await instance.init();
                this.components.push(instance);
            }
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

/**
 * Main.js - Dashboard entry point
 */

import { configManager } from './config-manager.js';
import { GlancesAPI } from './glances.js';
import { GlancesPoller } from './glances-poller.js';
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
        this.glancesPoller = null;
    }

    async init(config) {
        console.log('🚀 Starting Hydra Dashboard...');

        this.config = config;

        // Create Glances poller (single instance shared by all components)
        const glancesApi = new GlancesAPI(config.glances.url);
        this.glancesPoller = new GlancesPoller(glancesApi);

        // Apply theme and layout
        this.applyTheme();
        this.applyLayout();

        // Initialize components
        await this.initComponents();

        // Start Glances poller after all components are subscribed
        this.glancesPoller.start();

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
            glancesPoller: this.glancesPoller,
            updateInterval: config.glances.updateInterval,
        });

        // Jellyfin card (if enabled)
        if (config.jellyfin?.enabled) {
            await this.initComponent('jellyfin-card', JellyfinCard, {
                url: config.jellyfin.url,
                webUrl: config.jellyfin.webUrl,
                apiKey: config.jellyfin.apiKey,
                glancesPoller: this.glancesPoller,
            });
        }

        // System stats
        await this.initComponent('system-stats', SystemStats, {
            glancesPoller: this.glancesPoller,
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
        if (this.glancesPoller) {
            this.glancesPoller.destroy();
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();

    // Subscribe to config ready event
    configManager.onReady((config) => {
        dashboard.init(config);
        window.dashboard = dashboard;
    });

    // Subscribe to config failed event
    configManager.onFailed((error) => {
        console.error('Config load failed:', error);
        showConfigError(error);
    });

    // Start loading config
    configManager.load();
});

/**
 * Show error UI when config fails to load.
 */
function showConfigError(error) {
    const root = document.getElementById('root') || document.body;
    root.innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #1a1a1a;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
        ">
            <div style="
                text-align: center;
                padding: 2rem;
                background: #2a2a2a;
                border-radius: 8px;
                max-width: 500px;
            ">
                <h1 style="margin: 0 0 1rem 0; color: #ff6b6b;">⚠️ Configuration Error</h1>
                <p style="margin: 0 0 1rem 0; color: #aaa;">Failed to load configuration file.</p>
                <pre style="
                    background: #1a1a1a;
                    padding: 1rem;
                    border-radius: 4px;
                    text-align: left;
                    color: #ff9999;
                    overflow-x: auto;
                    margin: 1rem 0;
                ">Error: ${escapeHtml(error)}</pre>
                <p style="margin: 1rem 0 0 0; color: #888; font-size: 0.9rem;">
                    Please check your configuration and server logs.
                </p>
            </div>
        </div>
    `;
}

/**
 * Simple HTML escape to prevent XSS.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

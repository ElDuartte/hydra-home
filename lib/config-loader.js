const fs = require('fs');
const path = require('path');

/**
 * Schema with defaults for all config values.
 * Soft fail: missing values use defaults, invalid values are logged as warnings.
 */
const SCHEMA = {
    mainLocation: {
        default: { city: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038, units: 'metric' },
        validate: (val) => val && typeof val === 'object' && val.city && typeof val.lat === 'number' && typeof val.lon === 'number',
    },
    weatherCities: {
        default: [],
        validate: (val) => Array.isArray(val) && val.every(c => c.name && typeof c.lat === 'number' && typeof c.lon === 'number'),
    },
    clockCities: {
        default: [],
        validate: (val) => Array.isArray(val) && val.every(c => c.name && c.timezone),
    },
    clock: {
        default: { use24Hour: true, showSeconds: true, locale: 'es-ES' },
        validate: (val) => val && typeof val === 'object' && typeof val.use24Hour === 'boolean',
    },
    theme: {
        default: {},
        validate: (val) => typeof val === 'object',
    },
    jellyfin: {
        default: { enabled: false },
        validate: (val) => val && typeof val === 'object' && typeof val.enabled === 'boolean',
    },
};

class ConfigLoader {
    constructor(filePath, env = process.env) {
        this.filePath = filePath;
        this.env = env;
        this.config = null;
        this.warnings = [];
    }

    load() {
        this.warnings = [];
        const raw = this._readFile();
        this.config = this._validate(raw);
        return this.config;
    }

    _readFile() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                return data || {};
            } else {
                this.warnings.push(`Config file not found: ${this.filePath}. Using defaults.`);
            }
        } catch (error) {
            this.warnings.push(`Error reading ${this.filePath}: ${error.message}. Using defaults.`);
        }
        return {};
    }

    _validate(raw) {
        const config = {};

        Object.entries(SCHEMA).forEach(([key, schema]) => {
            const value = raw[key];

            if (value === undefined) {
                config[key] = schema.default;
            } else if (schema.validate(value)) {
                config[key] = value;
            } else {
                this.warnings.push(`Invalid ${key}. Using default.`);
                config[key] = schema.default;
            }
        });

        return config;
    }

    /**
     * Get backend-only config (not sent to frontend).
     * Currently empty, but kept for future use (e.g., database paths, secrets).
     */
    getBackendConfig() {
        return {
            port: parseInt(this.env.PORT) || 3000,
        };
    }

    /**
     * Get frontend config (filtered, no backend-only values).
     * Includes env var overrides for API endpoints.
     */
    getFrontendConfig() {
        if (!this.config) this.load();

        const frontendConfig = {
            glances: {
                url: '/api/glances',
                updateInterval: parseInt(this.env.GLANCES_UPDATE_INTERVAL) || 3000,
            },
            location: this.config.mainLocation,
            clock: this.config.clock,
            weatherCities: this.config.weatherCities,
            clockCities: this.config.clockCities,
            theme: this._filterTheme(this.config.theme),
            jellyfin: {
                enabled: this.config.jellyfin.enabled,
                url: this.env.JELLYFIN_URL || 'http://localhost:8096',
                webUrl: this.env.JELLYFIN_WEB_URL || this.env.JELLYFIN_URL || 'http://localhost:8096',
                apiKey: this.env.JELLYFIN_API_KEY || '',
            },
        };

        return frontendConfig;
    }

    _filterTheme(theme) {
        const filtered = {};
        Object.entries(theme).forEach(([key, value]) => {
            if (value) filtered[key] = value;
        });
        return filtered;
    }

    /**
     * Get accumulated warnings (soft failures).
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Log warnings to console.
     */
    logWarnings() {
        this.warnings.forEach(w => console.warn(`[config] ${w}`));
    }
}

module.exports = ConfigLoader;

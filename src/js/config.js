/**
 * Dashboard Configuration
 * Fetches config from server API (which reads from .env)
 */

let configCache = null;

export async function loadConfig() {
    if (configCache) return configCache;

    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to load config');
        configCache = await response.json();
        return configCache;
    } catch (error) {
        console.error('Config load error:', error);
        // Return defaults if API fails
        return {
            glances: { url: 'http://localhost:61208/api/4', updateInterval: 3000 },
            location: { city: 'Madrid', lat: 40.4168, lon: -3.7038, units: 'metric' },
            clock: { use24Hour: true, showSeconds: true, locale: 'es-ES' },
            weatherCities: [],
            clockCities: [],
            theme: {},
        };
    }
}

// For backward compatibility - sync access (use loadConfig() for async)
export const config = {
    glances: { url: 'http://localhost:61208/api/4', updateInterval: 3000 },
    location: { city: 'Madrid', lat: 40.4168, lon: -3.7038, units: 'metric' },
    clock: { use24Hour: true, showSeconds: true, locale: 'es-ES' },
    weatherCities: [],
    clockCities: [],
    theme: {},
};

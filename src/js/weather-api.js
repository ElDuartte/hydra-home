/**
 * Weather API client.
 * Wraps the /api/weather proxy endpoint.
 * Internalizes HTTP utilities (fetchJSON, ApiError, buildUrl) since they have no other callers.
 */

/**
 * Custom error for API calls.
 */
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

/**
 * Generic GET request wrapper.
 * @param {string} url - API URL
 * @param {Object} options - Additional options for fetch
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function fetchJSON(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
            throw new ApiError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status
            );
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(`Network error: ${error.message}`, 0);
    }
}

/**
 * Builds URL with query params.
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} - Complete URL
 */
function buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    return url.toString();
}

/**
 * Fetches weather data via server proxy (hides API key).
 * @param {Object} params - Configuration parameters
 * @returns {Promise<Object>} - Weather data
 */
export async function fetchWeather({ lat, lon, units = 'metric' }) {
    const url = `/api/weather?lat=${lat}&lon=${lon}&units=${units}`;
    return await fetchJSON(url);
}

/**
 * Converts OpenWeatherMap icon code to emoji.
 * @param {string} iconCode - Icon code (e.g., '01d')
 * @returns {string} - Corresponding emoji
 */
export function getWeatherEmoji(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌡️';
}

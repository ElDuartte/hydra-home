/**
 * API Module - Funciones fetch genéricas
 */

/**
 * Realiza una petición GET genérica
 * @param {string} url - URL de la API
 * @param {Object} options - Opciones adicionales para fetch
 * @returns {Promise<Object>} - Datos JSON parseados
 */
export async function fetchJSON(url, options = {}) {
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
 * Custom Error para APIs
 */
export class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

/**
 * Obtiene datos del clima via server proxy (hides API key)
 * @param {Object} params - Parámetros de configuración
 * @returns {Promise<Object>} - Datos del clima
 */
export async function fetchWeather({ lat, lon, units = 'metric' }) {
    const url = `/api/weather?lat=${lat}&lon=${lon}&units=${units}`;
    return await fetchJSON(url);
}

/**
 * Construye URL con query params
 * @param {string} baseUrl - URL base
 * @param {Object} params - Parámetros query
 * @returns {string} - URL completa
 */
export function buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    return url.toString();
}

/**
 * Formats bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string (e.g., "1.5 GB")
 */
export function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
}

/**
 * Convierte código de icono de OpenWeatherMap a emoji
 * @param {string} iconCode - Código del icono (ej: '01d')
 * @returns {string} - Emoji correspondiente
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

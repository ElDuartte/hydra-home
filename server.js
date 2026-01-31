const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'src')));

// Load variables.json with defaults
function loadVariables() {
    const filePath = path.join(__dirname, 'variables.json');

    const defaults = {
        mainLocation: { city: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038, units: 'metric' },
        weatherCities: [],
        clockCities: [],
        clock: { use24Hour: true, showSeconds: true, locale: 'es-ES' },
        theme: {},
    };

    try {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return { ...defaults, ...data };
        }
    } catch (error) {
        console.error('Error reading variables.json:', error.message);
    }

    return defaults;
}

// Build config for frontend
function getConfig() {
    const vars = loadVariables();

    // Filter empty theme values
    const theme = {};
    if (vars.theme) {
        Object.entries(vars.theme).forEach(([key, value]) => {
            if (value) theme[key] = value;
        });
    }

    return {
        glances: {
            url: '/api/glances',  // Use server proxy to avoid CORS
            updateInterval: parseInt(process.env.GLANCES_UPDATE_INTERVAL) || 3000,
        },
        location: vars.mainLocation,
        clock: vars.clock,
        weatherCities: vars.weatherCities || [],
        clockCities: vars.clockCities || [],
        theme,
    };
}

// API: Dashboard config
app.get('/api/config', (req, res) => {
    res.json(getConfig());
});

// API: Glances proxy (avoids CORS issues)
app.get('/api/glances/:endpoint', async (req, res) => {
    try {
        const glancesUrl = process.env.GLANCES_URL || 'http://localhost:61208/api/4';
        const baseUrl = glancesUrl.replace(/\/api\/\d+\/?$/, '');
        const url = `${baseUrl}/api/4/${req.params.endpoint}`;

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Weather proxy (hides API key)
app.get('/api/weather', async (req, res) => {
    try {
        const { lat, lon, units = 'metric' } = req.query;
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing WEATHER_API_KEY in .env' });
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}&lang=es`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Hydra Dashboard: http://localhost:${PORT}`);
});

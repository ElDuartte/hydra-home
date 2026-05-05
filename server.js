const express = require('express');
const path = require('path');
require('dotenv').config();
const ConfigLoader = require('./lib/config-loader');

const app = express();

// Load config at startup
const configLoader = new ConfigLoader(path.join(__dirname, 'variables.json'));
configLoader.load();
configLoader.logWarnings();

const backendConfig = configLoader.getBackendConfig();
const PORT = backendConfig.port;

// Serve static files
app.use(express.static(path.join(__dirname, 'src')));

// API: Dashboard config
app.get('/api/config', (req, res) => {
    res.json(configLoader.getFrontendConfig());
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

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}&lang=en`;
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

// API: Jellyfin proxy (avoids CORS and hides API key)
app.get('/api/jellyfin/*', async (req, res) => {
    try {
        const jellyfinUrl = process.env.JELLYFIN_URL || 'http://localhost:8096';
        const apiKey = process.env.JELLYFIN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing JELLYFIN_API_KEY in .env' });
        }

        // Extract the endpoint path after /api/jellyfin/
        const endpoint = req.params[0];
        const url = `${jellyfinUrl}/${endpoint}`;

        const headers = {
            'X-Emby-Token': apiKey,
        };

        const response = await fetch(url, { headers });
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

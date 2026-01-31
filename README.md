# Hydra Dashboard

A modern, real-time system monitoring dashboard with weather, clocks, and Docker container management.

## Features

- **System Monitoring**: Real-time CPU, RAM, disk, temperature, and network stats via Glances
- **Docker Containers**: Monitor running containers and their status
- **Weather**: Current weather for multiple cities via OpenWeatherMap
- **World Clocks**: Display time across multiple timezones
- **Customizable Theme**: Configure colors via CSS variables

## Prerequisites

- Docker and Docker Compose
- OpenWeatherMap API key (free tier: https://openweathermap.org/api)
- Ubuntu/Linux server (tested on Ubuntu)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hydra-home
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# API Keys
WEATHER_API_KEY=your_openweathermap_api_key_here

# Jellyfin Integration (optional)
JELLYFIN_URL=http://localhost:8096
JELLYFIN_WEB_URL=http://192.168.1.58:8096
JELLYFIN_API_KEY=your_jellyfin_api_key_here

# Glances API (leave as default)
GLANCES_URL=http://localhost:61208/api/4
GLANCES_UPDATE_INTERVAL=3000

# Server port (accessible on your network)
PORT=42069
```

**Important**:
- Replace `your_openweathermap_api_key_here` with your actual OpenWeatherMap API key
- For Jellyfin integration:
  - `JELLYFIN_URL`: Use `http://localhost:8096` (for server-side API calls)
  - `JELLYFIN_WEB_URL`: Use `http://YOUR_SERVER_IP:8096` (for opening in browser when you click the card)
  - Replace `your_jellyfin_api_key_here` with your Jellyfin API key

### 3. Configure Dashboard Settings

Edit `variables.json` to customize your dashboard:

```json
{
  "mainLocation": {
    "city": "Madrid",
    "country": "ES",
    "lat": 40.4168,
    "lon": -3.7038,
    "units": "metric"
  },

  "weatherCities": [
    { "name": "London", "lat": 51.5074, "lon": -0.1278 },
    { "name": "New York", "lat": 40.7128, "lon": -74.0060 }
  ],

  "clockCities": [
    { "name": "London", "timezone": "Europe/London" },
    { "name": "New York", "timezone": "America/New_York" }
  ],

  "clock": {
    "use24Hour": true,
    "showSeconds": true,
    "locale": "es-ES"
  },

  "theme": {
    "--bg-primary": "#0a0e27",
    "--bg-card": "#1a1f3a",
    "--accent-blue": "#00d4ff",
    "--accent-purple": "#b74dff"
  },

  "jellyfin": {
    "enabled": true
  }
}
```

**Configuration Options**:

- `mainLocation`: Primary location for weather display
  - Get coordinates: https://www.latlong.net/
  - Units: `metric` (Celsius) or `imperial` (Fahrenheit)

- `weatherCities`: Additional cities to display (leave empty `[]` to hide)

- `clockCities`: World clocks to display (leave empty `[]` to hide)
  - Timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

- `clock`: Main clock settings
  - `use24Hour`: `true` for 24-hour format, `false` for 12-hour AM/PM
  - `showSeconds`: Display seconds in the clock
  - `locale`: Language/region for date formatting (e.g., `en-US`, `es-ES`)

- `theme`: Custom CSS color variables (leave empty `""` to use defaults)

- `jellyfin`: Jellyfin media server integration (optional)
  - `enabled`: Set to `true` to show Jellyfin card, `false` to hide
  - Configuration is in `.env` file:
    - `JELLYFIN_URL`: Internal URL for API calls (use `http://localhost:8096` if Jellyfin is on same server)
    - `JELLYFIN_WEB_URL`: External URL for browser access (e.g., `http://192.168.1.58:8096`)
    - `JELLYFIN_API_KEY`: Your Jellyfin API key
      - To get an API key:
        1. Open Jellyfin web interface at `http://YOUR_SERVER_IP:8096`
        2. Go to Dashboard → API Keys
        3. Click "+" to create a new key
        4. Copy the key and add it to your `.env` file
  - **Note**: If Jellyfin is running as a Docker container, it will automatically be hidden from the regular Docker container list and shown in the special Jellyfin card instead, which displays both container stats (CPU, memory, uptime) and Jellyfin library information (movies, series, active streams)

### 4. Configure Firewall

Allow access to the dashboard port on your network:

```bash
sudo ufw allow 42069/tcp
```

## Running the Dashboard

### Start the Services

```bash
docker compose up -d
```

This starts two containers:
- `hydra-dashboard`: The web dashboard (port 42069)
- `hydra-glances`: System monitoring API (port 61208, internal)

### Access the Dashboard

Open a browser on any device on your local network:

```
http://<server-ip>:42069/
```

Replace `<server-ip>` with your server's IP address (e.g., `http://192.168.1.58:42069/`)

### Stop the Services

```bash
docker compose down
```

### Restart After Configuration Changes

After editing `variables.json`:

```bash
docker compose restart dashboard
```

After editing `.env` or code:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser (http://192.168.1.58:42069)   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  hydra-dashboard (Node.js + Express)    │
│  - Serves static files (HTML/CSS/JS)    │
│  - Proxies Glances API                  │
│  - Proxies Weather API                  │
│  - Port: 42069 (host network)           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  hydra-glances (Glances container)      │
│  - System monitoring API                │
│  - Port: 61208 (host network)           │
│  - Access to Docker socket              │
└─────────────────────────────────────────┘
```

**Why Host Network Mode?**

Both containers use `network_mode: host` to:
- Allow Glances to monitor the host system directly
- Avoid Docker networking complexity and CORS issues
- Simplify container-to-container communication via localhost

## Development Workflow

### WSL2 → Ubuntu Server Setup

If you develop on WSL2 and deploy to an Ubuntu server:

1. **Develop on WSL2**:
   ```bash
   # Make changes to code
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Deploy to Ubuntu Server**:
   ```bash
   # On the server
   git pull
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

**Note**: The `.env` file is gitignored (contains secrets), so you need to manually create/update it on the server.

### Testing Locally

```bash
npm install
node server.js
```

Access at `http://localhost:3000` (or your configured PORT)

## Troubleshooting

### Dashboard Shows "Loading..." Forever

**Issue**: Frontend can't reach the API.

**Solution**:
1. Check browser console for errors (F12)
2. Verify containers are running: `docker ps`
3. Check logs: `docker logs hydra-dashboard`

### Weather Not Loading

**Issue**: Invalid or missing API key.

**Solution**:
1. Verify `WEATHER_API_KEY` in `.env`
2. Test API key:
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?lat=40.4168&lon=-3.7038&appid=YOUR_KEY"
   ```

### System Stats Showing Errors

**Issue**: Glances API not accessible.

**Solution**:
1. Check Glances is running: `docker ps | grep glances`
2. Test Glances API:
   ```bash
   curl http://localhost:61208/api/4/cpu
   ```
3. Check logs: `docker logs hydra-glances`

### Can't Access from Other Devices on Network

**Issue**: Firewall blocking port 42069.

**Solution**:
```bash
sudo ufw allow 42069/tcp
sudo ufw status
```

### Docker Containers Not Showing

**Issue**: Docker socket not mounted or permissions issue.

**Solution**:
1. Verify Glances has Docker socket access (already configured in `docker-compose.yml`)
2. Check Docker is running: `systemctl status docker`

## Project Structure

```
hydra-home/
├── src/
│   ├── index.html              # Main HTML page
│   ├── css/
│   │   └── style.css          # Styles
│   └── js/
│       ├── main.js            # Entry point
│       ├── config.js          # Config loader
│       ├── api.js             # API utilities
│       ├── glances.js         # Glances API client
│       └── components/        # UI components
│           ├── Clock.js
│           ├── Weather.js
│           ├── SystemStats.js
│           ├── DockerContainers.js
│           └── WorldClocks.js
├── server.js                  # Express server
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Dashboard container
├── variables.json             # User configuration
├── .env                       # Environment secrets (gitignored)
└── package.json               # Node dependencies
```

## API Endpoints

The dashboard server exposes these endpoints:

- `GET /api/config` - Dashboard configuration
- `GET /api/weather?lat={lat}&lon={lon}&units={units}` - Weather proxy
- `GET /api/glances/{endpoint}` - Glances API proxy

## License

I'm 007 I have license To kill 🔫😎

## Stuff used

- Built with [Glances](https://github.com/nicolargo/glances) for system monitoring
- Weather data from [OpenWeatherMap](https://openweathermap.org/)

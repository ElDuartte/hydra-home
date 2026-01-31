# Quick Setup Guide

Follow these steps to get Hydra Dashboard running on your server.

## Step 1: Get an API Key

1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

## Step 2: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
nano .env  # or use your preferred editor
```

Replace `your_openweathermap_api_key_here` with your actual API key.

## Step 3: Configure Dashboard

Edit `variables.json` to set your location and preferences:

```bash
nano variables.json
```

**Minimal configuration** (just update the location):

```json
{
  "mainLocation": {
    "city": "YourCity",
    "lat": YOUR_LATITUDE,
    "lon": YOUR_LONGITUDE,
    "units": "metric"
  }
}
```

Find your coordinates at https://www.latlong.net/

## Step 4: Configure Firewall

```bash
sudo ufw allow 42069/tcp
```

## Step 5: Start the Dashboard

```bash
docker compose up -d
```

## Step 6: Access the Dashboard

Find your server's IP address:

```bash
hostname -I | awk '{print $1}'
```

Open in browser: `http://YOUR_SERVER_IP:42069/`

## Troubleshooting

**Dashboard not accessible?**
- Check containers are running: `docker ps`
- Check firewall: `sudo ufw status`
- Check logs: `docker logs hydra-dashboard`

**Weather not loading?**
- Verify API key is correct in `.env`
- Check coordinates are valid in `variables.json`

**System stats not showing?**
- Check Glances: `docker logs hydra-glances`
- Test API: `curl http://localhost:61208/api/4/cpu`

## Next Steps

See [README.md](README.md) for:
- Detailed configuration options
- Theme customization
- Development workflow
- Full troubleshooting guide

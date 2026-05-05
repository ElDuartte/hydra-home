# hydra-home

A personal server monitoring dashboard. Displays:
- Server hardware stats (CPU, memory, disk, etc.)
- Docker container stats and controls
- Time and weather for friends' locations
- Real-time updates

## Core concepts

- **Server**: The host machine running Docker containers; monitored for hardware metrics
- **Container**: A Docker service running on the server; stats visible and controllable
- **Widget**: A UI component displaying a stat (time, weather, container info, etc.)
- **Control**: User actions on containers (start, stop, restart, hard restart)

## Current scope

Real-time monitoring dashboard with read-only stats. Container controls planned as next phase.

## Tech stack

- **Backend**: Node.js + Express (see `server.js`)
- **Frontend**: HTML/CSS/JS (see `src/`)
- **Infrastructure**: Docker + Docker Compose
- **Data sources**: System APIs (hardware stats), Docker API, external services (weather, time)

## Known constraints

- Single-user project (no auth needed yet)
- Self-hosted on personal server (old laptop)
- **Resource-constrained**: minimalist refresh strategy; avoid constant polling/updates
- 24/7 uptime requirement: backend must be lightweight and efficient
- Ubuntu Server OS: no GUI, CLI-based monitoring
- Update frequency favors latency over real-time (prefer occasional snapshots over live updates)

## Future work

1. Enhanced graphs for historical stats
2. Docker container controls (restart, on/off, hard restart)
3. More data sources
4. Improved UI/UX
5. Scalability for larger deployments

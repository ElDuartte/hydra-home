/**
 * JellyfinCard Component - Displays Jellyfin server stats
 */

import { BaseComponent } from './BaseComponent.js';
import { GlancesAPI } from '../glances.js';
import { formatBytes } from '../api.js';

export class JellyfinCard extends BaseComponent {
    defaults() {
        return {
            url: 'http://localhost:8096',
            webUrl: 'http://localhost:8096',
            apiKey: '',
            glancesUrl: 'http://localhost:61208/api/3',
            updateInterval: 5000, // 5 seconds
        };
    }

    async init() {
        this.jellyfinUrl = this.options.url; // For API calls via proxy
        this.jellyfinWebUrl = this.options.webUrl; // For browser access
        this.apiKey = this.options.apiKey;
        this.glances = new GlancesAPI(this.options.glancesUrl);
        this.render();
        await this.update();
        this.startUpdates();
    }

    render() {
        this.html(`
            <div class="jellyfin-card" data-url="${this.jellyfinUrl}">
                <div class="jellyfin-header">
                    <div class="jellyfin-title">
                        <svg class="jellyfin-logo" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                            <path d="M256,16C123.452,16,16,123.452,16,256S123.452,496,256,496,496,388.548,496,256,388.548,16,256,16ZM164.08,303.924c-27.154,0-49.156-21.999-49.156-49.153s22-49.153,49.156-49.153,49.153,22,49.153,49.153S191.234,303.924,164.08,303.924Zm183.84,0c-27.157,0-49.156-21.999-49.156-49.153s22-49.153,49.156-49.153S397.076,227.617,397.076,254.771,375.077,303.924,347.92,303.924Z" fill="#00a4dc"/>
                        </svg>
                        <span class="jellyfin-name">Jellyfin</span>
                    </div>
                    <div class="jellyfin-status" data-status>
                        <span class="status-dot"></span>
                        <span class="status-text">Connecting...</span>
                    </div>
                </div>
                <div class="jellyfin-content">
                    <div class="jellyfin-loading">Loading...</div>
                </div>
            </div>
        `);

        // Card is not clickable - removed click handler
    }

    async update() {
        try {
            const [systemInfo, sessions, itemCounts, containerData] = await Promise.all([
                this.fetchJellyfin('/System/Info'),
                this.fetchJellyfin('/Sessions'),
                this.fetchJellyfin('/Items/Counts'),
                this.fetchContainerStats(),
            ]);

            this.updateStatus(true);
            this.renderContent({ systemInfo, sessions, itemCounts, containerData });
        } catch (error) {
            console.error('Jellyfin API error:', error);
            this.updateStatus(false);
            this.renderError(error.message);
        }
    }

    async fetchContainerStats() {
        try {
            const containers = await this.glances.getDocker();
            if (!containers) return null;

            // Find Jellyfin container
            const jellyfinContainer = containers.find(c => {
                const name = (c.name || '').toLowerCase();
                return name.includes('jellyfin');
            });

            return jellyfinContainer || null;
        } catch (error) {
            console.error('Failed to fetch container stats:', error);
            return null;
        }
    }

    async fetchJellyfin(endpoint) {
        // Use server proxy to avoid CORS issues
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = `/api/jellyfin/${cleanEndpoint}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    }

    updateStatus(isOnline) {
        const statusEl = this.$('[data-status]');
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('.status-text');

        if (isOnline) {
            dot.className = 'status-dot online';
            text.textContent = 'Online';
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Offline';
        }
    }

    renderContent({ systemInfo, sessions, itemCounts, containerData }) {
        const activeSessions = sessions.filter(s => s.NowPlayingItem);
        const activeStreams = activeSessions.length;

        // System info
        const serverName = systemInfo.ServerName || 'Jellyfin';
        const version = systemInfo.Version || 'Unknown';

        // Item counts
        const movieCount = itemCounts.MovieCount || 0;
        const seriesCount = itemCounts.SeriesCount || 0;
        const episodeCount = itemCounts.EpisodeCount || 0;
        const songCount = itemCounts.SongCount || 0;
        const albumCount = itemCounts.AlbumCount || 0;

        // Container stats (from Glances)
        let containerStatsHtml = '';
        if (containerData) {
            const cpu = containerData.cpu?.total?.toFixed(1) || '0.0';
            const mem = formatBytes(containerData.memory?.usage || 0);
            const uptime = containerData.uptime || '--';
            const status = containerData.status || containerData.Status;
            const isRunning = status === 'running';

            containerStatsHtml = `
                <div class="jellyfin-container-stats">
                    <div class="container-stat-item">
                        <span class="stat-icon">⚡</span>
                        <div class="stat-info">
                            <span class="stat-label">CPU</span>
                            <span class="stat-value">${cpu}%</span>
                        </div>
                    </div>
                    <div class="container-stat-item">
                        <span class="stat-icon">💾</span>
                        <div class="stat-info">
                            <span class="stat-label">Memory</span>
                            <span class="stat-value">${mem}</span>
                        </div>
                    </div>
                    <div class="container-stat-item">
                        <span class="stat-icon">⏱️</span>
                        <div class="stat-info">
                            <span class="stat-label">Uptime</span>
                            <span class="stat-value">${uptime}</span>
                        </div>
                    </div>
                    <div class="container-stat-item">
                        <span class="stat-icon">${isRunning ? '🟢' : '🔴'}</span>
                        <div class="stat-info">
                            <span class="stat-label">Status</span>
                            <span class="stat-value">${status}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        let nowPlayingHtml = '';
        if (activeStreams > 0) {
            nowPlayingHtml = `
                <div class="jellyfin-section">
                    <div class="jellyfin-section-title">🎬 Now Playing (${activeStreams})</div>
                    ${activeSessions.map(s => this.renderSession(s)).join('')}
                </div>
            `;
        }

        const content = `
            ${containerStatsHtml}

            <div class="jellyfin-stats">
                <div class="jellyfin-stat">🎬 ${movieCount.toLocaleString()}</div>
                <div class="jellyfin-stat">📺 ${seriesCount.toLocaleString()}</div>
                <div class="jellyfin-stat">🎵 ${songCount.toLocaleString()}</div>
                <div class="jellyfin-stat">💿 ${albumCount.toLocaleString()}</div>
            </div>

            ${nowPlayingHtml}

            <div class="jellyfin-info">
                <div class="jellyfin-info-item">
                    <span class="info-label">Server:</span>
                    <span class="info-value">${this.escape(serverName)}</span>
                </div>
                <div class="jellyfin-info-item">
                    <span class="info-label">Version:</span>
                    <span class="info-value">${this.escape(version)}</span>
                </div>
                <div class="jellyfin-info-item">
                    <span class="info-label">Episodes:</span>
                    <span class="info-value">${episodeCount.toLocaleString()}</span>
                </div>
            </div>
        `;

        this.$('.jellyfin-content').innerHTML = content;
    }

    renderSession(session) {
        const item = session.NowPlayingItem;
        const userName = session.UserName || 'Unknown';
        const deviceName = session.DeviceName || 'Unknown Device';
        const itemName = item.Name || 'Unknown';
        const itemType = item.Type || '';

        let progress = '';
        if (item.RunTimeTicks && session.PlayState?.PositionTicks) {
            const percent = Math.round((session.PlayState.PositionTicks / item.RunTimeTicks) * 100);
            progress = `
                <div class="playback-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="progress-text">${percent}%</span>
                </div>
            `;
        }

        let metadata = '';
        if (itemType === 'Episode') {
            const series = item.SeriesName || '';
            const season = item.ParentIndexNumber || 0;
            const episode = item.IndexNumber || 0;
            metadata = `<div class="session-metadata">${series} - S${season}E${episode}</div>`;
        } else if (item.ProductionYear) {
            metadata = `<div class="session-metadata">${item.ProductionYear}</div>`;
        }

        return `
            <div class="jellyfin-session">
                <div class="session-header">
                    <span class="session-user">👤 ${this.escape(userName)}</span>
                    <span class="session-device">📱 ${this.escape(deviceName)}</span>
                </div>
                <div class="session-title">${this.escape(itemName)}</div>
                ${metadata}
                ${progress}
            </div>
        `;
    }

    renderError(message) {
        this.$('.jellyfin-content').innerHTML = `
            <div class="jellyfin-error">
                <span class="error-icon">⚠️</span>
                <span class="error-message">Error: ${this.escape(message)}</span>
            </div>
        `;
    }

    escape(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

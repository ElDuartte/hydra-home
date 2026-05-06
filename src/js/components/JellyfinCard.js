/**
 * JellyfinCard Component - Displays Jellyfin server stats
 * Uses centralized GlancesPoller for container stats; keeps Jellyfin API polling separate.
 */

import { BaseComponent } from './BaseComponent.js';
import { formatBytes } from '../format.js';
import { normalizeContainersPayload, findJellyfinContainer, extractContainerStats } from '../transforms.js';
import { fetchJellyfin } from '../jellyfin-api.js';

export class JellyfinCard extends BaseComponent {
    defaults() {
        return {
            url: 'http://localhost:8096',
            webUrl: 'http://localhost:8096',
            apiKey: '',
            glancesPoller: null,
            updateInterval: 5000, // 5 seconds
        };
    }

    async init() {
        this.jellyfinUrl = this.options.url; // For API calls via proxy
        this.jellyfinWebUrl = this.options.webUrl; // For browser access
        this.apiKey = this.options.apiKey;
        this.glancesPoller = this.options.glancesPoller;

        // Cache for data
        this.jellyfinData = null;
        this.containerData = null;

        this.render();

        // Subscribe to containers via poller
        this.trackSubscription(this.glancesPoller.subscribe('containers', (data) => {
            this.containerData = data;
            this.updateRenderedContent();
        }, 3000));

        // Fetch initial Jellyfin data and start polling it
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
            const [systemInfo, itemCounts] = await Promise.all([
                fetchJellyfin('/System/Info'),
                fetchJellyfin('/Items/Counts'),
            ]);

            this.jellyfinData = { systemInfo, itemCounts };
            this.updateStatus(true);
            this.updateRenderedContent();
        } catch (error) {
            console.error('Jellyfin API error:', error);
            this.updateStatus(false);
            this.renderError(error.message);
        }
    }

    /**
     * Re-render when either Jellyfin data or container data arrives.
     */
    updateRenderedContent() {
        if (this.jellyfinData) {
            let containerData = null;
            if (this.containerData) {
                const containers = normalizeContainersPayload(this.containerData);
                containerData = findJellyfinContainer(containers);
            }

            this.renderContent({
                systemInfo: this.jellyfinData.systemInfo,
                itemCounts: this.jellyfinData.itemCounts,
                containerData,
            });
        }
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

    renderContent({ systemInfo, itemCounts, containerData }) {
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
            const stats = extractContainerStats(containerData);
            const mem = formatBytes(stats.mem);
            const uptime = stats.uptime || '--';
            const status = containerData.status || containerData.Status;
            const isRunning = status === 'running';

            containerStatsHtml = `
                <div class="jellyfin-container-stats">
                    <div class="container-stat-item">
                        <span class="stat-icon">⚡</span>
                        <div class="stat-info">
                            <span class="stat-label">CPU</span>
                            <span class="stat-value">${stats.cpu}%</span>
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

        const content = `
            ${containerStatsHtml}

            <div class="jellyfin-stats">
                <div class="jellyfin-stat">🎬 ${movieCount.toLocaleString()}</div>
                <div class="jellyfin-stat">📺 ${seriesCount.toLocaleString()}</div>
                <div class="jellyfin-stat">🎵 ${songCount.toLocaleString()}</div>
                <div class="jellyfin-stat">💿 ${albumCount.toLocaleString()}</div>
            </div>

            <div class="jellyfin-info-cards">
                <div class="jellyfin-info-card">
                    <span class="info-label">Server:</span>
                    <span class="info-value">${this.escape(serverName)}</span>
                </div>
                <div class="jellyfin-info-card">
                    <span class="info-label">Version:</span>
                    <span class="info-value">${this.escape(version)}</span>
                </div>
                <div class="jellyfin-info-card">
                    <span class="info-label">Episodes:</span>
                    <span class="info-value">${episodeCount.toLocaleString()}</span>
                </div>
            </div>
        `;

        this.$('.jellyfin-content').innerHTML = content;
    }

    renderError(message) {
        this.$('.jellyfin-content').innerHTML = `
            <div class="jellyfin-error">
                <span class="error-icon">⚠️</span>
                <span class="error-message">Error: ${this.escape(message)}</span>
            </div>
        `;
    }

    destroy() {
        super.destroy();
    }
}

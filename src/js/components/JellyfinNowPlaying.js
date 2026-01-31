/**
 * JellyfinNowPlaying Component - Displays only active Jellyfin sessions
 */

import { BaseComponent } from './BaseComponent.js';

export class JellyfinNowPlaying extends BaseComponent {
    defaults() {
        return {
            updateInterval: 5000, // 5 seconds
        };
    }

    async init() {
        this.render();
        await this.update();
        this.startUpdates();
    }

    render() {
        this.html('<div class="now-playing-loading">Loading...</div>');
    }

    async update() {
        try {
            const sessions = await this.fetchJellyfin('/Sessions');
            this.renderSessions(sessions);
        } catch (error) {
            console.error('Jellyfin API error:', error);
            this.renderError();
        }
    }

    async fetchJellyfin(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = `/api/jellyfin/${cleanEndpoint}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    }

    renderSessions(sessions) {
        const activeSessions = sessions.filter(s => s.NowPlayingItem);

        if (activeSessions.length === 0) {
            this.html(`
                <div class="now-playing-empty">
                    <span class="empty-icon">🎬</span>
                    <span class="empty-text">No active streams</span>
                </div>
            `);
            return;
        }

        const html = `
            <div class="now-playing-header">
                <span class="now-playing-title">🎬 Now Playing (${activeSessions.length})</span>
            </div>
            <div class="now-playing-sessions">
                ${activeSessions.map(s => this.renderSession(s)).join('')}
            </div>
        `;

        this.html(html);
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
            <div class="now-playing-session">
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

    renderError() {
        this.html(`
            <div class="now-playing-error">
                <span class="error-icon">⚠️</span>
                <span class="error-message">Unable to load Jellyfin data</span>
            </div>
        `);
    }

    escape(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

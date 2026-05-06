/**
 * JellyfinNowPlaying Component - Displays only active Jellyfin sessions
 */

import { BaseComponent } from './BaseComponent.js';
import { filterActiveSessions, calcPlaybackPercent, buildSessionMetadata } from '../transforms.js';
import { fetchJellyfin } from '../jellyfin-api.js';

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
            const sessions = await fetchJellyfin('/Sessions');
            this.renderSessions(sessions);
        } catch (error) {
            console.error('Jellyfin API error:', error);
            this.renderError();
        }
    }

    renderSessions(sessions) {
        const activeSessions = filterActiveSessions(sessions);

        // Hide the component if nothing is playing
        if (activeSessions.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        // Show the component if there are active sessions
        this.container.style.display = 'block';

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

        let progress = '';
        const percent = calcPlaybackPercent(session.PlayState?.PositionTicks, item.RunTimeTicks);
        if (percent !== null) {
            progress = `
                <div class="playback-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="progress-text">${percent}%</span>
                </div>
            `;
        }

        const metaText = buildSessionMetadata(item);
        const metadata = metaText ? `<div class="session-metadata">${metaText}</div>` : '';

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

}

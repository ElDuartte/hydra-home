/**
 * DockerContainers Component - Docker container list via Glances
 */

import { BaseComponent } from './BaseComponent.js';
import { GlancesAPI } from '../glances.js';
import { formatBytes } from '../api.js';

export class DockerContainers extends BaseComponent {
    defaults() {
        return {
            glancesUrl: 'http://localhost:61208/api/3',
            updateInterval: 3000,
        };
    }

    async init() {
        this.glances = new GlancesAPI(this.options.glancesUrl);
        this.html('<div class="loading">Loading containers...</div>');
        await this.update();
        this.startUpdates();
    }

    async update() {
        const data = await this.glances.getDocker();

        if (!data) {
            this.renderError();
            return;
        }

        this.renderContainers(data);
    }

    renderContainers(data) {
        // Handle both API v3 (data.containers) and v4 (data is array) formats
        const containers = Array.isArray(data) ? data : (data.containers || []);

        if (containers.length === 0) {
            this.html(`
                <div class="no-containers">
                    <span class="no-containers-icon">📦</span>
                    <span>No active containers</span>
                </div>
            `);
            return;
        }

        // Sort: running first, then by name
        const sorted = containers.sort((a, b) => {
            if (a.Status === 'running' && b.Status !== 'running') return -1;
            if (b.Status === 'running' && a.Status !== 'running') return 1;
            return a.name.localeCompare(b.name);
        });

        const html = sorted.map(c => this.renderContainer(c)).join('');

        this.html(`
            <div class="containers-header">
                <span class="containers-count">${containers.length} container${containers.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="containers-list">${html}</div>
        `);
    }

    renderContainer(c) {
        const isRunning = c.Status === 'running';
        const statusIcon = isRunning ? '🟢' : '🔴';
        const image = c.Image?.split(':')[0]?.split('/').pop() || 'unknown';

        if (!isRunning) {
            return `
                <div class="container-card stopped">
                    <div class="container-header">
                        <span class="container-status">${statusIcon}</span>
                        <span class="container-name">${this.escape(c.name)}</span>
                    </div>
                    <div class="container-image">${this.escape(image)}</div>
                    <div class="container-stopped-label">Stopped</div>
                </div>
            `;
        }

        const cpu = c.cpu?.total?.toFixed(1) || '0.0';
        const mem = formatBytes(c.memory?.usage || 0);
        const uptime = this.formatUptime(c.Uptime);

        return `
            <div class="container-card running">
                <div class="container-header">
                    <span class="container-status">${statusIcon}</span>
                    <span class="container-name">${this.escape(c.name)}</span>
                </div>
                <div class="container-image">${this.escape(image)}</div>
                <div class="container-stats">
                    <div class="container-stat"><span class="stat-icon">⚡</span> ${cpu}%</div>
                    <div class="container-stat"><span class="stat-icon">💾</span> ${mem}</div>
                    <div class="container-stat"><span class="stat-icon">⏱️</span> ${uptime}</div>
                </div>
            </div>
        `;
    }

    renderError() {
        this.html(`
            <div class="docker-error">
                <span class="error-icon">⚠️</span>
                <span>Cannot connect to Glances</span>
                <button class="retry-btn" onclick="this.closest('.docker-containers').dispatchEvent(new CustomEvent('retry'))">
                    🔄 Retry
                </button>
            </div>
        `);
        this.container.addEventListener('retry', () => this.update(), { once: true });
    }

    formatUptime(seconds) {
        if (!seconds) return '--';
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

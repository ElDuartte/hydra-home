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
            const aStatus = a.Status || a.status;
            const bStatus = b.Status || b.status;
            if (aStatus === 'running' && bStatus !== 'running') return -1;
            if (bStatus === 'running' && aStatus !== 'running') return 1;
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
        const status = c.Status || c.status;
        const isRunning = status === 'running';
        const statusIcon = isRunning ? '🟢' : '🔴';

        // Handle both string and array format for image
        let imageRaw = c.Image || c.image || 'unknown';
        if (Array.isArray(imageRaw)) imageRaw = imageRaw[0] || 'unknown';
        const image = imageRaw.split(':')[0].split('/').pop();

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
        const uptime = c.uptime || this.formatUptime(c.Uptime);

        // I/O rates
        const io = c.io || {};
        const ioRead = this.formatIORate(io.ior || 0);
        const ioWrite = this.formatIORate(io.iow || 0);

        // Container ID (shortened)
        const shortId = (c.id || '').substring(0, 12);

        // Ports
        const ports = c.ports || '';

        let statsHtml = `
            <div class="container-stat"><span class="stat-icon">⚡</span> ${cpu}%</div>
            <div class="container-stat"><span class="stat-icon">💾</span> ${mem}</div>
            <div class="container-stat"><span class="stat-icon">⏱️</span> ${uptime}</div>
        `;

        // Add I/O if available
        if (io.ior !== undefined || io.iow !== undefined) {
            statsHtml += `
                <div class="container-stat"><span class="stat-icon">📥</span> ${ioRead}</div>
                <div class="container-stat"><span class="stat-icon">📤</span> ${ioWrite}</div>
            `;
        }

        let metaHtml = '';
        if (shortId || ports) {
            metaHtml = '<div class="container-meta">';
            if (shortId) {
                metaHtml += `<span class="container-id" title="${this.escape(c.id || '')}">${this.escape(shortId)}</span>`;
            }
            if (ports) {
                metaHtml += `<span class="container-ports">${this.escape(ports)}</span>`;
            }
            metaHtml += '</div>';
        }

        return `
            <div class="container-card running">
                <div class="container-header">
                    <span class="container-status">${statusIcon}</span>
                    <span class="container-name">${this.escape(c.name)}</span>
                </div>
                <div class="container-image">${this.escape(image)}</div>
                <div class="container-stats">
                    ${statsHtml}
                </div>
                ${metaHtml}
            </div>
        `;
    }

    formatIORate(bytesPerSec) {
        if (!bytesPerSec) return '0 B/s';
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let i = 0;
        while (bytesPerSec >= 1024 && i < units.length - 1) {
            bytesPerSec /= 1024;
            i++;
        }
        return `${bytesPerSec.toFixed(1)} ${units[i]}`;
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

/**
 * DockerContainers Component - Docker container list via Glances
 * Uses centralized GlancesPoller for efficient, deduplicated polling.
 */

import { BaseComponent } from './BaseComponent.js';
import { formatBytes, formatBytesPerSec, formatUptime } from '../format.js';
import { normalizeContainersPayload, filterJellyfinContainers, sortContainersByStatus, normalizeImageName, extractContainerStats } from '../transforms.js';

export class DockerContainers extends BaseComponent {
    defaults() {
        return {
            glancesPoller: null,
            updateInterval: 3000,
        };
    }

    async init() {
        const poller = this.options.glancesPoller;
        this.html('<div class="loading">Loading containers...</div>');

        // Subscribe to containers endpoint with the centralized poller
        this.trackSubscription(poller.subscribe('containers', (data) => {
            if (data) {
                this.renderContainers(data);
            } else {
                this.renderError();
            }
        }, this.options.updateInterval));
    }

    renderContainers(data) {
        let containers = normalizeContainersPayload(data);
        containers = filterJellyfinContainers(containers);

        if (containers.length === 0) {
            this.html(`
                <div class="no-containers">
                    <span class="no-containers-icon">📦</span>
                    <span>No active containers</span>
                </div>
            `);
            return;
        }

        const sorted = sortContainersByStatus(containers);
        const html = sorted.map(c => this.renderContainer(c)).join('');

        this.html(`
            <div class="containers-header">
                <h2 class="section-title">🐳 Docker</h2>
                <span class="containers-count">${containers.length} container${containers.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="containers-list">${html}</div>
        `);
    }

    renderContainer(c) {
        const status = c.Status || c.status;
        const isRunning = status === 'running';
        const statusIcon = isRunning ? '🟢' : '🔴';

        const image = normalizeImageName(c.Image || c.image || 'unknown');
        const shortId = (c.id || '').substring(0, 12);
        const imageWithId = shortId ? `${image} - ${shortId}` : image;

        if (!isRunning) {
            return `
                <div class="container-card stopped">
                    <div class="container-header">
                        <span class="container-status">${statusIcon}</span>
                        <span class="container-name">${this.escape(c.name)}</span>
                    </div>
                    <div class="container-image" title="${this.escape(c.id || '')}">${this.escape(imageWithId)}</div>
                    <div class="container-stopped-label">Stopped</div>
                </div>
            `;
        }

        const stats = extractContainerStats(c);
        const mem = formatBytes(stats.mem);
        const uptime = stats.uptime || formatUptime(stats.uptimeSecs);

        // I/O rates
        const io = c.io || {};
        const ioRead = formatBytesPerSec(io.ior || 0);
        const ioWrite = formatBytesPerSec(io.iow || 0);

        // Ports
        const ports = c.ports || '';

        let statsHtml = `
            <div class="container-stat"><span class="stat-icon">⚡</span> ${stats.cpu}%</div>
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
        if (ports) {
            const portLinks = this.createPortLinks(ports);
            metaHtml = `<div class="container-meta">${portLinks}</div>`;
        }

        return `
            <div class="container-card running">
                <div class="container-header">
                    <span class="container-status">${statusIcon}</span>
                    <span class="container-name">${this.escape(c.name)}</span>
                </div>
                <div class="container-image" title="${this.escape(c.id || '')}">${this.escape(imageWithId)}</div>
                <div class="container-stats">
                    ${statsHtml}
                </div>
                ${metaHtml}
            </div>
        `;
    }

    createPortLinks(portsStr) {
        if (!portsStr) return '';

        const getHostIP = () => {
            const host = window.location.hostname;
            return host === 'localhost' || host === '127.0.0.1' ? 'localhost' : host;
        };

        const hostIP = getHostIP();
        const portMappings = portsStr.split(', ');

        return portMappings.map(mapping => {
            const [hostPort] = mapping.split(':');
            if (!hostPort) return this.escape(mapping);

            const url = `http://${hostIP}:${hostPort.trim()}/`;
            return `<a href="${this.escape(url)}" target="_blank" rel="noopener noreferrer" class="container-port-link">${this.escape(mapping)}</a>`;
        }).join(', ');
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

    destroy() {
        super.destroy();
    }
}

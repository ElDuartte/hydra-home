/**
 * SystemStats Component - System statistics via Glances API
 * Uses centralized GlancesPoller for efficient, deduplicated polling.
 */

import { BaseComponent } from './BaseComponent.js';
import { formatBytes, formatBytesPerSec, calcPercent } from '../format.js';
import { deduplicateDisksByDevice, getDiskDisplayName, filterTemperatureSensors, classifyTemp, filterNetworkInterfaces, coalesceNetworkRate } from '../transforms.js';

export class SystemStats extends BaseComponent {
    defaults() {
        return {
            glancesPoller: null,
            updateInterval: 3000,
        };
    }

    async init() {
        this.glancesPoller = this.options.glancesPoller;

        this.render();

        // Subscribe to Glances endpoints with the centralized poller
        // Each subscription specifies its own interval
        this.trackSubscription(
            this.glancesPoller.subscribe('cpu', (data) => {
                if (data) this.updateCpu(data);
            }, this.options.intervals?.cpuMs || 2000)
        );

        this.trackSubscription(
            this.glancesPoller.subscribe('mem', (data) => {
                if (data) this.updateRam(data);
            }, this.options.intervals?.memMs || 1000)
        );

        this.trackSubscription(
            this.glancesPoller.subscribe('sensors', (data) => {
                if (data) this.updateTemps(data);
            }, this.options.intervals?.memMs || 1000)
        );

        this.trackSubscription(
            this.glancesPoller.subscribe('fs', (data) => {
                if (data) this.updateDisks(data);
            }, this.options.intervals?.diskMs || 3600000)
        );

        this.trackSubscription(
            this.glancesPoller.subscribe('network', (data) => {
                if (data) this.updateNetwork(data);
            }, this.options.intervals?.glancesDefaultMs || 3000)
        );

        this.trackSubscription(
            this.glancesPoller.subscribe('gpu', (data) => {
                if (data?.length > 0) this.updateGpu(data);
            }, this.options.intervals?.glancesDefaultMs || 3000)
        );
    }

    destroy() {
        super.destroy();
    }

    render() {
        this.html(`
            <div class="stat-card" id="cpu-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">⚡</span> CPU</span>
                    <span class="stat-value" data-cpu-value>--%</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill cpu" data-cpu-bar></div></div>
                <div class="stat-details" data-cpu-details></div>
            </div>

            <div class="stat-card" id="ram-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">💾</span> RAM</span>
                    <span class="stat-value" data-ram-value>--%</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill ram" data-ram-bar></div></div>
                <div class="stat-details" data-ram-details></div>
            </div>

            <div class="stat-card" id="disk-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">💿</span> Disks</span>
                </div>
                <div class="disk-list" data-disk-list></div>
            </div>

            <div class="stat-card" id="temp-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">🌡️</span> Temperatures</span>
                </div>
                <div class="temp-list" data-temp-list></div>
            </div>

            <div class="stat-card" id="gpu-card" style="display:none;">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">🎮</span> GPU</span>
                    <span class="stat-value" data-gpu-value>--%</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill gpu" data-gpu-bar></div></div>
                <div class="stat-details" data-gpu-details></div>
            </div>

            <div class="stat-card" id="network-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">📡</span> Network</span>
                </div>
                <div class="network-list" data-network-list></div>
            </div>
        `);
    }

    updateCpu(data) {
        const percent = Math.round(data.total || 0);
        this.$('[data-cpu-value]').textContent = `${percent}%`;
        this.$('[data-cpu-bar]').style.width = `${percent}%`;
        this.$('[data-cpu-bar]').classList.toggle('warning', percent > (this.options.thresholds?.cpuWarning ?? 80));

        const details = [];
        if (data.user) details.push(`User: ${data.user.toFixed(1)}%`);
        if (data.system) details.push(`Sys: ${data.system.toFixed(1)}%`);
        if (data.cpucore) details.push(`${data.cpucore} cores`);
        this.$('[data-cpu-details]').textContent = details.join(' | ');
    }

    updateRam(data) {
        const usedBytes = data.total - (data.available || data.free || 0);
        const percent = calcPercent(usedBytes, data.total);

        this.$('[data-ram-value]').textContent = `${percent}%`;
        this.$('[data-ram-bar]').style.width = `${percent}%`;
        this.$('[data-ram-bar]').classList.toggle('warning', percent > (this.options.thresholds?.ramWarning ?? 85));
        this.$('[data-ram-details]').textContent = `${formatBytes(usedBytes)} / ${formatBytes(data.total)}`;
    }

    updateDisks(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.$('[data-disk-list]').innerHTML = '<div class="no-data">No disks</div>';
            return;
        }

        const uniqueDisks = deduplicateDisksByDevice(data);

        // Calculate combined disk usage
        let totalSpace = 0;
        let totalUsed = 0;
        uniqueDisks.forEach(d => {
            totalSpace += d.size || d.total || 0;
            totalUsed += d.used || 0;
        });
        const combinedPercent = calcPercent(totalUsed, totalSpace);

        // Update disk card header with combined usage
        const diskCard = this.$('#disk-card');
        const header = diskCard.querySelector('.stat-header');

        // Add or update the combined percentage value
        let valueSpan = header.querySelector('.stat-value');
        if (!valueSpan) {
            valueSpan = document.createElement('span');
            valueSpan.className = 'stat-value';
            valueSpan.setAttribute('data-disk-value', '');
            header.appendChild(valueSpan);
        }
        valueSpan.textContent = `${combinedPercent}%`;

        const html = uniqueDisks
            .map((d, index) => {
                const mount = d.mnt_point || d.mountpoint || '';
                const device = d.device_name || '';
                const total = d.size || d.total || 0;
                const used = d.used || 0;
                const percent = calcPercent(used, total);
                const diskName = getDiskDisplayName(mount, device, index);

                return `
                    <div class="disk-item">
                        <div class="disk-header">
                            <span class="disk-mount">${diskName}</span>
                            <span class="disk-usage">${formatBytes(used)} / ${formatBytes(total)}</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill disk ${percent > (this.options.thresholds?.diskWarning ?? 85) ? 'warning' : ''}" style="width:${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

        this.$('[data-disk-list]').innerHTML = html || '<div class="no-data">No disks</div>';
    }

    updateTemps(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.$('[data-temp-list]').innerHTML = '<div class="no-data">No sensors</div>';
            return;
        }

        const temps = filterTemperatureSensors(data);

        if (temps.length === 0) {
            this.$('[data-temp-list]').innerHTML = '<div class="no-data">No sensors</div>';
            return;
        }

        const tempWarning = this.options.thresholds?.tempWarning ?? 70;
        const tempCritical = this.options.thresholds?.tempCritical ?? 85;

        const html = temps.map(s => {
            const temp = Math.round(s.value || 0);
            const cls = classifyTemp(temp, tempWarning, tempCritical);
            return `
                <div class="temp-item ${cls}">
                    <span class="temp-label">${s.label || s.name || 'Sensor'}</span>
                    <span class="temp-value">${temp}°C</span>
                </div>
            `;
        }).join('');

        this.$('[data-temp-list]').innerHTML = html;
    }

    updateGpu(data) {
        this.$('#gpu-card').style.display = 'block';
        const gpu = data[0];
        const percent = Math.round(gpu.proc || gpu.gpu_usage || 0);

        this.$('[data-gpu-value]').textContent = `${percent}%`;
        this.$('[data-gpu-bar]').style.width = `${percent}%`;

        const details = [];
        if (gpu.name) details.push(gpu.name);
        if (gpu.temperature) details.push(`${gpu.temperature}°C`);
        if (gpu.mem) details.push(`VRAM: ${gpu.mem}%`);
        this.$('[data-gpu-details]').textContent = details.join(' | ');
    }

    updateNetwork(data) {
        const interfaces = filterNetworkInterfaces(data);

        if (interfaces.length === 0) {
            this.$('[data-network-list]').innerHTML = '<div class="no-data">No interfaces</div>';
            return;
        }

        const html = interfaces.map(i => {
            const rx = formatBytesPerSec(coalesceNetworkRate(i, 'rx'));
            const tx = formatBytesPerSec(coalesceNetworkRate(i, 'tx'));
            return `
                <div class="network-item">
                    <span class="network-name">${i.interface_name}</span>
                    <div class="network-speeds">
                        <span class="network-rx">↓ ${rx}</span>
                        <span class="network-tx">↑ ${tx}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.$('[data-network-list]').innerHTML = html;
    }
}

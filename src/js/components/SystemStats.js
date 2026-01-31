/**
 * SystemStats Component - System statistics via Glances API
 */

import { BaseComponent } from './BaseComponent.js';
import { GlancesAPI } from '../glances.js';
import { formatBytes } from '../api.js';

export class SystemStats extends BaseComponent {
    defaults() {
        return {
            glancesUrl: 'http://localhost:61208/api/3',
            updateInterval: 3000,
        };
    }

    async init() {
        this.glances = new GlancesAPI(this.options.glancesUrl);
        this.intervals = [];
        this.render();
        await this.update();
        this.startUpdates();
    }

    async update() {
        // Initial load - fetch all data immediately
        const [cpu, mem, fs, sensors, gpu, network] = await Promise.all([
            this.glances.getCpu(),
            this.glances.getMem(),
            this.glances.getFs(),
            this.glances.getSensors(),
            this.glances.getGpu(),
            this.glances.getNetwork(),
        ]);

        if (cpu) this.updateCpu(cpu);
        if (mem) this.updateRam(mem);
        if (fs) this.updateDisks(fs);
        if (sensors) this.updateTemps(sensors);
        if (gpu?.length > 0) this.updateGpu(gpu);
        if (network) this.updateNetwork(network);
    }

    startUpdates() {
        // Different update intervals for each metric
        // CPU: every 2 seconds (smooth updates)
        this.intervals.push(setInterval(async () => {
            const cpu = await this.glances.getCpu();
            if (cpu) this.updateCpu(cpu);
        }, 2000));

        // RAM: every 1 second
        this.intervals.push(setInterval(async () => {
            const mem = await this.glances.getMem();
            if (mem) this.updateRam(mem);
        }, 1000));

        // Temperatures: every 1 second
        this.intervals.push(setInterval(async () => {
            const sensors = await this.glances.getSensors();
            if (sensors) this.updateTemps(sensors);
        }, 1000));

        // Disks: every 1 hour
        this.intervals.push(setInterval(async () => {
            const fs = await this.glances.getFs();
            if (fs) this.updateDisks(fs);
        }, 3600000));

        // Network & GPU: every 3 seconds (fast)
        this.intervals.push(setInterval(async () => {
            const [network, gpu] = await Promise.all([
                this.glances.getNetwork(),
                this.glances.getGpu(),
            ]);
            if (network) this.updateNetwork(network);
            if (gpu?.length > 0) this.updateGpu(gpu);
        }, 3000));
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
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
        this.$('[data-cpu-bar]').classList.toggle('warning', percent > 80);

        const details = [];
        if (data.user) details.push(`User: ${data.user.toFixed(1)}%`);
        if (data.system) details.push(`Sys: ${data.system.toFixed(1)}%`);
        if (data.cpucore) details.push(`${data.cpucore} cores`);
        this.$('[data-cpu-details]').textContent = details.join(' | ');
    }

    updateRam(data) {
        const usedBytes = data.total - (data.available || data.free || 0);
        const percent = data.total > 0 ? Math.round((usedBytes / data.total) * 100) : 0;

        this.$('[data-ram-value]').textContent = `${percent}%`;
        this.$('[data-ram-bar]').style.width = `${percent}%`;
        this.$('[data-ram-bar]').classList.toggle('warning', percent > 85);
        this.$('[data-ram-details]').textContent = `${formatBytes(usedBytes)} / ${formatBytes(data.total)}`;
    }

    updateDisks(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.$('[data-disk-list]').innerHTML = '<div class="no-data">No disks</div>';
            return;
        }

        // Group by device to show only one entry per physical disk
        // This avoids showing multiple bind mounts from Docker containers
        const deviceMap = new Map();
        data.forEach(d => {
            const device = d.device_name;
            // Keep only the first mount for each unique device
            if (device && !deviceMap.has(device)) {
                deviceMap.set(device, d);
            }
        });

        const uniqueDisks = Array.from(deviceMap.values());

        // Calculate combined disk usage
        let totalSpace = 0;
        let totalUsed = 0;
        uniqueDisks.forEach(d => {
            totalSpace += d.size || d.total || 0;
            totalUsed += d.used || 0;
        });
        const combinedPercent = totalSpace > 0 ? Math.round((totalUsed / totalSpace) * 100) : 0;

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
                const percent = total > 0 ? Math.round((used / total) * 100) : 0;

                // Generate a friendly disk name
                let diskName;
                if (mount === '/' || mount === '') {
                    // Primary/root filesystem
                    diskName = 'System Drive';
                } else if (mount.startsWith('/home')) {
                    diskName = 'Home';
                } else if (mount.startsWith('/mnt/')) {
                    // Extract mount name from /mnt/xxx
                    diskName = mount.split('/')[2] || 'Drive';
                } else {
                    // Extract device name from path (e.g., /dev/sda2 -> sda2)
                    const deviceMatch = device.match(/\/dev\/(.+)$/);
                    diskName = deviceMatch ? deviceMatch[1].toUpperCase() : `Drive ${index + 1}`;
                }

                return `
                    <div class="disk-item">
                        <div class="disk-header">
                            <span class="disk-mount">${diskName}</span>
                            <span class="disk-usage">${formatBytes(used)} / ${formatBytes(total)}</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill disk ${percent > 85 ? 'warning' : ''}" style="width:${percent}%"></div>
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

        const temps = data.filter(s => {
            const type = (s.type || '').toLowerCase();
            const unit = (s.unit || '').toLowerCase();
            return type.includes('temperature') || unit === 'c' || unit === '°c';
        });

        if (temps.length === 0) {
            this.$('[data-temp-list]').innerHTML = '<div class="no-data">No sensors</div>';
            return;
        }

        const html = temps.map(s => {
            const temp = Math.round(s.value || 0);
            const cls = temp > 85 ? 'critical' : temp > 70 ? 'warning' : '';
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
        const interfaces = data.filter(i =>
            !i.interface_name.startsWith('lo') &&
            !i.interface_name.startsWith('br-') &&
            !i.interface_name.startsWith('veth')
        );

        if (interfaces.length === 0) {
            this.$('[data-network-list]').innerHTML = '<div class="no-data">No interfaces</div>';
            return;
        }

        const html = interfaces.map(i => {
            const rx = this.formatSpeed(i.bytes_recv_rate_per_sec || i.rx || 0);
            const tx = this.formatSpeed(i.bytes_sent_rate_per_sec || i.tx || 0);
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

    formatSpeed(bps) {
        if (!bps) return '0 B/s';
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let i = 0;
        while (bps >= 1024 && i < units.length - 1) {
            bps /= 1024;
            i++;
        }
        return `${bps.toFixed(1)} ${units[i]}`;
    }
}

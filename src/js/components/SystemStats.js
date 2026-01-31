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
        this.render();
        await this.update();
        this.startUpdates();
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
                <div class="cpu-cores" data-cpu-cores></div>
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
                    <span class="stat-label"><span class="stat-label-icon">💿</span> Discos</span>
                </div>
                <div class="disk-list" data-disk-list></div>
            </div>

            <div class="stat-card" id="temp-card">
                <div class="stat-header">
                    <span class="stat-label"><span class="stat-label-icon">🌡️</span> Temperaturas</span>
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
                    <span class="stat-label"><span class="stat-label-icon">📡</span> Red</span>
                </div>
                <div class="network-list" data-network-list></div>
            </div>
        `);
    }

    async update() {
        const [cpu, percpu, mem, fs, sensors, gpu, network] = await Promise.all([
            this.glances.getCpu(),
            this.glances.getPerCpu(),
            this.glances.getMem(),
            this.glances.getFs(),
            this.glances.getSensors(),
            this.glances.getGpu(),
            this.glances.getNetwork(),
        ]);

        if (cpu) this.updateCpu(cpu);
        if (percpu) this.updateCpuCores(percpu);
        if (mem) this.updateRam(mem);
        if (fs) this.updateDisks(fs);
        if (sensors) this.updateTemps(sensors);
        if (gpu?.length > 0) this.updateGpu(gpu);
        if (network) this.updateNetwork(network);
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

    updateCpuCores(data) {
        const html = data.map(core => {
            const percent = Math.round(100 - (core.idle || 0));
            const num = core.cpu_number + 1;
            return `
                <div class="cpu-core" title="Core ${num}: ${percent}%">
                    <div class="cpu-core-bar ${percent > 80 ? 'high' : ''}" style="height:${percent}%"></div>
                    <span class="cpu-core-num">${num}</span>
                </div>
            `;
        }).join('');
        this.$('[data-cpu-cores]').innerHTML = html;
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
            this.$('[data-disk-list]').innerHTML = '<div class="no-data">Sin discos</div>';
            return;
        }

        const html = data
            .filter(d => {
                const mount = d.mnt_point || d.mountpoint || '';
                return !mount.startsWith('/boot') && !mount.includes('/snap/');
            })
            .map(d => {
                const mount = d.mnt_point || d.mountpoint || 'Unknown';
                const total = d.size || d.total || 0;
                const used = d.used || 0;
                const percent = total > 0 ? Math.round((used / total) * 100) : 0;
                return `
                    <div class="disk-item">
                        <div class="disk-header">
                            <span class="disk-mount">${mount}</span>
                            <span class="disk-usage">${formatBytes(used)} / ${formatBytes(total)}</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill disk ${percent > 85 ? 'warning' : ''}" style="width:${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

        this.$('[data-disk-list]').innerHTML = html || '<div class="no-data">Sin discos</div>';
    }

    updateTemps(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.$('[data-temp-list]').innerHTML = '<div class="no-data">Sin sensores</div>';
            return;
        }

        const temps = data.filter(s => {
            const type = (s.type || '').toLowerCase();
            const unit = (s.unit || '').toLowerCase();
            return type.includes('temperature') || unit === 'c' || unit === '°c';
        });

        if (temps.length === 0) {
            this.$('[data-temp-list]').innerHTML = '<div class="no-data">Sin sensores</div>';
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
            this.$('[data-network-list]').innerHTML = '<div class="no-data">Sin interfaces</div>';
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

/**
 * Pure data transformations — filtering, normalization, aggregation, classification.
 * No side effects, no DOM, no network calls.
 */

// ============ Containers ============

export function normalizeContainersPayload(data) {
    return Array.isArray(data) ? data : (data?.containers || []);
}

export function filterJellyfinContainers(containers) {
    return containers.filter(c => !(c.name || '').toLowerCase().includes('jellyfin'));
}

export function findJellyfinContainer(containers) {
    return containers.find(c => (c.name || '').toLowerCase().includes('jellyfin')) || null;
}

export function sortContainersByStatus(containers) {
    return [...containers].sort((a, b) => {
        const aRunning = (a.Status || a.status || '').toLowerCase() === 'running' ? 0 : 1;
        const bRunning = (b.Status || b.status || '').toLowerCase() === 'running' ? 0 : 1;
        if (aRunning !== bRunning) return aRunning - bRunning;
        return (a.name || '').localeCompare(b.name || '');
    });
}

export function normalizeImageName(imageRaw) {
    const raw = Array.isArray(imageRaw) ? imageRaw[0] : imageRaw || '';
    return raw.split(':')[0].split('/').pop();
}

export function extractContainerStats(c) {
    return {
        cpu: c.cpu?.total?.toFixed(1) || '0.0',
        mem: c.memory?.usage || 0,
        uptime: c.uptime || null,
        uptimeSecs: c.Uptime || null,
    };
}

// ============ Disks ============

export function deduplicateDisksByDevice(disks) {
    const map = new Map();
    disks.forEach(d => {
        if (d.device_name && !map.has(d.device_name)) {
            map.set(d.device_name, d);
        }
    });
    return Array.from(map.values());
}

export function getDiskDisplayName(mount, device, index) {
    if (mount === '/' || mount === '') return 'System Drive';
    if (mount.startsWith('/home')) return 'Home';
    if (mount.startsWith('/mnt/')) return mount.split('/')[2] || 'Drive';
    const m = device.match(/\/dev\/(.+)$/);
    return m ? m[1].toUpperCase() : `Drive ${index + 1}`;
}

// ============ Sensors ============

export function filterTemperatureSensors(sensors) {
    return sensors.filter(s => {
        const type = (s.type || '').toLowerCase();
        const unit = (s.unit || '').toLowerCase();
        return type.includes('temperature') || unit === 'c' || unit === '°c';
    });
}

export function classifyTemp(temp, warnThreshold, critThreshold) {
    return temp > critThreshold ? 'critical' : temp > warnThreshold ? 'warning' : '';
}

// ============ Network ============

export function filterNetworkInterfaces(interfaces) {
    return interfaces.filter(i =>
        !i.interface_name.startsWith('lo') &&
        !i.interface_name.startsWith('br-') &&
        !i.interface_name.startsWith('veth')
    );
}

export function coalesceNetworkRate(iface, direction) {
    return direction === 'rx'
        ? (iface.bytes_recv_rate_per_sec || iface.rx || 0)
        : (iface.bytes_sent_rate_per_sec || iface.tx || 0);
}

// ============ Jellyfin ============

export function filterActiveSessions(sessions) {
    return sessions.filter(s => s.NowPlayingItem);
}

export function calcPlaybackPercent(positionTicks, runTimeTicks) {
    if (!runTimeTicks || !positionTicks) return null;
    return Math.round((positionTicks / runTimeTicks) * 100);
}

export function buildSessionMetadata(item) {
    if (item.Type === 'Episode') {
        const s = item.SeriesName || '';
        const season = item.ParentIndexNumber || 0;
        const ep = item.IndexNumber || 0;
        return `${s} - S${String(season).padStart(2, '0')}E${String(ep).padStart(2, '0')}`;
    }
    return item.ProductionYear ? String(item.ProductionYear) : '';
}

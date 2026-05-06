/**
 * Pure formatting utilities.
 * No network calls, no DOM access, no side effects.
 */

/**
 * Formats bytes to human readable string.
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string (e.g., "1.5 GB")
 */
export function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
}

export function formatBytesPerSec(bps) {
    if (!bps) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let i = 0;
    while (bps >= 1024 && i < units.length - 1) {
        bps /= 1024;
        i++;
    }
    return `${bps.toFixed(1)} ${units[i]}`;
}

export function formatUptime(seconds) {
    if (!seconds) return 'just started';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function calcPercent(used, total) {
    return total > 0 ? Math.round((used / total) * 100) : 0;
}

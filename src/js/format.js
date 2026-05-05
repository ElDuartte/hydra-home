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

/**
 * Glances API Module - Client for the Glances API
 */

export class GlancesAPI {
    constructor(baseUrl = 'http://localhost:61208/api/3') {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic fetch with error handling
     */
    async fetch(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Glances API error (${endpoint}):`, error.message);
            return null;
        }
    }

    /**
     * Get all data at once
     */
    async getAll() {
        return await this.fetch('/all');
    }

    /**
     * CPU - Usage percentage
     */
    async getCpu() {
        return await this.fetch('/cpu');
    }

    /**
     * CPU - Usage per core
     */
    async getPerCpu() {
        return await this.fetch('/percpu');
    }

    /**
     * Quicklook - Quick summary (CPU, MEM, SWAP)
     */
    async getQuicklook() {
        return await this.fetch('/quicklook');
    }

    /**
     * RAM Memory
     */
    async getMem() {
        return await this.fetch('/mem');
    }

    /**
     * Swap Memory
     */
    async getSwap() {
        return await this.fetch('/memswap');
    }

    /**
     * File systems (disks)
     */
    async getFs() {
        return await this.fetch('/fs');
    }

    /**
     * Temperature sensors
     */
    async getSensors() {
        return await this.fetch('/sensors');
    }

    /**
     * Docker containers
     */
    async getDocker() {
        return await this.fetch('/containers');
    }

    /**
     * GPU (if available)
     */
    async getGpu() {
        return await this.fetch('/gpu');
    }

    /**
     * Network information
     */
    async getNetwork() {
        return await this.fetch('/network');
    }

    /**
     * System information (hostname, OS, etc)
     */
    async getSystem() {
        return await this.fetch('/system');
    }

    /**
     * System uptime
     */
    async getUptime() {
        return await this.fetch('/uptime');
    }

    /**
     * System load (load average)
     */
    async getLoad() {
        return await this.fetch('/load');
    }
}

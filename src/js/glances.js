/**
 * Glances API Module - Cliente para la API de Glances
 */

export class GlancesAPI {
    constructor(baseUrl = 'http://localhost:61208/api/3') {
        this.baseUrl = baseUrl;
    }

    /**
     * Fetch genérico con manejo de errores
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
     * Obtiene todos los datos de una vez
     */
    async getAll() {
        return await this.fetch('/all');
    }

    /**
     * CPU - Porcentaje de uso
     */
    async getCpu() {
        return await this.fetch('/cpu');
    }

    /**
     * CPU - Uso por core
     */
    async getPerCpu() {
        return await this.fetch('/percpu');
    }

    /**
     * Quicklook - Resumen rápido (CPU, MEM, SWAP)
     */
    async getQuicklook() {
        return await this.fetch('/quicklook');
    }

    /**
     * Memoria RAM
     */
    async getMem() {
        return await this.fetch('/mem');
    }

    /**
     * Memoria Swap
     */
    async getSwap() {
        return await this.fetch('/memswap');
    }

    /**
     * Sistemas de archivos (discos)
     */
    async getFs() {
        return await this.fetch('/fs');
    }

    /**
     * Sensores de temperatura
     */
    async getSensors() {
        return await this.fetch('/sensors');
    }

    /**
     * Contenedores Docker
     */
    async getDocker() {
        return await this.fetch('/containers');
    }

    /**
     * GPU (si está disponible)
     */
    async getGpu() {
        return await this.fetch('/gpu');
    }

    /**
     * Información de red
     */
    async getNetwork() {
        return await this.fetch('/network');
    }

    /**
     * Información del sistema (hostname, OS, etc)
     */
    async getSystem() {
        return await this.fetch('/system');
    }

    /**
     * Uptime del sistema
     */
    async getUptime() {
        return await this.fetch('/uptime');
    }

    /**
     * Carga del sistema (load average)
     */
    async getLoad() {
        return await this.fetch('/load');
    }
}

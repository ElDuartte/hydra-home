/**
 * Frontend ConfigManager
 * Single source of truth for config on the client side.
 * Emits 'configReady' when config is loaded (with scoped frontend config).
 * Emits 'configFailed' if loading fails (with error details).
 */

class ConfigManager extends EventTarget {
    constructor() {
        super();
        this.config = null;
        this.isReady = false;
        this.error = null;
    }

    /**
     * Load config from backend /api/config endpoint.
     * Emits 'configReady' on success, 'configFailed' on error.
     */
    async load() {
        try {
            const response = await fetch('/api/config');

            if (!response.ok) {
                throw new Error(`Failed to load config: HTTP ${response.status}`);
            }

            this.config = await response.json();
            this.isReady = true;
            this.error = null;

            // Emit configReady event with scoped config
            this.dispatchEvent(new CustomEvent('configReady', {
                detail: { config: this.config },
            }));

            return this.config;
        } catch (err) {
            this.error = err.message;
            this.isReady = false;

            // Emit configFailed event
            this.dispatchEvent(new CustomEvent('configFailed', {
                detail: { error: err.message },
            }));

            return null;
        }
    }

    /**
     * Get the loaded config (or null if not ready).
     */
    getConfig() {
        return this.config;
    }

    /**
     * Convenience method to get a specific config section.
     */
    get(section) {
        return this.config ? this.config[section] : null;
    }

    /**
     * Check if config is ready.
     */
    isLoaded() {
        return this.isReady;
    }

    /**
     * Get error message if loading failed.
     */
    getError() {
        return this.error;
    }

    /**
     * Subscribe to config ready event.
     * Callback receives { config } in detail.
     */
    onReady(callback) {
        this.addEventListener('configReady', (e) => callback(e.detail.config));
    }

    /**
     * Subscribe to config failed event.
     * Callback receives { error } in detail.
     */
    onFailed(callback) {
        this.addEventListener('configFailed', (e) => callback(e.detail.error));
    }
}

// Export singleton instance
export const configManager = new ConfigManager();

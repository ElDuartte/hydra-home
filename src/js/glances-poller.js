/**
 * GlancesPoller — Centralized polling for Glances endpoints
 *
 * Deduplicates requests: if multiple components subscribe to the same endpoint,
 * only one HTTP fetch is made. Uses tick-based scheduling (1000ms master tick)
 * to reduce timer overhead and eliminate drift between related endpoints.
 *
 * Each subscription has a tickEvery = interval / 1000. Endpoints fetch when
 * tickCount % tickEvery === 0, ensuring endpoints with the same interval
 * always fire together.
 */

export class GlancesPoller {
    constructor(glancesApi, baseTick = 1000) {
        this.glancesApi = glancesApi;
        this.baseTick = baseTick; // ms, typically 1000
        this.subscriptions = new Map(); // endpoint → { tickEvery, callbacks: Set }
        this.tickCount = 0;
        this.masterTimerId = null;
        this.isRunning = false;
    }

    /**
     * Subscribe to an endpoint with a callback and polling interval.
     * If endpoint already subscribed, uses min(tickEvery from all subscribers).
     * Returns unsubscribe function.
     */
    subscribe(endpoint, callback, interval) {
        if (!endpoint || !callback) {
            throw new Error('endpoint and callback required');
        }

        const tickEvery = Math.max(1, Math.round((interval || 3000) / this.baseTick));
        const sub = this.subscriptions.get(endpoint);

        if (sub) {
            // Endpoint already subscribed
            sub.callbacks.add(callback);

            // Update tickEvery if this subscriber wants faster polling
            if (tickEvery < sub.tickEvery) {
                sub.tickEvery = tickEvery;
            }
        } else {
            // New endpoint subscription
            this.subscriptions.set(endpoint, {
                tickEvery,
                callbacks: new Set([callback]),
            });
        }

        // If poller is running, immediately fetch (warm start)
        if (this.isRunning) {
            this._fetch(endpoint);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(endpoint, callback);
    }

    /**
     * Unsubscribe a callback from an endpoint.
     * Removes endpoint if no callbacks remain.
     */
    unsubscribe(endpoint, callback) {
        const sub = this.subscriptions.get(endpoint);
        if (!sub) return;

        sub.callbacks.delete(callback);

        // Remove endpoint if no more callbacks
        if (sub.callbacks.size === 0) {
            this.subscriptions.delete(endpoint);
        }
    }

    /**
     * Start polling for all subscribed endpoints using master tick.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.tickCount = 0;

        // Immediate first fetch for all endpoints
        for (const endpoint of this.subscriptions.keys()) {
            this._fetch(endpoint);
        }

        // Start master tick
        this.masterTimerId = setInterval(() => this._tick(), this.baseTick);
    }

    /**
     * Stop polling for all endpoints.
     */
    stop() {
        this.isRunning = false;

        if (this.masterTimerId) {
            clearInterval(this.masterTimerId);
            this.masterTimerId = null;
        }
    }

    /**
     * Alias for stop() for consistency with component lifecycle.
     */
    destroy() {
        this.stop();
        this.subscriptions.clear();
    }

    /**
     * Master tick. Called every baseTick ms.
     * Increments counter; fetches endpoints where tickCount % tickEvery === 0.
     */
    _tick() {
        this.tickCount++;

        for (const [endpoint, sub] of this.subscriptions.entries()) {
            if (this.tickCount % sub.tickEvery === 0) {
                this._fetch(endpoint);
            }
        }
    }

    /**
     * Fetch data for an endpoint and deliver to all subscribers.
     */
    async _fetch(endpoint) {
        const sub = this.subscriptions.get(endpoint);
        if (!sub) return;

        try {
            const data = await this.glancesApi.fetch(`/${endpoint}`);

            // Deliver to all subscribers (data may be null on error)
            for (const callback of sub.callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for ${endpoint}:`, error);
                }
            }
        } catch (error) {
            // Fetch failed; deliver null to all subscribers
            for (const callback of sub.callbacks) {
                try {
                    callback(null);
                } catch (error) {
                    console.error(`Error in callback for ${endpoint}:`, error);
                }
            }
        }
    }
}

/**
 * GlancesPoller — Centralized polling for Glances endpoints
 *
 * Deduplicates requests: if multiple components subscribe to the same endpoint,
 * only one HTTP fetch is made. Each endpoint has its own timer based on the
 * fastest subscriber. Delivers data to all subscribers via callbacks.
 */

export class GlancesPoller {
    constructor(glancesApi) {
        this.glancesApi = glancesApi;
        this.subscriptions = new Map(); // endpoint → { interval, callbacks: Set, timerId }
        this.isRunning = false;
    }

    /**
     * Subscribe to an endpoint with a callback and polling interval.
     * If endpoint already subscribed, uses min(existing interval, new interval).
     * Returns unsubscribe function.
     */
    subscribe(endpoint, callback, interval) {
        if (!endpoint || !callback) {
            throw new Error('endpoint and callback required');
        }

        const sub = this.subscriptions.get(endpoint);

        if (sub) {
            // Endpoint already subscribed
            sub.callbacks.add(callback);

            // Update interval if this subscriber wants faster polling
            if (interval && interval < sub.interval) {
                sub.interval = interval;
                if (sub.timerId) {
                    clearInterval(sub.timerId);
                    sub.timerId = this._startTimer(endpoint);
                }
            }
        } else {
            // New endpoint subscription
            this.subscriptions.set(endpoint, {
                interval: interval || 3000,
                callbacks: new Set([callback]),
                timerId: null,
            });

            // Start timer if poller is running
            if (this.isRunning) {
                const sub = this.subscriptions.get(endpoint);
                sub.timerId = this._startTimer(endpoint);
            }
        }

        // Return unsubscribe function
        return () => this.unsubscribe(endpoint, callback);
    }

    /**
     * Unsubscribe a callback from an endpoint.
     * Stops the endpoint timer if no callbacks remain.
     */
    unsubscribe(endpoint, callback) {
        const sub = this.subscriptions.get(endpoint);
        if (!sub) return;

        sub.callbacks.delete(callback);

        // Stop timer if no more callbacks
        if (sub.callbacks.size === 0) {
            if (sub.timerId) {
                clearInterval(sub.timerId);
            }
            this.subscriptions.delete(endpoint);
        }
    }

    /**
     * Start polling for all subscribed endpoints.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        for (const [endpoint, sub] of this.subscriptions.entries()) {
            sub.timerId = this._startTimer(endpoint);
        }
    }

    /**
     * Stop polling for all endpoints.
     */
    stop() {
        this.isRunning = false;

        for (const sub of this.subscriptions.values()) {
            if (sub.timerId) {
                clearInterval(sub.timerId);
                sub.timerId = null;
            }
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
     * Start a timer for an endpoint. Called internally.
     */
    _startTimer(endpoint) {
        const sub = this.subscriptions.get(endpoint);
        if (!sub) return null;

        // Initial fetch immediately
        this._fetch(endpoint);

        // Then poll at interval
        return setInterval(() => this._fetch(endpoint), sub.interval);
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

/**
 * BaseComponent - Base class for all dashboard components
 */

export class BaseComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = { ...this.defaults(), ...options };
        this.intervalId = null;
    }

    /** Override in subclass to provide default options */
    defaults() {
        return {};
    }

    /** Initialize the component */
    async init() {
        this.render();
        await this.update();
        this.startUpdates();
    }

    /** Override in subclass to render HTML */
    render() {}

    /** Override in subclass to update data */
    async update() {}

    /** Start periodic updates if interval is set */
    startUpdates() {
        const interval = this.options.updateInterval;
        if (interval && interval > 0) {
            this.intervalId = setInterval(() => this.update(), interval);
        }
    }

    /** Clean up the component */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /** Helper to set innerHTML */
    html(content) {
        this.container.innerHTML = content;
    }

    /** Helper to query element */
    $(selector) {
        return this.container.querySelector(selector);
    }

    /** Helper to query all elements */
    $$(selector) {
        return this.container.querySelectorAll(selector);
    }
}

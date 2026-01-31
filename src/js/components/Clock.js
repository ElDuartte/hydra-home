/**
 * Clock Component - Digital clock with date and greeting
 */

import { BaseComponent } from './BaseComponent.js';

export class Clock extends BaseComponent {
    defaults() {
        return {
            use24Hour: true,
            showSeconds: true,
            locale: 'es-ES',
            updateInterval: 1000,
        };
    }

    render() {
        this.html(`
            <div class="clock-greeting"></div>
            <div class="clock-time">
                <span class="clock-hours-minutes"></span>
                <span class="clock-seconds"></span>
            </div>
            <div class="clock-date"></div>
        `);
    }

    async update() {
        const now = new Date();
        const { use24Hour, showSeconds, locale } = this.options;

        // Time
        const hours = use24Hour ? now.getHours() : now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        this.$('.clock-hours-minutes').textContent = `${hours}:${minutes}`;

        const secondsEl = this.$('.clock-seconds');
        secondsEl.textContent = showSeconds ? seconds : '';
        secondsEl.style.display = showSeconds ? '' : 'none';

        // Date
        const dateStr = now.toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        this.$('.clock-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        // Greeting
        this.$('.clock-greeting').textContent = this.getGreeting(now.getHours());
    }

    getGreeting(hour) {
        if (hour >= 5 && hour < 12) return '☀️ Good morning';
        if (hour >= 12 && hour < 19) return '🌤️ Good afternoon';
        return '🌙 Good night';
    }
}

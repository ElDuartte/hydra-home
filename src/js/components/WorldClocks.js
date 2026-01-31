/**
 * WorldClocks Component - Shows time in different cities with UTC offset
 */

import { BaseComponent } from './BaseComponent.js';

export class WorldClocks extends BaseComponent {
    defaults() {
        return {
            cities: [
                { name: 'London', timezone: 'Europe/London' },
                { name: 'New York', timezone: 'America/New_York' },
                { name: 'Tokyo', timezone: 'Asia/Tokyo' },
                { name: 'Sydney', timezone: 'Australia/Sydney' },
            ],
            updateInterval: 1000,
        };
    }

    render() {
        const items = this.options.cities.map(city => `
            <div class="world-clock-item" data-tz="${city.timezone}">
                <div class="world-clock-city">${city.name}</div>
                <div class="world-clock-time">--:--</div>
                <div class="world-clock-offset"></div>
            </div>
        `).join('');

        this.html(items);
    }

    async update() {
        const now = new Date();
        const localOffset = now.getTimezoneOffset();

        this.options.cities.forEach(city => {
            const item = this.$(`[data-tz="${city.timezone}"]`);
            if (!item) return;

            // Get time in timezone
            const time = now.toLocaleTimeString('en-US', {
                timeZone: city.timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            // Calculate offset from local time
            const offset = this.getOffset(now, city.timezone);

            item.querySelector('.world-clock-time').textContent = time;
            item.querySelector('.world-clock-offset').textContent = offset;
        });
    }

    getOffset(now, timezone) {
        const localTime = new Date(now.toLocaleString('en-US'));
        const targetTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const diffHours = Math.round((targetTime - localTime) / (1000 * 60 * 60));

        if (diffHours === 0) return 'Same';
        return diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;
    }
}

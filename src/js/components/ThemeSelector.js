/**
 * ThemeSelector Component - Theme switcher
 */

import { BaseComponent } from './BaseComponent.js';
import { THEMES, applyTheme, getCurrentTheme } from '../themes.js';

export class ThemeSelector extends BaseComponent {
    defaults() {
        return {};
    }

    async init() {
        this.currentTheme = getCurrentTheme();
        this.render();
        this.attachEventListeners();
    }

    render() {
        const options = Object.entries(THEMES)
            .map(([id, theme]) =>
                `<option value="${id}" ${id === this.currentTheme ? 'selected' : ''}>${theme.name}</option>`
            )
            .join('');

        this.html(`
            <div class="theme-selector">
                <button class="theme-toggle" id="theme-toggle" title="Change theme">⚙️</button>
                <select id="theme-select" class="theme-select">
                    ${options}
                </select>
            </div>
        `);
    }

    attachEventListeners() {
        const toggle = this.$('#theme-toggle');
        const select = this.$('#theme-select');

        toggle.addEventListener('click', () => {
            select.classList.toggle('visible');
        });

        select.addEventListener('change', (e) => {
            const themeId = e.target.value;
            applyTheme(themeId);
            this.currentTheme = themeId;
            select.classList.remove('visible');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                select.classList.remove('visible');
            }
        });
    }
}

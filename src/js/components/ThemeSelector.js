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
                <button class="theme-toggle" id="theme-toggle" title="Settings">⚙️</button>
                <div id="theme-dropdown" class="theme-dropdown">
                    <select id="theme-select" class="theme-select">
                        ${options}
                    </select>
                    <button id="refresh-all" class="refresh-btn">🔄 Refresh All</button>
                </div>
            </div>
        `);
    }

    attachEventListeners() {
        const toggle = this.$('#theme-toggle');
        const dropdown = this.$('#theme-dropdown');
        const select = this.$('#theme-select');
        const refreshBtn = this.$('#refresh-all');

        toggle.addEventListener('click', () => {
            dropdown.classList.toggle('visible');
        });

        select.addEventListener('change', (e) => {
            const themeId = e.target.value;
            applyTheme(themeId);
            this.currentTheme = themeId;
        });

        refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                dropdown.classList.remove('visible');
            }
        });
    }
}

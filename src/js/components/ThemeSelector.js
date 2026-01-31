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
                <label for="theme-select" class="theme-label">🎨</label>
                <select id="theme-select" class="theme-select">
                    ${options}
                </select>
            </div>
        `);
    }

    attachEventListeners() {
        const select = this.$('#theme-select');
        select.addEventListener('change', (e) => {
            const themeId = e.target.value;
            applyTheme(themeId);
            this.currentTheme = themeId;
        });
    }
}

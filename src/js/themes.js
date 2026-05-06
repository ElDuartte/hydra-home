/**
 * Theme definitions
 */

export const THEMES = {
    'tokyo-night': {
        name: 'Tokyo Night',
        colors: {
            '--bg-primary': '#1a1b26',
            '--bg-secondary': '#16161e',
            '--bg-tertiary': '#24283b',
            '--bg-card': '#1f2335',
            '--text-primary': '#c0caf5',
            '--text-secondary': '#a9b1d6',
            '--text-muted': '#565f89',
            '--accent-blue': '#7aa2f7',
            '--accent-purple': '#bb9af7',
            '--accent-cyan': '#7dcfff',
            '--accent-green': '#9ece6a',
            '--accent-orange': '#ff9e64',
            '--accent-red': '#f7768e',
            '--accent-yellow': '#e0af68',
            '--border-color': '#292e42',
            '--shadow-color': 'rgba(0, 0, 0, 0.3)',
            '--accent-jellyfin': '#00a4dc',
            '--bg-warning': 'rgba(255, 158, 100, 0.1)',
            '--bg-critical': 'rgba(247, 118, 142, 0.1)',
        }
    },
    'gruvbox': {
        name: 'Gruvbox Dark',
        colors: {
            '--bg-primary': '#282828',
            '--bg-secondary': '#1d2021',
            '--bg-tertiary': '#3c3836',
            '--bg-card': '#32302f',
            '--text-primary': '#ebdbb2',
            '--text-secondary': '#d5c4a1',
            '--text-muted': '#928374',
            '--accent-blue': '#83a598',
            '--accent-purple': '#d3869b',
            '--accent-cyan': '#8ec07c',
            '--accent-green': '#b8bb26',
            '--accent-orange': '#fe8019',
            '--accent-red': '#fb4934',
            '--accent-yellow': '#fabd2f',
            '--border-color': '#504945',
            '--shadow-color': 'rgba(0, 0, 0, 0.5)',
            '--accent-jellyfin': '#00a4dc',
            '--bg-warning': 'rgba(254, 128, 25, 0.1)',
            '--bg-critical': 'rgba(251, 73, 52, 0.1)',
        }
    },
    'gruvbox-light': {
        name: 'Gruvbox Light',
        colors: {
            '--bg-primary': '#fbf1c7',
            '--bg-secondary': '#f9f5d7',
            '--bg-tertiary': '#ebdbb2',
            '--bg-card': '#f2e5bc',
            '--text-primary': '#3c3836',
            '--text-secondary': '#504945',
            '--text-muted': '#928374',
            '--accent-blue': '#076678',
            '--accent-purple': '#8f3f71',
            '--accent-cyan': '#427b58',
            '--accent-green': '#79740e',
            '--accent-orange': '#af3a03',
            '--accent-red': '#9d0006',
            '--accent-yellow': '#b57614',
            '--border-color': '#d5c4a1',
            '--shadow-color': 'rgba(0, 0, 0, 0.1)',
            '--accent-jellyfin': '#00a4dc',
            '--bg-warning': 'rgba(175, 58, 3, 0.12)',
            '--bg-critical': 'rgba(157, 0, 6, 0.12)',
        }
    },
    'onedark': {
        name: 'One Dark',
        colors: {
            '--bg-primary': '#282c34',
            '--bg-secondary': '#21252b',
            '--bg-tertiary': '#2c313c',
            '--bg-card': '#2c313a',
            '--text-primary': '#abb2bf',
            '--text-secondary': '#5c6370',
            '--text-muted': '#4b5263',
            '--accent-blue': '#61afef',
            '--accent-purple': '#c678dd',
            '--accent-cyan': '#56b6c2',
            '--accent-green': '#98c379',
            '--accent-orange': '#d19a66',
            '--accent-red': '#e06c75',
            '--accent-yellow': '#e5c07b',
            '--border-color': '#3e4451',
            '--shadow-color': 'rgba(0, 0, 0, 0.4)',
            '--accent-jellyfin': '#00a4dc',
            '--bg-warning': 'rgba(209, 154, 102, 0.1)',
            '--bg-critical': 'rgba(224, 108, 117, 0.1)',
        }
    },
    'cyberpunk': {
        name: 'Cyberpunk',
        colors: {
            '--bg-primary': '#0a0a0f',
            '--bg-secondary': '#050507',
            '--bg-tertiary': '#12121a',
            '--bg-card': '#0e0e17',
            '--text-primary': '#e0e0ff',
            '--text-secondary': '#9090cc',
            '--text-muted': '#505099',
            '--accent-blue': '#00e5ff',
            '--accent-purple': '#ff00ff',
            '--accent-cyan': '#00ffff',
            '--accent-green': '#39ff14',
            '--accent-orange': '#ff6600',
            '--accent-red': '#ff0040',
            '--accent-yellow': '#ffff00',
            '--border-color': '#1a1a3a',
            '--shadow-color': 'rgba(0, 229, 255, 0.15)',
            '--accent-jellyfin': '#00e5ff',
            '--bg-warning': 'rgba(255, 102, 0, 0.15)',
            '--bg-critical': 'rgba(255, 0, 64, 0.15)',
        }
    }
};

export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) {
        console.warn(`Theme "${themeId}" not found`);
        return;
    }

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
    });

    // Set data-theme attribute for CSS-based theme variants
    root.setAttribute('data-theme', themeId);

    // Save preference to localStorage
    localStorage.setItem('hydra-theme', themeId);
}

export function getCurrentTheme() {
    return localStorage.getItem('hydra-theme') || 'tokyo-night';
}

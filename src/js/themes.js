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

    // Save preference to localStorage
    localStorage.setItem('hydra-theme', themeId);
}

export function getCurrentTheme() {
    return localStorage.getItem('hydra-theme') || 'tokyo-night';
}

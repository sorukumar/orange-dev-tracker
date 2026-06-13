/**
 * Shared Theme and Chart Configurations for Bitcoin Data Labs
 */

const COLORS = {
    primary: '#E8916B',
    secondary: '#2A3342',
    textPrimary: '#F7FAFC',
    textSecondary: '#A0AEC0',
    textLight: '#718096',
    border: '#2D3748',
    gridLine: 'rgba(255, 255, 255, 0.05)'
};

const categoryColors = {
    // Security & Core (Warm spectrum)
    'Consensus': '#E07A5F',
    'Cryptography': '#C53030',
    'Script': '#F6AD55',

    // Usability & App (Amber spectrum)
    'Node & RPC': '#ED8936',
    'GUI': '#F4A261',
    'Wallet': '#D69E2E',

    // Resilience & Infrastructure (Cool spectrum)
    'P2P Network': '#2B6CB0',
    'Database': '#4A5568',
    'Utilities': '#9F86C0',

    // Quality & Education (Natural spectrum)
    'Tests': '#81B29A',
    'Build & CI': '#3D405B',
    'Documentation': '#F2CC8F'
};

const charts = {};
function getGhibliPalette() {
    const style = getComputedStyle(document.documentElement);
    const vars = [
        'sky', 'sky-light', 'leaf', 'leaf-light', 'sunset', 'sunset-light',
        'gold', 'gold-light', 'rose', 'rose-light', 'ocean', 'ocean-light',
        'meadow', 'meadow-light', 'sakura', 'sakura-light', 'moss', 'earth',
        'twilight', 'cloud'
    ];
    const palette = vars.map(v => style.getPropertyValue(`--ghibli-${v}`).trim()).filter(c => c !== '');
    return palette.length > 0 ? palette : [
        '#7BA9CC', '#B9D4E7', '#5B8266', '#A2C5AC', '#E07A5F', '#F4A261',
        '#D4AF37', '#E9C46A', '#6D597A', '#B5838D', '#3E6073', '#8BBEE8',
        '#89B449', '#C5D86D', '#E27396', '#FFB3C1', '#585123', '#DDA15E',
        '#384D48', '#ACD7EC'
    ];
}

const tooltipStyle = {
    backgroundColor: '#1A202C',
    borderColor: '#2D3748',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: COLORS.textPrimary, fontFamily: 'Inter', fontSize: 13 },
    shadowBlur: 10,
    shadowColor: 'rgba(0,0,0,0.5)',
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);'
};

const axisStyle = {
    axisLine: { lineStyle: { color: COLORS.border } },
    axisTick: { lineStyle: { color: COLORS.border } },
    axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
    splitLine: { lineStyle: { color: COLORS.gridLine, type: 'dashed' } },
    nameTextStyle: { color: COLORS.textLight, fontSize: 12, fontWeight: 500 }
};

const legendStyle = {
    textStyle: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'Inter' },
    itemGap: 15,
    pageIconColor: COLORS.textSecondary,
    pageTextStyle: { color: COLORS.textSecondary }
};

let GHIBLI_PALETTE = getGhibliPalette();

const chartConfig = {
    color: GHIBLI_PALETTE,
    backgroundColor: 'transparent',
    textStyle: { color: COLORS.textSecondary, fontFamily: 'Inter' }
};

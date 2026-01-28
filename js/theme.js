/**
 * Shared Theme and Chart Configurations for Bitcoin Data Labs
 */

const COLORS = {
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textLight: '#718096',
    border: '#E2E8F0',
    gridLine: 'rgba(226, 232, 240, 0.6)'
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: COLORS.border,
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: COLORS.textPrimary, fontFamily: 'Inter', fontSize: 13 },
    shadowBlur: 10,
    shadowColor: 'rgba(0,0,0,0.1)',
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
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

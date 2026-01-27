// Helper to read CSS variables for the chart palette
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

/**
 * Shared helper for consistent percentage formatting
 * @param {number} val - The numeric value
 * @param {number} precision - Number of decimal places
 * @param {boolean} isRatio - If true, multiplies by 100 (e.g. 0.15 -> 15%)
 */
function formatPct(val, precision = 0, isRatio = false) {
    const num = isRatio ? val * 100 : val;
    // Auto-precision: if value is small (<5%) and precision is 0, show 1 decimal
    const p = (num > 0 && num < 5 && precision === 0) ? 1 : precision;
    return num.toFixed(p) + '%';
}

const COLORS = {
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
    textLight: '#718096',
    border: '#E2E8F0',
    gridLine: 'rgba(226, 232, 240, 0.6)'
};

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

const charts = {};
const chartConfig = {
    color: GHIBLI_PALETTE,
    backgroundColor: 'transparent',
    textStyle: { color: COLORS.textSecondary, fontFamily: 'Inter' }
};

async function init() {
    console.log("Orange Dev Tracker: Initializing...");

    // Refresh palette from CSS variables
    GHIBLI_PALETTE = getGhibliPalette();

    function initChart(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Chart container #${id} not found in this page.`);
            return null;
        }
        try {
            const instance = echarts.init(el);
            console.log(`Initialized ECharts for #${id}`);
            return instance;
        } catch (e) {
            console.error(`Failed to initialize ECharts for #${id}:`, e);
            return null;
        }
    }

    // Vital Signs Snapshots
    charts.snapshotWork = initChart('chart-snapshot-work');
    charts.snapshotVolume = initChart('chart-snapshot-volume');
    charts.snapshotStack = initChart('chart-snapshot-stack');

    // Codebase New Charts
    charts.filesLang = initChart('chart-snapshot-files-lang');
    charts.filesCat = initChart('chart-snapshot-files-cat');
    charts.stackEvolution = initChart('chart-stack-evolution');
    charts.streamgraph = initChart('chart-streamgraph');
    charts.catEvolution = initChart('chart-category-evolution');

    // Trends
    charts.heatmap = initChart('chart-heatmap');
    charts.weekend = initChart('chart-weekend');
    charts.category = initChart('chart-category');
    charts.growth = initChart('chart-growth');
    charts.engagement = initChart('chart-engagement-tiers');
    charts.social = initChart('chart-social');
    charts.maintainers = initChart('chart-maintainers');

    // Contributor Landscape
    charts.landscape = initChart('chart-contributor-landscape');

    window.addEventListener('resize', () => {
        Object.values(charts).forEach(c => c && c.resize());
    });

    // Load data
    try {
        if (charts.snapshotWork || charts.snapshotVolume || charts.snapshotStack) await loadSnapshots();
        if (charts.streamgraph || charts.filesCat) await loadCodebaseSnapshots();
        if (charts.streamgraph) await loadStreamgraph();
        if (charts.catEvolution) await loadCategoryHistory();
        if (document.getElementById('kpi-contributors')) await loadVitalSigns();
        if (charts.category) await loadCategory();
        if (charts.growth) await loadGrowth();
        if (charts.engagement) await loadEngagementTiers();
        if (charts.social) await loadSocial();
        if (charts.maintainers) await loadMaintainers();
        if (charts.heatmap) await loadStory();
        if (document.getElementById('chart-corporate')) await loadCorporateEra();
        if (document.getElementById('chart-geography')) await loadGeography();
        if (document.getElementById('chart-maintainer-independence')) await loadMaintainerIndependence();

        // Contributors Page specific
        if (charts.landscape) {
            console.log("Calling loadContributorLandscape...");
            await loadContributorLandscape();
        }
    } catch (err) {
        console.error("Initialization Error during data load:", err);
    }
}

async function loadVitalSigns() {
    try {
        const res = await fetch('data/dashboard_vital_signs.json');
        const data = await res.json();

        if (document.getElementById('kpi-contributors')) {
            document.getElementById('kpi-contributors').innerText = data.unique_contributors.toLocaleString();
        }

        // Maintainers: Total / Active
        if (document.getElementById('kpi-maintainers')) {
            const total = data.total_maintainers || "-";
            const active = data.unique_maintainers || "-";
            document.getElementById('kpi-maintainers').innerText = `${total} / ${active}`;
        }

        // Codebase: x.xxM
        if (document.getElementById('kpi-codebase')) {
            const size = data.current_codebase_size;
            const sizeStr = size ? (size / 1000000).toFixed(2) + "M" : "-";
            document.getElementById('kpi-codebase').innerText = sizeStr;
        }

        // Total Commits
        if (document.getElementById('kpi-total-commits')) {
            document.getElementById('kpi-total-commits').innerText = data.total_commits ? data.total_commits.toLocaleString() : "-";
        }

        // Social: Stars / Forks / Watchers
        // Format: 87k / 39k / 4k
        if (document.getElementById('kpi-social')) {
            function fmt(num) {
                if (!num) return "0";
                if (num > 1000) return (num / 1000).toFixed(0) + "k";
                return num.toString();
            }
            const s = fmt(data.total_stars);
            const f = fmt(data.total_forks);
            const w = fmt(data.total_watchers);
            document.getElementById('kpi-social').innerText = `${s} / ${f} / ${w}`;
        }

    } catch (e) {
        console.error("Vital Signs Error:", e);
    }
}

async function loadSnapshots() {
    // Work Distribution (Dashboard & Codebase?)
    // Note: Dashboard now uses 'chart-snapshot-work' in a flex container
    if (charts.snapshotWork) {
        try {
            const resWork = await fetch('data/stats_work_distribution.json');
            const dataWork = await resWork.json();
            const total = dataWork.data.reduce((acc, curr) => acc + curr.value, 0);

            charts.snapshotWork.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const strat = pct < 5 ? 1 : 0;
                        let valStr = p.value > 1000 ? (p.value / 1000).toFixed(1) + "k" : p.value;
                        return `<b>${p.name}</b><br/>Commits: <b>${valStr}</b> (${pct.toFixed(strat)}%)`;
                    }
                },
                legend: { show: false },
                series: [{
                    type: 'pie',
                    radius: ['50%', '75%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 2 },
                    label: { show: false, position: 'center' },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: COLORS.textPrimary,
                            formatter: '{b}\n{d}%'
                        },
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
                    },
                    data: dataWork.data
                }],
                graphic: [{
                    type: 'text',
                    left: 'center',
                    top: 'center',
                    style: {
                        text: 'ACTIVITY',
                        fill: COLORS.textLight,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 1
                    }
                }],
                color: GHIBLI_PALETTE
            });
        } catch (e) { }
    }

    // Volume (Codebase Page Only)
    if (charts.snapshotVolume) {
        try {
            const resVol = await fetch('data/stats_code_volume.json');
            const dataVol = await resVol.json();
            charts.snapshotVolume.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const pctStrat = pct < 5 ? 1 : 0;
                        const valK = p.value / 1000;
                        const valStrat = valK < 5 ? 1 : 0;
                        return `<b>${p.name}</b><br/>Volume: <b>${valK.toFixed(valStrat)}k</b> Lines (${pct.toFixed(pctStrat)}%)`;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: '65%',
                    label: { color: COLORS.textSecondary, fontSize: 11 },
                    data: dataVol.data,
                    itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE
            });
        } catch (e) { }
    }

    // Tech Stack (Codebase Page Only)
    if (charts.snapshotStack) {
        try {
            const resStack = await fetch('data/stats_tech_stack.json');
            const dataStack = await resStack.json();
            const pieData = dataStack.data.slice(0, 8);

            charts.snapshotStack.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const pctStrat = pct < 5 ? 1 : 0;
                        const valK = p.value / 1000;
                        const valStrat = valK < 5 ? 1 : 0;
                        return `<b>${p.name}</b><br/>Lines: <b>${valK.toFixed(valStrat)}k</b> (${pct.toFixed(pctStrat)}%)`;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: '65%',
                    label: { color: COLORS.textSecondary, fontSize: 11 },
                    data: pieData,
                    itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE.slice(2)
            });
        } catch (e) { }
    }
}

async function loadCategory() {
    try {
        const res = await fetch('data/stats_category_evolution.json');
        const data = await res.json();

        // 1. Filter dates <= 2025
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);

        // 2. Transform to ThemeRiver format: [date, value, id]
        const riverData = [];
        data.series.forEach(s => {
            validIndices.forEach(idx => {
                const date = data.xAxis[idx] + "-12-31"; // Map annual totals to end of year
                const val = s.data[idx];
                if (val > 0) {
                    riverData.push([date, val, s.name]);
                }
            });
        });

        charts.category.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } },
                formatter: function (params) {
                    if (!params || !params.length) return "";
                    const dateStr = params[0].axisValue;
                    const year = new Date(dateStr).getFullYear();

                    let total = 0;
                    params.forEach(p => total += p.value[1]);

                    let html = `<div style="margin-bottom:8px; border-bottom:1px solid ${COLORS.border}; padding-bottom:4px;"><b>Year: ${year}</b></div>`;
                    html += `<div style="font-size:11px; color:${COLORS.textLight}; margin-bottom:8px;">Total Activity: <b>${total.toLocaleString()}</b> Commits</div>`;

                    const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);

                    sorted.forEach(p => {
                        const val = p.value[1];
                        const name = p.value[2];
                        const pct = (total > 0 ? (val / total * 100) : 0).toFixed(1);
                        html += `
                        <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                            <span>${p.marker} ${name}</span>
                            <span><b>${pct}%</b> <span style="color:${COLORS.textLight}; font-size:10px;">(${val.toLocaleString()})</span></span>
                        </div>`;
                    });
                    return html;
                },
                ...tooltipStyle
            },
            legend: {
                ...legendStyle,
                data: data.categories,
                bottom: 0,
                type: 'scroll'
            },
            singleAxis: {
                top: 20,
                bottom: 60,
                axisTick: { show: false },
                axisLabel: { ...axisStyle.axisLabel },
                type: 'time',
                axisPointer: { animation: true, label: { show: true } },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            series: [{
                type: 'themeRiver',
                emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } },
                data: riverData,
                label: { show: false },
                itemStyle: {
                    shadowBlur: 2,
                    shadowColor: 'rgba(0,0,0,0.1)'
                }
            }],
            color: GHIBLI_PALETTE
        });
    } catch (e) {
        console.error("Category Load Error", e);
    }
}

async function loadGrowth() {
    try {
        // Recruitment Velocity: New Contributors per Year (Area Chart)
        const res = await fetch('data/stats_contributor_growth.json');
        const data = await res.json();

        // Find "New Contributors" series
        const newSeries = data.series.find(s => s.name === "New Contributors");
        if (newSeries) {
            // Filter out 2026+
            const limit = 2025;
            const validIndices = data.xAxis.map((x, i) => parseInt(x) <= limit ? i : -1).filter(i => i !== -1);

            const filteredX = validIndices.map(i => data.xAxis[i]);
            const filteredData = validIndices.map(i => newSeries.data[i]);

            charts.growth.setOption({
                backgroundColor: 'transparent',
                tooltip: { ...tooltipStyle, trigger: 'axis' },
                grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
                xAxis: { ...axisStyle, type: 'category', boundaryGap: false, data: filteredX },
                yAxis: { ...axisStyle, type: 'value', name: 'New Devs' },
                series: [{
                    name: 'New Contributors',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(224, 122, 95, 0.4)' }, // Sunset
                            { offset: 1, color: 'rgba(224, 122, 95, 0.05)' }
                        ])
                    },
                    lineStyle: { color: GHIBLI_PALETTE[4], width: 3 },
                    data: filteredData
                }]
            });
        }
    } catch (e) { console.error("Recruitment Velocity Error", e); }
}

async function loadEngagementTiers() {
    try {
        const res = await fetch('data/contributors_rich.json');
        const data = await res.json();

        // Sort desc by commits
        data.sort((a, b) => b.total_commits - a.total_commits);

        const totalCommits = data.reduce((sum, c) => sum + c.total_commits, 0);
        const count = data.length;

        // Tiers: 1%, 9% (Top 10%), 15% (Top 25%), 25% (Top 50%), 50% (Bottom 50%)
        const i1 = Math.ceil(count * 0.01);
        const i10 = Math.ceil(count * 0.10);
        const i25 = Math.ceil(count * 0.25);
        const i50 = Math.ceil(count * 0.50);

        const group1 = data.slice(0, i1);
        const group2 = data.slice(i1, i10);
        const group3 = data.slice(i10, i25);
        const group4 = data.slice(i25, i50);
        const group5 = data.slice(i50);

        function sumC(arr) { return arr.reduce((s, c) => s + c.total_commits, 0); }

        const tiers = [
            { name: "👑 The Core (Top 1%)", val: sumC(group1), count: group1.length, color: GHIBLI_PALETTE[4] },
            { name: "⭐ The Regulars (Top 10%)", val: sumC(group2), count: group2.length, color: GHIBLI_PALETTE[5] },
            { name: "⚒️ The Sustainers (Top 25%)", val: sumC(group3), count: group3.length, color: GHIBLI_PALETTE[7] },
            { name: "🔭 The Explorers (Top 50%)", val: sumC(group4), count: group4.length, color: GHIBLI_PALETTE[3] },
            { name: "🧱 The Scouts (Bottom 50%)", val: sumC(group5), count: group5.length, color: GHIBLI_PALETTE[19] }
        ];

        // Chart: Horizontal Bar showing Share of Commits
        charts.engagement.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    const p = params[0];
                    const tier = tiers.find(t => t.name === p.name);
                    const pct = formatPct(p.value / totalCommits, 1, true);
                    return `
                        <div style="margin-bottom:4px; font-weight:bold;">${p.name}</div>
                        <div style="font-size:12px;">Contributors: <b>${tier ? tier.count : '-'}</b></div>
                        <div style="font-size:12px;">Commits: <b>${p.value.toLocaleString()}</b> (${pct}%)</div>
                    `;
                }
            },
            grid: { left: '4%', right: '8%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', show: false },
            yAxis: {
                ...axisStyle,
                type: 'category',
                data: tiers.map(t => t.name).reverse(),
                axisLabel: { ...axisStyle.axisLabel, fontSize: 10 },
                axisLine: { show: false },
                axisTick: { show: false }
            },
            series: [{
                type: 'bar',
                data: tiers.map(t => ({ value: t.val, itemStyle: { color: t.color, borderRadius: [0, 4, 4, 0] } })).reverse(),
                label: {
                    show: true,
                    position: 'right',
                    formatter: (p) => formatPct(p.value / totalCommits, 0, true),
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    fontWeight: 'bold',
                    distance: 10
                },
                barWidth: '50%'
            }]
        });

    } catch (e) { console.error("Engagement Tiers Error", e); }
}

async function loadSocial() {
    try {
        const res = await fetch('data/stats_social_proof.json');
        const data = await res.json();

        // Filter out 2026+
        const validIndices = data.xAxis.map((x, i) => {
            const year = parseInt(x.split('-')[0]);
            return year <= 2025 ? i : -1;
        }).filter(i => i !== -1);

        const filteredX = validIndices.map(i => data.xAxis[i]);
        const filteredStars = validIndices.map(i => data.stars[i]);
        const filteredForks = validIndices.map(i => data.forks[i]);

        charts.social.setOption({
            backgroundColor: 'transparent',
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            legend: { ...legendStyle, bottom: 0 },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredX },
            yAxis: [
                { ...axisStyle, type: 'value', name: 'Stars', position: 'left' },
                { ...axisStyle, type: 'value', name: 'Forks', position: 'right', splitLine: { show: false } }
            ],
            series: [
                { name: 'Stars', type: 'line', data: filteredStars, yAxisIndex: 0, showSymbol: false, itemStyle: { color: GHIBLI_PALETTE[4] }, smooth: true },
                { name: 'Forks', type: 'line', data: filteredForks, yAxisIndex: 1, showSymbol: false, itemStyle: { color: GHIBLI_PALETTE[10] }, smooth: true }
            ]
        });
    } catch (e) { }
}

async function loadMaintainers() {
    try {
        const res = await fetch('data/stats_maintainer_independence.json');
        const data = await res.json();
        const maintainers = data.maintainers;

        // Sort by start year (earliest first)
        maintainers.sort((a, b) => Math.min(...a.active_years) - Math.min(...b.active_years));

        const names = maintainers.map(m => m.name);

        const seriesData = maintainers.map((m, idx) => {
            const start = Math.min(...m.active_years);
            const end = Math.max(...m.active_years);
            const isLatest = m.status === 'active';

            return {
                name: m.name,
                value: [
                    idx,
                    new Date(start, 0, 1).getTime(),
                    new Date(end, 11, 31).getTime(),
                    m.status,
                    m.sponsor,
                    m.active_years.length // Years of service
                ],
                itemStyle: {
                    // Active uses Leaf Green, Emeritus uses a soft slate/blue
                    color: isLatest ? GHIBLI_PALETTE[2] : '#94A3B8',
                    opacity: isLatest ? 0.9 : 0.6
                }
            };
        });

        charts.maintainers.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                formatter: function (params) {
                    const status = params.value[3];
                    const sponsor = params.value[4];
                    const years = params.value[5];
                    const start = new Date(params.value[1]).getFullYear();
                    const end = new Date(params.value[2]).getFullYear();
                    const statusColor = status === 'active' ? '#48BB78' : '#718096';

                    return `
                        <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${params.name}</div>
                        <div style="color:${statusColor}; font-size:11px; font-weight:600; text-transform:uppercase; margin-bottom:8px;">${status}</div>
                        <div style="display:grid; grid-template-columns: 1fr; gap:4px; font-size:12px;">
                            <div>📅 <b>${start} — ${end}</b> (${years} years)</div>
                            <div>🏢 Sponsored by <b>${sponsor}</b></div>
                        </div>
                    `;
                }
            },
            grid: { left: '160', right: '40', bottom: '20', top: '10' },
            xAxis: {
                type: 'time',
                min: new Date(2009, 0, 1).getTime(),
                axisLabel: { ...axisStyle.axisLabel, fontSize: 10 },
                axisLine: { show: false },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            yAxis: {
                type: 'category',
                data: names,
                axisLabel: { ...axisStyle.axisLabel, fontSize: 11, fontWeight: 500, color: COLORS.textPrimary },
                axisLine: { show: false },
                axisTick: { show: false }
            },
            series: [{
                type: 'custom',
                renderItem: function (params, api) {
                    const categoryIndex = api.value(0);
                    const start = api.coord([api.value(1), categoryIndex]);
                    const end = api.coord([api.value(2), categoryIndex]);
                    const height = api.size([0, 1])[1] * 0.5; // Bar thickness

                    return {
                        type: 'rect',
                        shape: {
                            x: start[0],
                            y: start[1] - height / 2,
                            width: Math.max(end[0] - start[0], 4),
                            height: height,
                            r: 4
                        },
                        style: api.style()
                    };
                },
                itemStyle: { emphasis: { opacity: 1, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
                encode: { x: [1, 2], y: 0 },
                data: seriesData
            }]
        });
    } catch (e) { console.error("Maintainer Legacy Error:", e); }
}

async function loadStory() {
    try {
        const resHM = await fetch('data/stats_heatmap.json');
        const dataHM = await resHM.json();

        // Filter years 2026+
        const validYearIndices = dataHM.years.map((y, i) => parseInt(y) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredYears = validYearIndices.map(i => dataHM.years[i]);
        const filteredDataHM = dataHM.data.filter(item => validYearIndices.includes(item[0]));

        charts.heatmap.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                position: 'top',
                formatter: (p) => `<b>${p.data[1]}:00</b> on ${p.data[0]}<br/>Commits: <b>${p.data[2]}</b>`
            },
            grid: { height: '75%', top: '5%', bottom: '15%' },
            xAxis: { ...axisStyle, type: 'category', data: filteredYears, splitArea: { show: true } },
            yAxis: { ...axisStyle, type: 'category', data: dataHM.hours, splitArea: { show: true } },
            visualMap: {
                min: 0,
                max: 800,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                itemWidth: 15,
                textStyle: { color: COLORS.textSecondary, fontSize: 10 },
                inRange: { color: ['#F5F1EE', '#ACD7EC', '#3E6073'] }
            },
            series: [{
                type: 'heatmap',
                data: filteredDataHM,
                itemStyle: { emphasis: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
            }]
        });

        const resW = await fetch('data/stats_weekend.json');
        const dataW = await resW.json();

        const validIndicesW = dataW.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredXW = validIndicesW.map(i => dataW.xAxis[i]);
        const filteredSeriesW = dataW.series.map(s => ({
            ...s,
            data: validIndicesW.map(i => s.data[i]),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6
        }));

        charts.weekend.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Weekend Coding Ratio', left: 'center', top: 0, textStyle: { color: COLORS.textLight, fontSize: 12, fontWeight: 500 } },
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                formatter: function (params) {
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${params[0].axisValue}</b></div>`;
                    params.forEach(p => {
                        html += `
                        <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${formatPct(p.value, 1, true)}</b></span>
                        </div>`;
                    });
                    return html;
                }
            },
            grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredXW },
            yAxis: {
                ...axisStyle,
                type: 'value',
                max: 0.5,
                name: 'Ratio',
                axisLabel: {
                    ...axisStyle.axisLabel,
                    formatter: (v) => formatPct(v, 0, true)
                }
            },
            series: filteredSeriesW,
            color: GHIBLI_PALETTE.slice(4)
        });
    } catch (e) { }
}

async function loadContributorLandscape() {
    try {
        console.time("loadContributorLandscape");
        if (!charts.landscape) {
            console.error("No landscape chart instance found; skipping load.");
            return;
        }

        const dataPath = 'data/contributors_rich.json';
        console.log(`Fetching contributors from: ${dataPath}`);

        const res = await fetch(dataPath);
        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}: ${res.statusText} at ${dataPath}`);
        }

        const rawData = await res.json();
        console.log(`Successfully fetched ${rawData.length} contributors.`);

        // Color mapping for ranks - Matching the Dashboard's Engagement Pyramid
        const rankStyles = {
            'The Core (Top 1%)': { color: '#E07A5F', priority: 1, opacity: 1, symbol: 'diamond' },
            'The Regulars (Top 10%)': { color: '#F4A261', priority: 2, opacity: 0.9, symbol: 'circle' },
            'The Sustainers (Top 25%)': { color: '#D4AF37', priority: 3, opacity: 0.8, symbol: 'circle' },
            'The Explorers': { color: '#89B449', priority: 4, opacity: 0.7, symbol: 'circle' },
            'The Scouts': { color: '#3182CE', priority: 5, opacity: 0.5, symbol: 'circle' }
        };

        const groupedSeries = {};
        Object.keys(rankStyles).forEach(rank => groupedSeries[rank] = []);

        const currentYear = new Date().getFullYear();
        let processedCount = 0;

        rawData.filter(item => item && item.cohort_year && item.cohort_year <= 2025).forEach(item => {
            // Percentile-based categorization matching the Pyramid logic
            const p = item.percentile_raw || 0;
            let rank;
            if (p >= 99) rank = 'The Core (Top 1%)';
            else if (p >= 90) rank = 'The Regulars (Top 10%)';
            else if (p >= 75) rank = 'The Sustainers (Top 25%)';
            else if (p >= 50) rank = 'The Explorers';
            else rank = 'The Scouts';

            const style = rankStyles[rank];
            const isActive = (item.last_active_year >= 2025); // Active in last ~1 year

            // Map specific contributors to their premium portraits
            const portraits = {
                's_nakamoto': 'assets/satoshi.png',
                '--author=Satoshi Nakamoto': 'assets/satoshi.png',
                'Gavin Andresen': 'assets/gavin_andresen.png',
                'Wladimir J. van der Laan': 'assets/wladimir.png',
                'MarcoFalke': 'assets/marcofalke.png',
                'Michael Ford': 'assets/michael_ford.png',
                'Pieter Wuille': 'assets/pieter_wuille.png'
            };

            const portraitUrl = portraits[item.name];

            // Explicitly cast to Number to avoid string concatenation issues
            const baseYear = Number(item.cohort_year);
            const valX = baseYear + (Math.random() - 0.5) * 0.7;

            // LOG AXIS SAFETY: Force minimum value of 1 for logarithmic scale
            let valY = Math.max(1, Number(item.total_commits) || 1);
            if (valY <= 3) {
                // Keep jittering within safe positive bounds (>= 1) for log axis
                valY = Math.max(1, valY + (Math.random() - 0.5) * 0.6);
            }

            // Calculate natural size based on commits
            const baseSize = Math.max(6, Math.log10(valY + 1) * 12 + 2);

            groupedSeries[rank].push({
                name: item.name,
                value: [valX, valY, item.impact, item.name, rank],
                raw: item,
                // Use the standard ECharts image symbol - most reliable for loading
                symbol: portraitUrl ? `image://${portraitUrl}` : style.symbol,
                symbolSize: portraitUrl ? baseSize * 1.0 : baseSize,
                itemStyle: {
                    color: style.color,
                    borderColor: (isActive || portraitUrl) ? '#fff' : 'transparent',
                    borderWidth: (isActive || portraitUrl) ? 1.5 : 0,
                    opacity: style.opacity
                },
                label: {
                    show: false,
                    position: 'top',
                    formatter: (p) => {
                        if (!p || !p.name) return '';
                        if (p.name === 's_nakamoto' || p.name === '--author=Satoshi Nakamoto') return 'Satoshi Nakamoto';
                        return p.name;
                    },
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: '#fff',
                    textBorderColor: 'rgba(0,0,0,0.8)',
                    textBorderWidth: 2
                }
            });
            processedCount++;
        });


        console.log(`Processed ${processedCount} valid contributors for the Galaxy.`);

        const series = Object.keys(rankStyles).map(rank => {
            const style = rankStyles[rank];
            return {
                name: rank,
                type: 'scatter',
                data: groupedSeries[rank],
                itemStyle: {
                    color: style.color
                },
                emphasis: {
                    focus: 'self',
                    label: { show: true, fontSize: 12, fontWeight: 'bold' },
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 2,
                        shadowBlur: 15,
                        shadowColor: '#fff'
                    }
                }
            };
        });

        charts.landscape.setOption({
            backgroundColor: 'transparent',
            grid: { top: 30, right: 30, bottom: 100, left: 80 },
            legend: {
                data: Object.keys(rankStyles),
                bottom: 10,
                textStyle: { color: COLORS.textSecondary, fontSize: 11 },
                itemGap: 20
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: '#1A202C',
                borderColor: '#2D3748',
                borderWidth: 1,
                padding: 0,
                formatter: function (params) {
                    const r = params.data.raw;
                    const login = r.login && r.login !== "Anonymous" ? `<span style="color:#A0AEC0;">@${r.login}</span>` : "";
                    const rankLabel = params.seriesName.includes(' ') ? params.seriesName.split(' ').slice(1).join(' ') : params.seriesName;
                    const badge = `<span style="background:${params.color}; color:#000; padding:2px 6px; border-radius:10px; font-size:10px; font-weight:bold; margin-left:8px;">${rankLabel}</span>`;

                    const isActive = (r.last_active_year >= 2025);
                    const activeBadge = isActive ? `<div style="margin-top:4px;"><span style="background:#48BB78; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; text-transform:uppercase;">● Active</span></div>` : "";

                    // Adaptive precision for share display
                    const shareVal = parseFloat(r.contribution_pct || 0);
                    const shareStr = shareVal >= 1 ? shareVal.toFixed(1) : shareVal.toFixed(4);

                    let focusHtml = "";
                    const focusData = r.focus_areas || {};
                    const topFocus = Object.entries(focusData).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    if (topFocus.length > 0) {
                        focusHtml = `<div style="margin-top:12px; border-top:1px solid #2D3748; padding-top:8px; display:flex; flex-wrap:wrap; gap:5px;">` +
                            topFocus.map(([cat]) => `<span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:10px;">${cat}</span>`).join("") +
                            `</div>`;
                    }

                    return `
                        <div style="padding:15px; width:260px; font-family:Inter, sans-serif; color:#fff;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div>
                                    <div style="font-size:15px; font-weight:bold;">${r.name}</div>
                                    <div style="font-size:11px; opacity:0.8;">${login}</div>
                                    ${activeBadge}
                                </div>
                                ${badge}
                            </div>
                            <div style="margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11px;">
                                <div><span style="opacity:0.6;">Tenure:</span><br/><b>${r.span || 'N/A'}</b></div>
                                <div><span style="opacity:0.6;">Commits:</span><br/><b>${(r.total_commits || 0).toLocaleString()}</b></div>
                                <div><span style="opacity:0.6;">Share:</span><br/><b>${shareStr}%</b></div>
                                ${params.seriesName.includes('Scouts') ? "" : `<div><span style="opacity:0.6;">Rank:</span><br/><b>Top ${(100 - (r.percentile_raw || 0) + 0.1).toFixed(1)}%</b></div>`}
                            </div>
                            ${focusHtml}
                        </div>`;
                }
            },
            xAxis: {
                ...axisStyle,
                type: 'value',
                min: 2008.5,
                max: 2025.5,
                splitLine: { show: false },
                name: 'Year Joined',
                nameLocation: 'middle',
                nameGap: 35
            },
            yAxis: {
                ...axisStyle,
                type: 'log',
                name: 'Total Commits (Depth)',
                nameLocation: 'middle',
                nameGap: 55,
                axisLabel: { formatter: (v) => v >= 1 ? v.toLocaleString() : v }
            },
            series: series
        });
        console.timeEnd("loadContributorLandscape");
    } catch (e) {
        console.error("Galaxy Rendering Error:", e);
        console.timeEnd("loadContributorLandscape");
    }
}

async function loadCorporateEra() {
    try {
        const response = await fetch('data/stats_corporate.json');
        if (!response.ok) return;
        const data = await response.json();

        const chart = echarts.init(document.getElementById('chart-corporate'));
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                formatter: function (params) {
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${params[0].axisValue}</b></div>`;
                    params.forEach(p => {
                        html += `
                        <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${formatPct(p.value)}</b></span>
                        </div>`;
                    });
                    return html;
                }
            },
            legend: { ...legendStyle, bottom: 0 },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: { ...axisStyle, type: 'value', max: 100, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => formatPct(v) } },
            series: data.series.map(s => {
                let name = s.name;
                if (name.includes('Sponsor') || name.includes('Corporate')) name = 'Sponsored';
                if (name.includes('Independent') || name.includes('Hobbyist')) name = 'Independent';

                return {
                    ...s,
                    name: name,
                    data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length),
                    smooth: true,
                    symbol: 'none'
                };
            })
        });
    } catch (e) { console.error(e); }
}

async function loadMaintainerIndependence() {
    try {
        const response = await fetch('data/stats_maintainer_independence.json');
        if (!response.ok) return;
        const data = await response.json();

        const chartEl = document.getElementById('chart-maintainer-independence');
        if (!chartEl) return;
        const chart = echarts.init(chartEl);

        // Color mapping for sponsors
        const sponsorColors = {
            'Brink': GHIBLI_PALETTE[2],           // Green
            'Chaincode Labs': GHIBLI_PALETTE[0],  // Blue
            'Spiral (Block/Square)': GHIBLI_PALETTE[4], // Orange
            'Blockstream': GHIBLI_PALETTE[10],    // Ocean
            'MIT Digital Currency Initiative': GHIBLI_PALETTE[6], // Gold
            'OpenSats': GHIBLI_PALETTE[8],        // Rose
            'Independent': GHIBLI_PALETTE[17],    // Earth/Brown
            'Clearwing Software': GHIBLI_PALETTE[15], // Sakura/Pink ish
            'default': GHIBLI_PALETTE[19]         // Cloud
        };

        function updateIndependenceChart(viewType) {
            const viewData = data[viewType]; // 'active' or 'all_time'

            // Map maintainer names to sponsors for tooltip
            const maintainersBySponsor = {};
            data.maintainers.forEach(m => {
                // For 'active' view, only show active maintainers
                if (viewType === 'active' && m.status !== 'active') return;

                if (!maintainersBySponsor[m.sponsor]) maintainersBySponsor[m.sponsor] = [];
                maintainersBySponsor[m.sponsor].push(m.name);
            });

            const pieData = viewData.by_sponsor.map(item => ({
                name: item.name,
                value: item.value,
                itemStyle: {
                    color: sponsorColors[item.name] || sponsorColors['default']
                },
                maintainers: maintainersBySponsor[item.name] || []
            }));

            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'item',
                    formatter: function (params) {
                        const pct = (params.value / viewData.total * 100).toFixed(0);
                        const names = params.data.maintainers.map(n => `• ${n}`).join('<br/>');
                        return `
                            <div style="font-weight:bold; margin-bottom:4px; color:${params.color}">${params.name}</div>
                            <div style="font-size:12px; margin-bottom:8px;"><b>${params.value}</b> maintainer${params.value > 1 ? 's' : ''} (${pct}%)</div>
                            <div style="font-size:11px; color:${COLORS.textSecondary}; border-top:1px solid #eee; padding-top:6px;">
                                ${names}
                            </div>
                        `;
                    }
                },
                legend: {
                    ...legendStyle,
                    orient: 'horizontal',
                    bottom: 0,
                    left: 'center',
                    type: 'scroll',
                    data: pieData.map(d => d.name)
                },
                series: [{
                    type: 'pie',
                    radius: ['45%', '70%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                            formatter: '{d}%'
                        },
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
                    },
                    data: pieData
                }],
                graphic: [{
                    type: 'text',
                    left: 'center',
                    top: '40%',
                    style: {
                        text: viewData.total,
                        fill: COLORS.textPrimary,
                        fontSize: 28,
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }
                }, {
                    type: 'text',
                    left: 'center',
                    top: '52%',
                    style: {
                        text: viewType === 'active' ? 'Active' : 'Total',
                        fill: COLORS.textLight,
                        fontSize: 11,
                        textAlign: 'center',
                        textTransform: 'uppercase'
                    }
                }]
            }, true); // Use true to replace all options
        }

        // Initialize with 'active'
        updateIndependenceChart('active');

        // Event Listeners for Toggles
        const btnActive = document.getElementById('btn-maintainer-active');
        const btnAll = document.getElementById('btn-maintainer-all');

        if (btnActive && btnAll) {
            btnActive.addEventListener('click', () => {
                btnActive.classList.add('active');
                btnAll.classList.remove('active');
                btnActive.style.background = '#fff';
                btnActive.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btnAll.style.background = 'transparent';
                btnAll.style.boxShadow = 'none';
                btnAll.style.color = '#718096';
                btnActive.style.color = '#2D3748';
                updateIndependenceChart('active');
            });
            btnAll.addEventListener('click', () => {
                btnAll.classList.add('active');
                btnActive.classList.remove('active');
                btnAll.style.background = '#fff';
                btnAll.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btnActive.style.background = 'transparent';
                btnActive.style.boxShadow = 'none';
                btnActive.style.color = '#718096';
                btnAll.style.color = '#2D3748';
                updateIndependenceChart('all_time');
            });
        }

        // Store for resize
        charts.maintainerIndependence = chart;

    } catch (e) { console.error("Maintainer Independence Error:", e); }
}


async function loadGeography() {
    try {
        const response = await fetch('data/stats_geography.json');
        if (!response.ok) return;
        const json = await response.json();
        const data = json.data.reverse(); // Top 15, reverse for bar chart bottom-up

        const chart = echarts.init(document.getElementById('chart-geography'));
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Impact by Geography', left: 'center', top: 0, textStyle: { color: COLORS.textLight, fontSize: 12, fontWeight: 500 } },
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            grid: { left: '4%', right: '10%', bottom: '5%', containLabel: true },
            xAxis: { type: 'value', show: false },
            yAxis: {
                ...axisStyle,
                type: 'category',
                data: data.map(d => d.name),
                axisLabel: { ...axisStyle.axisLabel, color: COLORS.textSecondary }
            },
            series: [{
                type: 'bar',
                data: data.map(d => ({ value: d.value, itemStyle: { borderRadius: [0, 4, 4, 0] } })),
                color: GHIBLI_PALETTE[2],
                label: {
                    show: true,
                    position: 'right',
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    fontWeight: 'bold'
                }
            }]
        });
    } catch (e) { console.error(e); }
}

// Initialized via DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', init);

async function loadCodebaseSnapshots() {
    try {
        // 1. KPIs
        // Load Vital Signs for Codebase Size
        try {
            const resVital = await fetch('data/dashboard_vital_signs.json');
            const dataVital = await resVital.json();
            if (document.getElementById('kpi-total-lines')) {
                document.getElementById('kpi-total-lines').innerText = (dataVital.current_codebase_size / 1000000).toFixed(2) + "M";
            }
        } catch (e) { }

        const res = await fetch('data/stats_codebase_snapshots.json');
        if (!res.ok) return;
        const data = await res.json();

        // Calculate Totals from Snapshots
        const totalFiles = data.files_by_cat.reduce((acc, curr) => acc + curr.value, 0);

        // Define Proper Programming Languages (Excluding Assets, Docs, Build tools)
        const properLangNames = ["C++", "Python", "C", "Shell", "Web", "Java", "Perl"];
        const curatedLangs = data.files_by_lang.filter(l => properLangNames.includes(l.name));
        const totalLangs = curatedLangs.length;

        if (document.getElementById('kpi-total-files')) document.getElementById('kpi-total-files').innerText = totalFiles.toLocaleString();
        if (document.getElementById('kpi-total-langs')) document.getElementById('kpi-total-langs').innerText = totalLangs;


        // Files by Lang (Bar)
        if (charts.filesLang) {
            const slice = curatedLangs.slice(0, 10); // Use curated list
            charts.filesLang.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0];
                        const val = item.value / totalFiles * 100;
                        const pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        return `<b>${item.name}</b><br/><b>${item.value.toLocaleString()} Files</b> (${pct}%)`;
                    }
                },
                grid: { left: '4%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', show: false },
                yAxis: { ...axisStyle, type: 'category', data: slice.map(x => x.name), inverse: true },
                series: [{
                    name: 'Files',
                    type: 'bar',
                    data: slice.map(x => x.value),
                    itemStyle: { color: GHIBLI_PALETTE[2], borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' }
                }]
            });
        }

        if (charts.filesCat) {
            const slice = data.files_by_cat;
            charts.filesCat.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0];
                        const val = item.value / totalFiles * 100;
                        const pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        return `<b>${item.name}</b><br/><b>${item.value.toLocaleString()} Files</b> (${pct}%)`;
                    }
                },
                grid: { left: '4%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', show: false },
                yAxis: { ...axisStyle, type: 'category', data: slice.map(x => x.name), inverse: true, axisLabel: { ...axisStyle.axisLabel, fontSize: 10 } },
                series: [{
                    name: 'Files',
                    type: 'bar',
                    data: slice.map(x => x.value),
                    itemStyle: { color: GHIBLI_PALETTE[5], borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' }
                }]
            });
        }

    } catch (e) { console.error("Codebase Snapshots Error", e); }
}



async function loadStreamgraph() {
    try {
        const res = await fetch('data/stats_stack_evolution.json');
        if (!res.ok) return;
        const data = await res.json();

        // Filter dates <= 2025
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredX = validIndices.map(i => data.xAxis[i]);

        // Transform to ThemeRiver format: [date, value, id]
        const riverData = [];
        data.series.forEach(s => {
            validIndices.forEach(idx => {
                // ECharts ThemeRiver needs exact date strings, usually YYYY-MM-DD
                // Our xAxis is YYYY-MM. Let's append -01
                const date = data.xAxis[idx] + "-01";
                const val = s.data[idx];
                if (val > 0) {
                    riverData.push([date, val, s.name]);
                }
            });
        });

        charts.streamgraph.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } },
                formatter: function (params) {
                    // ThemeRiver tooltip params is just the single point if trigger item, 
                    // or array if trigger axis? ThemeRiver axis trigger is tricky.
                    // Actually usually 'axis' works but it gives all points at that time.

                    if (!params || !params.length) return "";

                    const dateStr = params[0].axisValue; // "2024-12-01"
                    // Format date to "Dec 2024"
                    const dateObj = new Date(dateStr);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

                    let total = 0;
                    params.forEach(p => total += p.value[1]);

                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${formattedDate}</b></div>`;
                    html += `<div style="margin-bottom:5px; font-size:11px;">Total: <b>${(total / 1000).toFixed(0)}k</b> Lines</div>`;

                    // Sort descending
                    const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);

                    sorted.forEach(p => {
                        const val = p.value[1];
                        const name = p.value[2];
                        const pct = (val / total * 100).toFixed(1);
                        html += `
                        <div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;">
                            <span>${p.marker} ${name}</span>
                            <span><b>${pct}%</b> <span style="opacity:0.7">(${(val / 1000).toFixed(1)}k)</span></span>
                        </div>`;
                    });

                    return html;
                },
                ...tooltipStyle
            },
            legend: {
                ...legendStyle,
                data: data.series.map(s => s.name),
                bottom: 0
            },
            singleAxis: {
                top: 50,
                bottom: 50,
                axisTick: { show: false },
                axisLabel: { ...axisStyle.axisLabel },
                type: 'time',
                axisPointer: {
                    animation: true,
                    label: { show: true }
                },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.2 } }
            },
            series: [{
                type: 'themeRiver',
                emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } },
                data: riverData,
                label: { show: false },  // Too cluttered usually
                itemStyle: {
                    shadowBlur: 2,
                    shadowColor: 'rgba(0,0,0,0.3)'
                }
            }],
            color: GHIBLI_PALETTE.slice(2) // Match stack colors roughly
        });

    } catch (e) { console.error("Streamgraph Error", e); }
}

async function loadCategoryHistory() {
    try {
        const res = await fetch('data/stats_category_history.json');
        if (!res.ok) return;
        const data = await res.json();

        // 1. Filter dates <= 2025
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);

        // 2. Transform to ThemeRiver format: [date, value, id]
        const riverData = [];
        data.series.forEach(s => {
            validIndices.forEach(idx => {
                const date = data.xAxis[idx] + "-01"; // "2024-12" -> "2024-12-01"
                const val = s.data[idx];
                if (val > 0) {
                    riverData.push([date, val, s.name]);
                }
            });
        });

        charts.catEvolution.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } },
                formatter: function (params) {
                    if (!params || !params.length) return "";

                    const dateStr = params[0].axisValue;
                    const dateObj = new Date(dateStr);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

                    let total = 0;
                    params.forEach(p => total += p.value[1]);

                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${formattedDate}</b></div>`;
                    html += `<div style="margin-bottom:5px; font-size:11px;">Total: <b>${(total / 1000).toFixed(0)}k</b> Lines</div>`;

                    const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);

                    sorted.forEach(p => {
                        const val = p.value[1];
                        const name = p.value[2];
                        const pct = (val / total * 100).toFixed(1);
                        html += `
                        <div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;">
                            <span>${p.marker} ${name}</span>
                            <span><b>${pct}%</b> <span style="opacity:0.7">(${(val / 1000).toFixed(1)}k)</span></span>
                        </div>`;
                    });

                    return html;
                },
                ...tooltipStyle
            },
            legend: {
                ...legendStyle,
                data: data.series.map(s => s.name),
                bottom: 0,
                type: 'scroll'
            },
            singleAxis: {
                top: 50,
                bottom: 50,
                axisTick: { show: false },
                axisLabel: { ...axisStyle.axisLabel },
                type: 'time',
                axisPointer: {
                    animation: true,
                    label: { show: true }
                },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.2 } }
            },
            series: [{
                type: 'themeRiver',
                emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } },
                data: riverData,
                label: { show: false },
                itemStyle: {
                    shadowBlur: 2,
                    shadowColor: 'rgba(0,0,0,0.3)'
                }
            }],
            color: GHIBLI_PALETTE // Use full palette for categories (more distinct)
        });

    } catch (e) { console.error("Category History Error", e); }
}

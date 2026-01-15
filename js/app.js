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
    // Refresh palette from CSS variables just before initialization
    GHIBLI_PALETTE = getGhibliPalette();

    function initChart(id) {
        const el = document.getElementById(id);
        return el ? echarts.init(el) : null;
    }

    // Vital Signs Snapshots (Reused)
    charts.snapshotWork = initChart('chart-snapshot-work');
    charts.snapshotVolume = initChart('chart-snapshot-volume');
    charts.snapshotStack = initChart('chart-snapshot-stack');

    // Codebase New Charts
    charts.filesLang = initChart('chart-snapshot-files-lang');
    charts.filesCat = initChart('chart-snapshot-files-cat');
    charts.stackEvolution = initChart('chart-stack-evolution');
    charts.catEvolution = initChart('chart-category-evolution');

    // Trends
    charts.heatmap = initChart('chart-heatmap');
    charts.weekend = initChart('chart-weekend');
    charts.category = initChart('chart-category');
    charts.growth = initChart('chart-growth');
    charts.engagement = initChart('chart-engagement-tiers'); // New
    charts.social = initChart('chart-social');
    charts.maintainers = initChart('chart-maintainers');

    // Contributor Landscape
    charts.landscape = initChart('chart-contributor-landscape');

    window.addEventListener('resize', () => {
        Object.values(charts).forEach(c => c && c.resize());
    });

    // Load data based on presence matches
    // Common Snapshots
    if (charts.snapshotWork || charts.snapshotVolume || charts.snapshotStack) await loadSnapshots();

    // Codebase Page
    if (charts.stackEvolution) {
        await loadCodebaseSnapshots();
        await loadStackEvolution();
    }
    if (charts.catEvolution) await loadCategoryHistory();

    // Index Page
    if (document.getElementById('kpi-contributors')) await loadVitalSigns();
    if (charts.category) await loadCategory();
    if (charts.growth) await loadGrowth();
    if (charts.engagement) await loadEngagementTiers(); // New
    if (charts.social) await loadSocial();

    // Health Page
    if (charts.maintainers) await loadMaintainers();
    if (charts.heatmap) await loadStory();
    if (document.getElementById('chart-corporate')) await loadCorporateEra();
    if (document.getElementById('chart-geography')) await loadGeography();

    // Contributors Page
    if (charts.landscape) await loadContributorLandscape();
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

        // Remove 2026 columns if present
        if (data.xAxis.some(x => parseInt(x) >= 2026)) {
            const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
            data.xAxis = validIndices.map(i => data.xAxis[i]);
            data.series.forEach(s => {
                s.data = validIndices.map(i => s.data[i]);
            });
        }

        charts.category.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: COLORS.textSecondary } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);

                    let tooltipHtml = `<div style="margin-bottom:8px; border-bottom:1px solid ${COLORS.border}; padding-bottom:4px;"><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:11px; color:${COLORS.textLight}; margin-bottom:8px;">Total Activity: <b>${total.toLocaleString()}</b> Commits</div>`;

                    const sorted = [...params].sort((a, b) => b.value - a.value);

                    sorted.forEach(p => {
                        const rawPct = total > 0 ? (p.value / total * 100) : 0;
                        const pctStr = rawPct < 5 ? rawPct.toFixed(1) : rawPct.toFixed(0);

                        if (p.value > 0) {
                            tooltipHtml += `
                            <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                                <span>${p.marker} ${p.seriesName}</span>
                                <span><b>${pctStr}%</b> <span style="color:${COLORS.textLight}; font-size:10px;">(${p.value.toLocaleString()})</span></span>
                            </div>`;
                        }
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                ...legendStyle,
                data: data.categories,
                bottom: 0,
                type: 'scroll'
            },
            color: GHIBLI_PALETTE,
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis
            },
            yAxis: {
                ...axisStyle,
                type: 'value',
                name: 'Commits',
                nameGap: 10
            },
            series: data.series.map(s => ({
                ...s,
                symbol: 'none',
                smooth: true,
                emphasis: { focus: 'series', lineStyle: { width: 3 } }
            }))
        });
    } catch (e) { console.error("Category Load Error", e); }
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
                    const pct = (p.value / totalCommits * 100).toFixed(1);
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
                    formatter: (p) => (p.value / totalCommits * 100).toFixed(0) + "%",
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
        const res = await fetch('data/stats_maintainers.json');
        const data = await res.json();

        // Filter out 2026+
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredX = validIndices.map(i => data.xAxis[i]);
        const filteredData = validIndices.map(i => data.series[0].data[i]);

        charts.maintainers.setOption({
            backgroundColor: 'transparent',
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredX },
            yAxis: { ...axisStyle, type: 'value', name: 'Maintainers' },
            series: [{
                name: 'Active Maintainers',
                type: 'line',
                step: 'start',
                data: filteredData,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(91, 130, 102, 0.3)' }, // Leaf
                        { offset: 1, color: 'rgba(91, 130, 102, 0.05)' }
                    ])
                },
                itemStyle: { color: GHIBLI_PALETTE[2] }
            }]
        });
    } catch (e) { }
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
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredXW },
            yAxis: { ...axisStyle, type: 'value', max: 0.5, name: 'Ratio' },
            series: filteredSeriesW,
            color: GHIBLI_PALETTE.slice(4)
        });
    } catch (e) { }
}

async function loadContributorLandscape() {
    try {
        const res = await fetch('data/contributors_rich.json');
        const rawData = await res.json();

        // Prepare data series - Filter for contributors up to 2025
        const seriesData = rawData
            .filter(item => item.cohort_year <= 2025)
            .map(item => {
                return {
                    // Dim 0: x (Year), Dim 1: y (Commits), Dim 2: size (Impact), Dim 3: Color (Last Active), Dim 4: Name
                    value: [
                        item.cohort_year,
                        item.total_commits,
                        item.impact,
                        Math.min(item.last_active_year, 2025), // Cap visual color at 2025
                        item.name
                    ],
                    raw: item
                };
            });

        // Dynamic Range for Years - Cap at 2025
        const years = seriesData.map(i => i.value[3]);
        const minYear = Math.min(...years);
        const maxYear = 2025;

        charts.landscape.setOption({
            backgroundColor: 'transparent',
            grid: { top: 80, right: 140, bottom: 80, left: 80 },
            title: {
                text: 'Contributor Landscape',
                subtext: `Bubble size = Total Commits • Color = Last Active Year`,
                left: 'center',
                top: 10,
                textStyle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
                subtextStyle: { color: COLORS.textLight, fontSize: 12 }
            },
            tooltip: {
                trigger: 'item',
                padding: 0,
                backgroundColor: '#1A202C', // Deep Navy/Charcoal
                borderColor: '#2D3748',
                borderWidth: 1,
                shadowBlur: 15,
                shadowColor: 'rgba(0,0,0,0.4)',
                formatter: function (params) {
                    const r = params.data.raw;
                    const loginPart = r.login && r.login !== "Anonymous" ? `<span style="color:#A0AEC0;">@${r.login}</span>` : "";
                    const badge = r.rank_label ? `<span style="background:#4A5568; padding:2px 6px; border-radius:4px; font-size:10px; color:#EDF2F7; margin-left:8px;">${r.rank_label}</span>` : "";
                    const company = r.company ? `🏢 ${r.company}` : "";
                    const loc = r.location ? `📍 ${r.location}` : "";
                    const metaRow = [company, loc].filter(x => x).join(" &nbsp; ");

                    const stats = `
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:12px; font-size:11px; border-top: 1px solid #2D3748; padding-top:10px;">
                            <div>📅 <b>${r.span}</b></div>
                            <div>💻 <b>${r.total_commits.toLocaleString()}</b> commits</div>
                            <div>📊 <b>${r.contribution_pct}%</b> share</div>
                            <div>🏆 <b>Top ${(100 - r.percentile_raw + 0.1).toFixed(1)}%</b></div>
                        </div>
                    `;

                    let focusStr = "";
                    const topFocus = Object.entries(r.focus_areas).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    if (topFocus.length > 0) {
                        const badges = topFocus.map(([cat, pct]) => `<span style="color:#CBD5E0;">${cat} ${(pct * 100).toFixed(0)}%</span>`).join(" • ");
                        focusStr = `<div style="margin-top:10px; border-top:1px solid #2D3748; padding-top:6px; font-size:10px;"><b>Active In:</b> ${badges}</div>`;
                    }

                    return `
                        <div style="width:260px; padding:15px; font-family:Inter, sans-serif; color:#EDF2F7;">
                            <div style="font-size:16px; font-weight:bold; color:#F6AD55; margin-bottom:2px;">${r.name}</div>
                            <div style="font-size:12px; margin-bottom:8px;">${loginPart}${badge}</div>
                            <div style="font-size:11px; color:#A0AEC0;">${metaRow}</div>
                            ${stats}
                            ${focusStr}
                        </div>
                    `;
                }
            },
            xAxis: {
                ...axisStyle,
                type: 'value',
                name: 'Cohort Year (First Commit)',
                nameLocation: 'middle',
                nameGap: 40,
                min: 2008,
                max: 2025,
                axisLabel: { ...axisStyle.axisLabel, fontSize: 12 }
            },
            yAxis: {
                ...axisStyle,
                type: 'log',
                name: 'Total Commits',
                nameGap: 50,
                nameLocation: 'middle',
                axisLabel: { ...axisStyle.axisLabel, fontSize: 12 }
            },
            visualMap: {
                type: 'continuous',
                dimension: 3,
                min: minYear,
                max: maxYear,
                text: ['Active', 'Retired'],
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: COLORS.textSecondary, fontSize: 11 },
                calculable: true,
                inRange: {
                    color: ['#3182CE', '#68D391', '#F6AD55'] // Blue -> Green -> Orange (Vibrant)
                }
            },
            series: [{
                type: 'scatter',
                symbolSize: function (data) {
                    return Math.max(6, Math.log10(data[1] + 1) * 10);
                },
                data: seriesData,
                itemStyle: {
                    shadowBlur: 5,
                    shadowColor: 'rgba(0,0,0,0.2)',
                    opacity: 0.7,
                    borderColor: 'rgba(255,255,255,0.4)',
                    borderWidth: 1
                },
                emphasis: {
                    focus: 'self',
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(255,255,255,0.3)',
                        borderColor: '#fff',
                        borderWidth: 2,
                        opacity: 1
                    }
                }
            }]
        });
    } catch (e) { console.error("Landscape Error:", e); }
}

async function loadCorporateEra() {
    try {
        const response = await fetch('data/stats_corporate.json');
        if (!response.ok) return;
        const data = await response.json();

        const chart = echarts.init(document.getElementById('chart-corporate'));
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { ...legendStyle, bottom: 0 },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: { ...axisStyle, type: 'value', max: 100, axisLabel: { ...axisStyle.axisLabel, formatter: '{value}%' } },
            series: data.series.map(s => ({
                ...s,
                data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length),
                smooth: true,
                symbol: 'none'
            }))
        });
    } catch (e) { console.error(e); }
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

init();

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

        // Calculate Totals form Snapshots
        const totalFiles = data.files_by_cat.reduce((acc, curr) => acc + curr.value, 0);
        const totalLangs = data.files_by_lang.length;

        if (document.getElementById('kpi-total-files')) document.getElementById('kpi-total-files').innerText = totalFiles.toLocaleString();
        if (document.getElementById('kpi-total-langs')) document.getElementById('kpi-total-langs').innerText = totalLangs;


        // Files by Lang (Bar)
        if (charts.filesLang) {
            const slice = data.files_by_lang.slice(0, 12);
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

async function loadStackEvolution() {
    try {
        const res = await fetch('data/stats_stack_evolution.json');
        if (!res.ok) return;
        const data = await res.json();

        charts.stackEvolution.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: COLORS.textSecondary } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);
                    let totalStr = total > 1000000 ? (total / 1000000).toFixed(2) + "M" : (total / 1000).toFixed(0) + "k";

                    let tooltipHtml = `<div style="margin-bottom:8px; border-bottom:1px solid ${COLORS.border}; padding-bottom:4px;"><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:11px; color:${COLORS.textLight}; margin-bottom:8px;">Total: <b>${totalStr}</b> Lines</div>`;

                    params.forEach(p => {
                        const pct = total > 0 ? (p.value / total * 100).toFixed(0) : 0;
                        let valStr = p.value > 1000000 ? (p.value / 1000000).toFixed(2) + "M" : (p.value / 1000).toFixed(0) + "k";
                        tooltipHtml += `
                        <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${pct}%</b> <span style="color:${COLORS.textLight}; font-size:10px;">(${valStr})</span></span>
                        </div>`;
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                ...legendStyle,
                data: data.series.map(s => s.name),
                bottom: 0,
                type: 'scroll'
            },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: { ...axisStyle, type: 'value', name: 'Lines of Code' },
            series: data.series.map(s => ({
                ...s,
                data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length),
                smooth: true,
                symbol: 'none',
                emphasis: { focus: 'series', lineStyle: { width: 3 } }
            }))
        });

    } catch (e) { console.error("Stack Evolution Error", e); }
}

async function loadCategoryHistory() {
    try {
        const res = await fetch('data/stats_category_history.json');
        if (!res.ok) return;
        const data = await res.json();

        charts.catEvolution.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: COLORS.textSecondary } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);
                    let totalStr = total > 1000000 ? (total / 1000000).toFixed(2) + "M" : (total / 1000).toFixed(0) + "k";

                    let tooltipHtml = `<div style="margin-bottom:8px; border-bottom:1 solid ${COLORS.border}; padding-bottom:4px;"><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:11px; color:${COLORS.textLight}; margin-bottom:8px;">Total: <b>${totalStr}</b> Lines</div>`;

                    params.forEach(p => {
                        const pct = total > 0 ? (p.value / total * 100).toFixed(0) : 0;
                        let valStr = p.value > 1000000 ? (p.value / 1000000).toFixed(2) + "M" : (p.value / 1000).toFixed(0) + "k";
                        tooltipHtml += `
                        <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${pct}%</b> <span style="color:${COLORS.textLight}; font-size:10px;">(${valStr})</span></span>
                        </div>`;
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                ...legendStyle,
                data: data.series.map(s => s.name),
                bottom: 0,
                type: 'scroll'
            },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: { ...axisStyle, type: 'value', name: 'Lines of Code' },
            series: data.series.map(s => ({
                ...s,
                data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length),
                smooth: true,
                symbol: 'none',
                emphasis: { focus: 'series', lineStyle: { width: 3 } }
            }))
        });

    } catch (e) { console.error("Category History Error", e); }
}

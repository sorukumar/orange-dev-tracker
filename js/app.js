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

let GHIBLI_PALETTE = getGhibliPalette();

const charts = {};
const chartConfig = {
    color: GHIBLI_PALETTE,
    backgroundColor: 'transparent',
    textStyle: { color: 'var(--text-secondary)', fontFamily: 'Inter' }
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
            charts.snapshotWork.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const strat = pct < 5 ? 1 : 0;

                        let valStr = "";
                        if (p.value > 1000) {
                            const valK = p.value / 1000;
                            const valStrat = valK < 10 ? 1 : 0;
                            valStr = valK.toFixed(valStrat) + "k";
                        } else {
                            valStr = p.value;
                        }

                        // "Activity by Area" is commits, so just number is fine, but user asked for "15k" format
                        return p.name + ': ' + valStr + ' (' + pct.toFixed(strat) + '%)';
                    }
                },
                legend: { show: false }, // No legend for donut to save space
                series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 5, borderColor: '#ffffff', borderWidth: 2 },
                    label: { show: false },
                    emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold', color: 'var(--secondary)' }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' } },
                    data: dataWork.data
                }],
                color: GHIBLI_PALETTE
            });
        } catch (e) { }
    }

    // Volume (Codebase Page Only now?)
    if (charts.snapshotVolume) {
        try {
            const resVol = await fetch('data/stats_code_volume.json');
            const dataVol = await resVol.json();
            charts.snapshotVolume.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const pctStrat = pct < 5 ? 1 : 0;

                        const valK = p.value / 1000;
                        const valStrat = valK < 5 ? 1 : 0;

                        return p.name + ': ' + valK.toFixed(valStrat) + 'k Lines (' + pct.toFixed(pctStrat) + '%)';
                    }
                },
                series: [{
                    type: 'pie',
                    radius: '60%',
                    label: { color: 'var(--text-secondary)' },
                    data: dataVol.data,
                }],
                color: GHIBLI_PALETTE
            });
        } catch (e) { }
    }

    // Tech Stack (Codebase Page Only now?)
    if (charts.snapshotStack) {
        try {
            const resStack = await fetch('data/stats_tech_stack.json');
            const dataStack = await resStack.json();
            // Top 8 for Pie visibility
            const pieData = dataStack.data.slice(0, 8);

            charts.snapshotStack.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const pctStrat = pct < 5 ? 1 : 0;

                        const valK = p.value / 1000;
                        const valStrat = valK < 5 ? 1 : 0;

                        return p.name + ': ' + valK.toFixed(valStrat) + 'k Lines (' + pct.toFixed(pctStrat) + '%)';
                    }
                },
                series: [{
                    type: 'pie',
                    radius: '60%',
                    label: { color: 'var(--text-secondary)' },
                    data: pieData,
                    itemStyle: { borderRadius: 5, borderColor: '#ffffff', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE.slice(2) // Offset for variety
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
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);

                    let tooltipHtml = `<div><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:10px; color:#aaa; margin-bottom:5px;">Total Activity: ${total.toLocaleString()}</div>`;

                    // Sort params by value desc for clearer tooltip
                    const sorted = [...params].sort((a, b) => b.value - a.value);

                    sorted.forEach(p => {
                        const rawPct = total > 0 ? (p.value / total * 100) : 0;
                        const pctStr = rawPct < 5 ? rawPct.toFixed(1) : rawPct.toFixed(0);

                        if (p.value > 0) {
                            tooltipHtml += `
                            <div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;">
                                <span>${p.marker} ${p.seriesName}</span>
                                <span><b>${pctStr}%</b> <span style="color:#888; font-size:10px;">(${p.value.toLocaleString()})</span></span>
                            </div>`;
                        }
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                data: data.categories,
                bottom: 0,
                type: 'scroll',
                pageTextStyle: { color: 'var(--text-primary)' },
                textStyle: { color: 'var(--text-secondary)' }
            },
            color: GHIBLI_PALETTE,
            grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: data.xAxis },
            yAxis: { type: 'value' },
            series: data.series.map(s => ({
                ...s,
                symbol: 'none',
                smooth: true
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
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', boundaryGap: false, data: filteredX },
                yAxis: { type: 'value' },
                series: [{
                    name: 'New Contributors',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(247, 147, 26, 0.8)' },
                            { offset: 1, color: 'rgba(247, 147, 26, 0.1)' }
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
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    const p = params[0];
                    const tier = tiers.find(t => t.name === p.name);
                    const pct = (p.value / totalCommits * 100).toFixed(1);
                    return `
                        <b>${p.name}</b><br/>
                        Contributors: <b>${tier ? tier.count : '-'}</b><br/>
                        Commits: <b>${p.value.toLocaleString()}</b> (${pct}%)
                    `;
                }
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', show: false },
            yAxis: {
                type: 'category',
                data: tiers.map(t => t.name).reverse(),
                axisLabel: { color: '#ccc', fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false }
            },
            series: [{
                type: 'bar',
                data: tiers.map(t => ({ value: t.val, itemStyle: { color: t.color } })).reverse(),
                label: {
                    show: true,
                    position: 'right',
                    formatter: (p) => (p.value / totalCommits * 100).toFixed(0) + "%",
                    color: '#fff'
                },
                barWidth: '60%'
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
            tooltip: { trigger: 'axis' },
            legend: { bottom: 0, textStyle: { color: 'var(--text-secondary)' } },
            xAxis: { type: 'category', data: filteredX },
            yAxis: [
                { type: 'value', name: 'Stars', position: 'left' },
                { type: 'value', name: 'Forks', position: 'right', splitLine: { show: false } }
            ],
            series: [
                { name: 'Stars', type: 'line', data: filteredStars, yAxisIndex: 0, showSymbol: false, itemStyle: { color: GHIBLI_PALETTE[4] } },
                { name: 'Forks', type: 'line', data: filteredForks, yAxisIndex: 1, showSymbol: false, itemStyle: { color: 'var(--secondary)' } }
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
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: filteredX },
            yAxis: { type: 'value' },
            series: [{
                name: 'Active Maintainers',
                type: 'line',
                step: 'start',
                data: filteredData,
                areaStyle: { opacity: 0.2 },
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
            tooltip: { position: 'top' },
            grid: { height: '80%', top: '10%' },
            xAxis: { type: 'category', data: filteredYears, splitArea: { show: true } },
            yAxis: { type: 'category', data: dataHM.hours, splitArea: { show: true } },
            visualMap: {
                min: 0,
                max: 800,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                inRange: { color: ['#F5F1EE', '#ACD7EC', '#3E6073'] } // Nature Breath: Cream -> Sky -> Deep Sea
            },
            color: GHIBLI_PALETTE,
            series: [{
                type: 'heatmap',
                data: filteredDataHM,
                itemStyle: { emphasis: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
            }]
        });

        const resW = await fetch('data/stats_weekend.json');
        const dataW = await resW.json();

        // Filter out 2026+
        const validIndicesW = dataW.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredXW = validIndicesW.map(i => dataW.xAxis[i]);
        const filteredSeriesW = dataW.series.map(s => ({
            ...s,
            data: validIndicesW.map(i => s.data[i])
        }));

        charts.weekend.setOption({
            title: { text: 'Weekend Coding Ratio', left: 'center', textStyle: { color: 'var(--text-secondary)' } },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: filteredXW },
            yAxis: { type: 'value', max: 0.5 },
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
            grid: { top: 60, right: 120, bottom: 60, left: 60 },
            title: {
                text: 'Contributor Landscape',
                subtext: `Colored by Last Active Year (Warm = Recent, Cold = Retired)`,
                left: 'center',
                top: 10
            },
            tooltip: {
                trigger: 'item',
                padding: 0,
                backgroundColor: '#ffffff',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                textStyle: { color: 'var(--text-primary)' },
                formatter: function (params) {
                    const r = params.data.raw;

                    // --- Header: Identity ---
                    const loginPart = r.login && r.login !== "Anonymous" ? `(@${r.login})` : "";
                    const badge = r.rank_label ? `<span style="background:#333; padding:2px 6px; border-radius:4px; font-size:10px; border:1px solid #777;">${r.rank_label}</span>` : "";

                    // --- Body: Metadata ---
                    const company = r.company ? `🏢 ${r.company}` : "";
                    const loc = r.location ? `📍 ${r.location}` : "";
                    const metaRow = [company, loc].filter(x => x).join(" &nbsp; ");

                    // --- Stats Grid ---
                    // Explicitly showing Percentile as requested
                    const stats = `
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-top:8px; font-size:11px;">
                            <div>📅 <b>${r.span}</b> (${r.tenure}y)</div>
                            <div>💻 <b>${r.total_commits.toLocaleString()}</b> commits</div>
                            <div>📊 <b>${r.contribution_pct}%</b> share</div>
                            <div>🏆 <b>Top ${(100 - r.percentile_raw + 0.1).toFixed(1)}%</b></div>
                        </div>
                    `;

                    // --- Footer: Focus Areas ---
                    let focusStr = "";
                    const topFocus = Object.entries(r.focus_areas)
                        .sort((a, b) => b[1] - a[1]) // Sort by % desc
                        .slice(0, 3); // Top 3 only

                    if (topFocus.length > 0) {
                        const badges = topFocus.map(([cat, pct]) =>
                            `<span style="color:#aaa;">${cat} ${(pct * 100).toFixed(0)}%</span>`
                        ).join(" • ");
                        focusStr = `<div style="margin-top:8px; border-top:1px solid #444; padding-top:4px; font-size:10px;"><b>Focus:</b> ${badges}</div>`;
                    }

                    return `
                        <div style="width:240px; padding:10px; font-family:sans-serif;">
                            <div style="border-bottom:1px solid #555; padding-bottom:5px; margin-bottom:5px;">
                                <div style="font-size:14px; color:#fff; font-weight:bold;">${r.name}</div>
                                <div style="font-size:11px; color:#aaa; margin-top:2px;">${loginPart} ${badge}</div>
                            </div>
                            <div style="font-size:11px; color:#ddd; margin-bottom:4px;">${metaRow}</div>
                            ${stats}
                            ${focusStr}
                        </div>
                    `;
                }
            },
            xAxis: {
                type: 'value',
                name: 'Cohort Year (First Commit)',
                nameLocation: 'middle',
                nameGap: 30,
                min: 2008,
                max: 2025,
                splitLine: { show: false },
                axisLabel: { formatter: '{value}' }
            },
            yAxis: {
                type: 'log',
                name: 'Total Commits (Log Scale)',
                splitLine: { lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            visualMap: {
                type: 'continuous',
                dimension: 3,
                min: minYear,
                max: maxYear,
                text: ['Recent', 'Old'],
                orient: 'vertical',
                right: 0,
                top: 'middle',
                textStyle: { color: 'var(--text-secondary)', fontSize: 10 },
                calculable: true,
                inRange: {
                    color: ['#3E6073', '#A2C5AC', '#E07A5F'] // Ocean -> Sage -> Sunset (Harmonious Transition)
                }
            },
            series: [{
                type: 'scatter',
                // Size based on Commits, log scaled - Cleaner Look
                symbolSize: function (data) {
                    // data[1] is Total Commits
                    // Log scale: log10(1) = 0, log10(10) = 1, log10(100) = 2, log10(1000) = 3, log10(10k) = 4
                    // Previous was impact (huge numbers). Commits are smaller.
                    // Multiplier 8 gives: 1 commit -> 4px, 100 -> 16px+4=20px, 1000 -> 24+4=28px
                    return Math.max(4, Math.log10(data[1] + 1) * 8);
                },
                data: seriesData,
                itemStyle: {
                    shadowBlur: 2,
                    shadowColor: 'rgba(0,0,0,0.1)',
                    opacity: 0.6, // Increased transparency for density awareness
                    borderColor: 'rgba(255,255,255,0.5)', // Softened border
                    borderWidth: 0.5
                },
                emphasis: {
                    focus: 'self',
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(255,255,255,0.5)',
                        borderColor: '#fff',
                        borderWidth: 2
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
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { bottom: 0, textStyle: { color: 'var(--text-secondary)' } },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
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
            title: { text: 'Top Contributors by Location', left: 'center', textStyle: { color: '#888', fontSize: 12 } },
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', show: false },
            yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: "var(--text-secondary)" } },
            series: [{
                type: 'bar',
                data: data.map(d => d.value),
                color: GHIBLI_PALETTE[2],
                label: { show: true, position: 'right', color: "var(--text-primary)" }
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
            // Top 10 + Consolidated "Others"? No, just Top 12 for clarity
            const slice = data.files_by_lang.slice(0, 12);
            charts.filesLang.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0];
                        const val = item.value / totalFiles * 100;
                        const pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        return `${item.name}<br/><b>${item.value} Files</b> (${pct}%)`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', splitLine: { show: false } }, // Reversed? No, standard bar
                yAxis: { type: 'category', data: slice.map(x => x.name), axisLabel: { color: 'var(--text-secondary)' }, inverse: true }, // Inverse to show Top at top
                series: [{
                    name: 'Files',
                    type: 'bar',
                    data: slice.map(x => x.value),
                    itemStyle: { color: GHIBLI_PALETTE[2], borderRadius: [0, 4, 4, 0] }
                }]
            });
        }

        // Files by Category (Bar)
        // Files by Category (Bar)
        if (charts.filesCat) {
            const slice = data.files_by_cat;
            charts.filesCat.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0];
                        const val = item.value / totalFiles * 100;
                        const pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        return `${item.name}<br/><b>${item.value} Files</b> (${pct}%)`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', splitLine: { show: false } },
                yAxis: { type: 'category', data: slice.map(x => x.name), axisLabel: { color: 'var(--text-secondary)', fontSize: 10 }, inverse: true },
                series: [{
                    name: 'Files',
                    type: 'bar',
                    data: slice.map(x => x.value),
                    itemStyle: { color: GHIBLI_PALETTE[5], borderRadius: [0, 4, 4, 0] }
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
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);

                    // Smart Total Formatting (M or k)
                    let totalStr = "";
                    if (total > 1000000) {
                        totalStr = (total / 1000000).toFixed(2) + "M";
                    } else if (total > 1000) {
                        totalStr = (total / 1000).toFixed(0) + "k";
                    } else {
                        totalStr = total.toFixed(0);
                    }

                    let tooltipHtml = `<div><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:10px; color:#aaa; margin-bottom:5px;">Total: ${totalStr} Lines</div>`;

                    params.forEach(p => {
                        const pct = total > 0 ? (p.value / total * 100).toFixed(0) : 0;

                        let valStr = "";
                        if (p.value > 1000000) valStr = (p.value / 1000000).toFixed(2) + "M";
                        else if (p.value > 1000) valStr = (p.value / 1000).toFixed(0) + "k";
                        else valStr = p.value.toFixed(0);

                        // Show marker + Name + Value + Pct
                        tooltipHtml += `
                        <div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${pct}%</b> <span style="color:#888; font-size:10px;">(${valStr})</span></span>
                        </div>`;
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                data: data.series.map(s => s.name),
                textStyle: { color: "#ccc" },
                bottom: 0
            },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: {
                type: 'value',
                name: 'Lines of Code'
            },
            series: data.series.map(s => ({
                ...s,
                data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length)
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
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);

                    // Smart Total Formatting (M or k)
                    let totalStr = "";
                    if (total > 1000000) {
                        totalStr = (total / 1000000).toFixed(2) + "M";
                    } else if (total > 1000) {
                        totalStr = (total / 1000).toFixed(0) + "k";
                    } else {
                        totalStr = total.toFixed(0);
                    }

                    let tooltipHtml = `<div><b>${params[0].axisValueLabel}</b></div>`;
                    tooltipHtml += `<div style="font-size:10px; color:#aaa; margin-bottom:5px;">Total: ${totalStr} Lines</div>`;

                    params.forEach(p => {
                        const pct = total > 0 ? (p.value / total * 100).toFixed(0) : 0;

                        let valStr = "";
                        if (p.value > 1000000) valStr = (p.value / 1000000).toFixed(2) + "M";
                        else if (p.value > 1000) valStr = (p.value / 1000).toFixed(0) + "k";
                        else valStr = p.value.toFixed(0);

                        // Show marker + Name + Value + Pct
                        tooltipHtml += `
                        <div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;">
                            <span>${p.marker} ${p.seriesName}</span>
                            <span><b>${pct}%</b> <span style="color:#888; font-size:10px;">(${valStr})</span></span>
                        </div>`;
                    });
                    return tooltipHtml;
                }
            },
            legend: {
                data: data.series.map(s => s.name),
                textStyle: { color: "#ccc" },
                bottom: 0
            },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.xAxis.filter(x => parseInt(x) <= 2025)
            },
            yAxis: {
                type: 'value',
                name: 'Lines of Code'
            },
            series: data.series.map(s => ({
                ...s,
                data: s.data.slice(0, data.xAxis.filter(x => parseInt(x) <= 2025).length)
            }))
        });

    } catch (e) { console.error("Category History Error", e); }
}

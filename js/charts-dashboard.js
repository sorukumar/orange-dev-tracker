/**
 * Dashboard specific chart loaders
 */

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
    // Shared between Dashboard and Codebase
    if (charts.snapshotWork) {
        try {
            const resWork = await fetch('data/stats_work_distribution.json');
            const dataWork = await resWork.json();
            charts.snapshotWork.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle,
                    trigger: 'item',
                    formatter: function (p) {
                        const pct = p.percent;
                        const strat = pct < 5 ? 1 : 0;
                        return `<b>${p.name}</b><br/>Commits: <b>${formatCount(p.value)}</b> (${pct.toFixed(strat)}%)`;
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
                        let html = `<b>${p.name}</b><br/>Lines: <b>${valK.toFixed(valStrat)}k</b> (${pct.toFixed(pctStrat)}%)`;
                        if (p.data.details) {
                            html += `<div style="font-size:10px; color:#718096; margin-top:4px; max-width:200px;">Includes: ${p.data.details}</div>`;
                        }
                        return html;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: '65%',
                    label: { color: COLORS.textSecondary, fontSize: 11 },
                    data: dataStack.data,
                    itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE.slice(2)
            });
        } catch (e) { }
    }
}

let categoryData = null;
let currentCategoryView = 'total';

async function loadCategory() {
    try {
        const res = await fetch('data/stats_category_evolution.json');
        categoryData = await res.json();

        setupCategoryToggles();
        renderCategory('total');

    } catch (e) {
        console.error("Category Evolution Error:", e);
    }
}

function setupCategoryToggles() {
    const btnTotal = document.getElementById('btn-category-total');
    const btnAuthored = document.getElementById('btn-category-authored');

    if (!btnTotal || !btnAuthored) return;

    const updateUI = (view) => {
        [btnTotal, btnAuthored].forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = '#718096';
            btn.style.boxShadow = 'none';
        });

        const activeBtn = view === 'total' ? btnTotal : btnAuthored;
        activeBtn.classList.add('active');
        activeBtn.style.background = '#fff';
        activeBtn.style.color = 'inherit';
        activeBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    };

    btnTotal.addEventListener('click', () => {
        if (currentCategoryView === 'total') return;
        currentCategoryView = 'total';
        updateUI('total');
        renderCategory('total');
    });

    btnAuthored.addEventListener('click', () => {
        if (currentCategoryView === 'authored') return;
        currentCategoryView = 'authored';
        updateUI('authored');
        renderCategory('authored');
    });
}

function renderCategory(view) {
    if (!charts.category || !categoryData) return;

    // Data Structure: { total: {categories, xAxis, series}, authored: {...} }
    const dataset = categoryData[view];
    if (!dataset) return;

    const validIndices = dataset.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
    const riverData = [];

    dataset.series.forEach(s => {
        validIndices.forEach(idx => {
            const date = dataset.xAxis[idx] + "-12-31";
            const val = s.data[idx];
            if (val > 0) riverData.push([date, val, s.name]);
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
                html += `<div style="font-size:11px; color:${COLORS.textLight}; margin-bottom:8px;">Total Activity: <b>${formatCount(total)}</b> Commits</div>`;
                const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);
                sorted.forEach(p => {
                    const val = p.value[1];
                    const name = p.value[2];
                    const pct = (total > 0 ? (val / total * 100) : 0).toFixed(1);
                    html += `
                    <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                        <span>${p.marker} ${name}</span>
                        <span><b>${pct}%</b> <span style="color:${COLORS.textLight}; font-size:10px;">(${formatCount(val)})</span></span>
                    </div>`;
                });
                return html;
            },
            ...tooltipStyle
        },
        legend: { ...legendStyle, data: dataset.categories, bottom: 0, type: 'scroll' },
        singleAxis: {
            top: 20, bottom: 60, type: 'time',
            axisTick: { show: false },
            axisLabel: { ...axisStyle.axisLabel },
            axisPointer: { animation: true, label: { show: true } },
            splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
        },
        series: [{
            type: 'themeRiver',
            emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } },
            data: riverData,
            label: { show: false },
            itemStyle: { shadowBlur: 2, shadowColor: 'rgba(0,0,0,0.1)' }
        }],
        color: GHIBLI_PALETTE
    }, true); // Use 'true' to clear previous
}

async function loadGrowth() {
    try {
        const res = await fetch('data/stats_contributor_growth.json');
        const data = await res.json();
        const newSeries = data.series.find(s => s.name === "New Contributors");
        if (newSeries) {
            const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
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
                    type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(224, 122, 95, 0.4)' },
                            { offset: 1, color: 'rgba(224, 122, 95, 0.05)' }
                        ])
                    },
                    lineStyle: { color: GHIBLI_PALETTE[4], width: 3 },
                    data: filteredData
                }]
            });
        }
    } catch (e) { }
}

let pyramidData = null;
let currentPyramidView = 'total';

async function loadEngagementTiers() {
    try {
        const res = await fetch('data/stats_engagement_tiers.json');
        pyramidData = await res.json();

        setupPyramidToggles();
        renderPyramid('total');

    } catch (e) {
        console.error("Engagement Pyramid Error:", e);
    }
}

function setupPyramidToggles() {
    const btnTotal = document.getElementById('btn-pyramid-total');
    const btnAuthored = document.getElementById('btn-pyramid-authored');

    if (!btnTotal || !btnAuthored) return;

    const updateUI = (view) => {
        [btnTotal, btnAuthored].forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = '#718096';
            btn.style.boxShadow = 'none';
        });

        const activeBtn = view === 'total' ? btnTotal : btnAuthored;
        activeBtn.classList.add('active');
        activeBtn.style.background = '#fff';
        activeBtn.style.color = 'inherit';
        activeBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    };

    btnTotal.addEventListener('click', () => {
        if (currentPyramidView === 'total') return;
        currentPyramidView = 'total';
        updateUI('total');
        renderPyramid('total');
    });

    btnAuthored.addEventListener('click', () => {
        if (currentPyramidView === 'authored') return;
        currentPyramidView = 'authored';
        updateUI('authored');
        renderPyramid('authored');
    });
}

function renderPyramid(view) {
    if (!charts.engagement || !pyramidData) return;

    // Data is already pre-calculated: [ {name, value, count, color_idx}, ... ]
    const tiers = pyramidData[view];
    if (!tiers) return;

    // Calculate total volume for percentages
    const totalVolume = tiers.reduce((sum, t) => sum + t.value, 0);

    charts.engagement.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            ...tooltipStyle,
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const p = params[0];
                const tier = tiers.find(t => t.name === p.name);
                const pct = formatPct(p.value / totalVolume, 1, true);
                return `
                    <div style="margin-bottom:4px; font-weight:bold;">${p.name}</div>
                    <div style="font-size:12px;">Contributors: <b>${tier ? tier.count : '-'}</b></div>
                    <div style="font-size:12px;">Commits: <b>${formatCount(p.value)}</b> (${pct}%)</div>
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
            data: tiers.map(t => ({
                value: t.value,
                itemStyle: {
                    color: GHIBLI_PALETTE[t.color_idx || 4], // Use index from backend or default
                    borderRadius: [0, 4, 4, 0]
                }
            })).reverse(),
            label: {
                show: true,
                position: 'right',
                formatter: (p) => formatPct(p.value / totalVolume, 0, true),
                color: COLORS.textSecondary,
                fontSize: 11,
                fontWeight: 'bold',
                distance: 10
            },
            barWidth: '50%'
        }]
    });
}

async function loadSocial() {
    try {
        const res = await fetch('data/stats_social_proof.json');
        const data = await res.json();
        const validIndices = data.xAxis.map((x, i) => parseInt(x.split('-')[0]) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredX = validIndices.map(i => data.xAxis[i]);
        const filteredStars = validIndices.map(i => data.stars[i]);
        const filteredForks = validIndices.map(i => data.forks[i]);

        charts.social.setOption({
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
                            <span><b>${formatCount(p.value)}</b></span>
                        </div>`;
                    });
                    return html;
                }
            },
            legend: { ...legendStyle, bottom: 0 },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredX },
            yAxis: [
                { ...axisStyle, type: 'value', name: 'Stars', position: 'left', axisLabel: { formatter: (v) => formatCount(v, 0) } },
                { ...axisStyle, type: 'value', name: 'Forks', position: 'right', splitLine: { show: false }, axisLabel: { formatter: (v) => formatCount(v, 0) } }
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
        const res = await fetch('data/stats_maintainer_independence.json?t=' + Date.now());
        const data = await res.json();
        const validMaintainers = data.maintainers.filter(m => m.active_years && m.active_years.length > 0);
        validMaintainers.sort((a, b) => Math.min(...a.active_years) - Math.min(...b.active_years));
        const names = validMaintainers.map(m => m.name);

        const seriesData = validMaintainers.map((m, idx) => {
            const start = Math.min(...m.active_years);
            const end = Math.max(...m.active_years);
            const isLatest = m.status === 'active';
            return {
                name: m.name,
                value: [idx, new Date(start, 0, 1).getTime(), new Date(end, 11, 31).getTime(), m.status, m.sponsor, m.active_years.length, m.merges_count || 0],
                itemStyle: { color: isLatest ? GHIBLI_PALETTE[2] : '#94A3B8', opacity: isLatest ? 0.9 : 0.6 }
            };
        });

        charts.maintainers.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                formatter: function (params) {
                    const status = params.value[3], sponsor = params.value[4], years_len = params.value[5], merges = params.value[6];
                    const start = new Date(params.value[1]).getFullYear(), end = new Date(params.value[2]).getFullYear();
                    const statusColor = status === 'active' ? '#48BB78' : '#718096';

                    let html = `
                        <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${params.name}</div>
                        <div style="color:${statusColor}; font-size:11px; font-weight:600; text-transform:uppercase; margin-bottom:8px;">${status}</div>
                        <div style="display:grid; grid-template-columns: 1fr; gap:4px; font-size:12px;">
                            <div>📅 <b>${start} — ${end}</b> (${years_len} years)</div>
                            <div>🏢 Sponsored by <b>${sponsor}</b></div>
                            <div>📝 <b>${merges}</b> merge${merges !== 1 ? 's' : ''}</div>
                        </div>
                    `;

                    if (merges === 0 && status === 'active') {
                        html += `<div style="color:#E8916B; font-size:10px; margin-top:8px; border-top:1px dashed #eee; padding-top:6px; font-style:italic;">
                                    Authorized with push access, but no merges recorded in the current dataset logs.
                                 </div>`;
                    }
                    return html;
                }
            },
            grid: { left: 160, right: 40, bottom: 40, top: 20 },
            xAxis: {
                type: 'time', min: new Date(2009, 0, 1).getTime(),
                axisLabel: { ...axisStyle.axisLabel, fontSize: 10 },
                axisLine: { show: false },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            yAxis: {
                type: 'category', data: names,
                axisLabel: { ...axisStyle.axisLabel, fontSize: 11, fontWeight: 500, color: COLORS.textPrimary },
                axisLine: { show: false }, axisTick: { show: false }
            },
            series: [{
                type: 'custom',
                renderItem: function (params, api) {
                    const categoryIndex = api.value(0);
                    const start = api.coord([api.value(1), categoryIndex]), end = api.coord([api.value(2), categoryIndex]);
                    const height = api.size([0, 1])[1] * 0.5;
                    return {
                        type: 'rect',
                        shape: { x: start[0], y: start[1] - height / 2, width: Math.max(end[0] - start[0], 4), height: height, r: 4 },
                        style: api.style()
                    };
                },
                itemStyle: { emphasis: { opacity: 1, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
                encode: { x: [1, 2], y: 0 },
                data: seriesData
            }]
        });
    } catch (e) { }
}

async function loadStory() {
    try {
        const resHM = await fetch('data/stats_heatmap.json');
        const dataHM = await resHM.json();
        const validYearIndices = dataHM.years.map((y, i) => parseInt(y) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredYears = validYearIndices.map(i => dataHM.years[i]);
        const filteredDataHM = dataHM.data.filter(item => validYearIndices.includes(item[0]));

        charts.heatmap.setOption({
            backgroundColor: 'transparent',
            tooltip: { ...tooltipStyle, position: 'top', formatter: (p) => `<b>${p.data[1]}:00</b> on ${p.data[0]}<br/>Commits: <b>${p.data[2]}</b>` },
            grid: { height: '75%', top: '5%', bottom: '15%' },
            xAxis: { ...axisStyle, type: 'category', data: filteredYears, splitArea: { show: true } },
            yAxis: { ...axisStyle, type: 'category', data: dataHM.hours, splitArea: { show: true } },
            visualMap: {
                min: 0, max: 800, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', itemWidth: 15,
                textStyle: { color: COLORS.textSecondary, fontSize: 10 },
                inRange: { color: ['#F5F1EE', '#ACD7EC', '#3E6073'] }
            },
            series: [{ type: 'heatmap', data: filteredDataHM, itemStyle: { emphasis: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
        });

        const resW = await fetch('data/stats_weekend.json');
        const dataW = await resW.json();
        const validIndicesW = dataW.xAxis.map((x, i) => parseInt(x) <= 2025 ? i : -1).filter(i => i !== -1);
        const filteredXW = validIndicesW.map(i => dataW.xAxis[i]);
        const filteredSeriesW = dataW.series.map(s => ({
            ...s, data: validIndicesW.map(i => s.data[i]), smooth: true, symbol: 'circle', symbolSize: 6
        }));

        charts.weekend.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Weekend Coding Ratio', left: 'center', top: 0, textStyle: { color: COLORS.textLight, fontSize: 12, fontWeight: 500 } },
            tooltip: {
                ...tooltipStyle, trigger: 'axis',
                formatter: function (params) {
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${params[0].axisValue}</b></div>`;
                    params.forEach(p => {
                        html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px;"><span>${p.marker} ${p.seriesName}</span><span><b>${formatPct(p.value, 1, true)}</b></span></div>`;
                    });
                    return html;
                }
            },
            grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', data: filteredXW },
            yAxis: { ...axisStyle, type: 'value', max: 0.5, name: 'Ratio', axisLabel: { ...axisStyle.axisLabel, formatter: (v) => formatPct(v, 0, true) } },
            series: filteredSeriesW,
            color: GHIBLI_PALETTE.slice(4)
        });
    } catch (e) { }
}

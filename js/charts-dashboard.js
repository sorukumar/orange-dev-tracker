/**
 * Dashboard specific chart loaders
 */

async function loadVitalSigns() {
    try {
        const [resTracker, resEco, resPulse] = await Promise.all([
            fetch(DATA_PATH_PREFIX + 'output/tracker/dashboard_vital_signs.json'),
            fetch(DATA_PATH_PREFIX + 'output/shared/ecosystem_summary.json'),
            fetch(DATA_PATH_PREFIX + 'output/shared/discussions_pulse.json').catch(() => null)
        ]);

        const data = await resTracker.json();
        const ecoData = await resEco.json();
        let pulseData = null;
        if (resPulse && resPulse.ok) {
            pulseData = await resPulse.json();
        }

        // 1. Contributors (All-time code / Active ecosystem)
        if (document.getElementById('kpi-contributors')) {
            const totalActive = (ecoData && ecoData.groups && ecoData.groups.total_active) ? ecoData.groups.total_active.toLocaleString() : "-";
            document.getElementById('kpi-contributors').innerText = totalActive;
            
            if (document.getElementById('kpi-contributors-core') && document.getElementById('kpi-contributors-eco')) {
                const coreContribs = data.core_contributors ? data.core_contributors.toLocaleString() : "-";
                const ecoContribs = data.eco_contributors ? data.eco_contributors.toLocaleString() : "-";
                document.getElementById('kpi-contributors-core').innerText = coreContribs;
                document.getElementById('kpi-contributors-eco').innerText = ecoContribs;
            } else if (document.getElementById('kpi-contributors-sub')) {
                const codeContribs = data.unique_contributors ? data.unique_contributors.toLocaleString() : "-";
                document.getElementById('kpi-contributors-sub').innerText = `${codeContribs} Code Contributors`;
            }
        }

        // 2. Maintainers: Total / Active
        if (document.getElementById('kpi-maintainers')) {
            const total = data.total_maintainers || "-";
            const active = data.unique_maintainers || "-";
            document.getElementById('kpi-maintainers').innerText = `${total} / ${active}`;
        }

        // 3. PRs Merged (All-time / Recent)
        if (document.getElementById('kpi-prs-merged')) {
            const totalPrs = ecoData.prs && ecoData.prs.total_merged ? ecoData.prs.total_merged.toLocaleString() : "-";
            document.getElementById('kpi-prs-merged').innerText = totalPrs;
            
            if (document.getElementById('kpi-prs-core') && document.getElementById('kpi-prs-eco')) {
                const corePrs = ecoData.prs && ecoData.prs.total_merged_core ? ecoData.prs.total_merged_core.toLocaleString() : "-";
                const ecoPrs = ecoData.prs && ecoData.prs.total_merged_eco ? ecoData.prs.total_merged_eco.toLocaleString() : "-";
                document.getElementById('kpi-prs-core').innerText = corePrs;
                document.getElementById('kpi-prs-eco').innerText = ecoPrs;
            } else if (document.getElementById('kpi-prs-merged-sub')) {
                const prs30d = ecoData.prs && ecoData.prs.merged_30d ? ecoData.prs.merged_30d.toLocaleString() : "0";
                document.getElementById('kpi-prs-merged-sub').innerText = `${prs30d} merged in last 30d`;
            }
        }

        // 4. Project Scale (Total Commits Main / Codebase LOC Subtext)
        if (document.getElementById('kpi-total-commits')) {
            document.getElementById('kpi-total-commits').innerText = data.total_commits ? data.total_commits.toLocaleString() : "-";
            
            if (document.getElementById('kpi-commits-core') && document.getElementById('kpi-commits-eco')) {
                const coreCommits = data.core_commits ? data.core_commits.toLocaleString() : "-";
                const ecoCommits = data.eco_commits ? data.eco_commits.toLocaleString() : "-";
                document.getElementById('kpi-commits-core').innerText = coreCommits;
                document.getElementById('kpi-commits-eco').innerText = ecoCommits;
            } else if (document.getElementById('kpi-codebase-sub')) {
                const size = data.current_codebase_size;
                const sizeStr = size ? (size / 1000000).toFixed(2) + "M" : "-";
                document.getElementById('kpi-codebase-sub').innerText = `Codebase: ${sizeStr} LOC`;
            }
        }

        // 5. Active BIPs
        if (document.getElementById('kpi-bips')) {
            const totalBips = ecoData.bips && ecoData.bips.total ? ecoData.bips.total.toLocaleString() : "-";
            const activeBips = ecoData.bips && ecoData.bips.active_recently ? ecoData.bips.active_recently.toLocaleString() : "0";
            document.getElementById('kpi-bips').innerText = totalBips;
            document.getElementById('kpi-bips-sub').innerText = `${activeBips} active / discussed recently`;
        }



        if (document.getElementById('freshness-line')) {
            const dateStr = data.generated_at ? new Date(data.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
            document.getElementById('freshness-line').innerText = `Data refreshed: ${dateStr}`;
        }

    } catch (e) {
        console.error("Vital Signs Error:", e);
    }
}

async function loadSnapshots() {
    // Shared between Dashboard and Codebase
    if (charts.snapshotWork) {
        try {
            const resWork = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_work_distribution.json');
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
                    itemStyle: { borderRadius: 8, borderColor: '#1A202C', borderWidth: 2 },
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
            const resVol = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_code_volume.json');
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
                    itemStyle: { borderRadius: 4, borderColor: '#1A202C', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE
            });
        } catch (e) { }
    }

    // Tech Stack (Codebase Page Only)
    if (charts.snapshotStack) {
        try {
            const resStack = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_tech_stack.json');
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
                    itemStyle: { borderRadius: 4, borderColor: '#1A202C', borderWidth: 1 }
                }],
                color: GHIBLI_PALETTE.slice(2)
            });
        } catch (e) { }
    }
}

let categoryData = null;
let currentCategoryView = 'authored';
let currentCategoryYearView = 'full';

async function loadCategory() {
    try {
        const res = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_category_evolution.json');
        categoryData = await res.json();

        setupCategoryYearToggles();
        renderCategory(currentCategoryView);

    } catch (e) {
        console.error("Category Evolution Error:", e);
    }
}

function setupCategoryYearToggles() {
    const btnFull = document.getElementById('btn-category-year-full');
    const btnYtd = document.getElementById('btn-category-year-ytd');

    if (!btnFull || !btnYtd) return;

    const updateUI = (view) => {
        [btnFull, btnYtd].forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = view === 'full' ? btnFull : btnYtd;
        activeBtn.classList.add('active');

        const badge = document.getElementById('badge-category-partial');
        if (badge) {
            badge.style.display = view === 'ytd' ? 'inline-block' : 'none';
        }
    };

    btnFull.addEventListener('click', () => {
        if (currentCategoryYearView === 'full') return;
        currentCategoryYearView = 'full';
        updateUI('full');
        renderCategory(currentCategoryView);
    });

    btnYtd.addEventListener('click', () => {
        if (currentCategoryYearView === 'ytd') return;
        currentCategoryYearView = 'ytd';
        updateUI('ytd');
        renderCategory(currentCategoryView);
    });
}

function renderCategory(view) {
    if (!charts.category || !categoryData) return;

    // Data Structure: { total: {categories, xAxis, series}, authored: {...} }
    const dataset = categoryData[view];
    if (!dataset) return;

    const riverData = [];

    dataset.series.forEach(s => {
        dataset.xAxis.forEach((datePart, idx) => {
            if (currentCategoryYearView === 'full' && datePart.startsWith('2026')) return;
            const date = datePart + "-12-31";
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
            axisLabel: {
                ...axisStyle.axisLabel,
                formatter: (val) => {
                    const date = new Date(val);
                    const year = date.getFullYear();
                    return year === 2026 ? "2026 (Partial)" : year.toString();
                }
            },
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

let growthData = null;
let currentGrowthYearView = 'full';

async function loadGrowth() {
    try {
        const res = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_contributor_growth.json');
        growthData = await res.json();
        setupGrowthYearToggles();
        renderGrowth();
    } catch (e) { }
}

function setupGrowthYearToggles() {
    const btnFull = document.getElementById('btn-growth-year-full');
    const btnYtd = document.getElementById('btn-growth-year-ytd');

    if (!btnFull || !btnYtd) return;

    const updateUI = (view) => {
        [btnFull, btnYtd].forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = view === 'full' ? btnFull : btnYtd;
        activeBtn.classList.add('active');

        const badge = document.getElementById('badge-growth-partial');
        if (badge) {
            badge.style.display = view === 'ytd' ? 'inline-block' : 'none';
        }
    };

    btnFull.addEventListener('click', () => {
        if (currentGrowthYearView === 'full') return;
        currentGrowthYearView = 'full';
        updateUI('full');
        renderGrowth();
    });

    btnYtd.addEventListener('click', () => {
        if (currentGrowthYearView === 'ytd') return;
        currentGrowthYearView = 'ytd';
        updateUI('ytd');
        renderGrowth();
    });
}

function renderGrowth() {
    if (!charts.growth || !growthData) return;
    const newSeries = growthData.series.find(s => s.name === "New Contributors");
    if (!newSeries) return;

    let filteredX = growthData.xAxis;
    let filteredData = newSeries.data;

    if (currentGrowthYearView === 'full') {
        const validIndices = filteredX.map((x, i) => x.startsWith('2026') ? -1 : i).filter(i => i !== -1);
        filteredX = validIndices.map(i => filteredX[i]);
        filteredData = validIndices.map(i => filteredData[i]);
    }

    charts.growth.setOption({
        backgroundColor: 'transparent',
        tooltip: { ...tooltipStyle, trigger: 'axis' },
        grid: { left: '4%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
            ...axisStyle,
            type: 'category',
            boundaryGap: false,
            data: filteredX.map(x => x === '2026' ? '2026 (Partial)' : x)
        },
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
    }, true);
}

let pyramidData = null;
let currentPyramidView = 'authored';

async function loadEngagementTiers() {
    try {
        const res = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_engagement_tiers.json');
        pyramidData = await res.json();

        renderPyramid(currentPyramidView);

    } catch (e) {
        console.error("Engagement Pyramid Error:", e);
    }
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
        const res = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_social_proof.json');
        const data = await res.json();
        const filteredX = data.xAxis;
        const filteredStars = data.stars;
        const filteredForks = data.forks;

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
            xAxis: {
                ...axisStyle,
                type: 'category',
                data: filteredX.map(x => x.startsWith('2026') ? x + ' (Partial)' : x)
            },
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


async function loadStory() {
    try {
        const resHM = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_heatmap.json');
        const dataHM = await resHM.json();
        const filteredYears = dataHM.years;
        const filteredDataHM = dataHM.data;

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

        const resW = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_weekend.json');
        const dataW = await resW.json();
        const filteredXW = dataW.xAxis;
        const filteredSeriesW = dataW.series.map(s => ({
            ...s, smooth: true, symbol: 'circle', symbolSize: 6
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

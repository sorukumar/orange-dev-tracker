/**
 * Health & Culture specific chart loaders
 */

async function loadCorporateEra() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_corporate.json');
        if (!response.ok) return;
        const data = await response.json();
        const chart = charts.corporate || echarts.init(document.getElementById('chart-corporate'));
        charts.corporate = chart;
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle, trigger: 'axis',
                formatter: function (params) {
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${params[0].axisValue}</b></div>`;
                    params.forEach(p => {
                        html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px;"><span>${p.marker} ${p.seriesName}</span><span><b>${formatPct(p.value)}</b></span></div>`;
                    });
                    return html;
                }
            },
            legend: { ...legendStyle, bottom: 0 },
            grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { ...axisStyle, type: 'category', boundaryGap: false, data: data.xAxis },
            yAxis: { ...axisStyle, type: 'value', max: 100, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => formatPct(v) } },
            series: data.series.map(s => {
                let name = s.name;
                if (name.includes('Sponsor') || name.includes('Corporate')) name = 'Sponsored';
                if (name.includes('Independent') || name.includes('Hobbyist')) name = 'Independent';
                return { ...s, name: name, smooth: true, symbol: 'none' };
            })
        });
    } catch (e) { }
}

async function loadMaintainerIndependence() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/shared/maintainers/stats_maintainers.json');
        if (!response.ok) return;
        const data = await response.json();
        const chartEl = document.getElementById('chart-maintainer-independence');
        if (!chartEl) return;
        const chart = echarts.init(chartEl);

        const sponsorColors = {
            'Brink': GHIBLI_PALETTE[2], 'Chaincode Labs': GHIBLI_PALETTE[0], 'Spiral (Block/Square)': GHIBLI_PALETTE[4],
            'Blockstream': GHIBLI_PALETTE[10], 'MIT Digital Currency Initiative': GHIBLI_PALETTE[6], 'OpenSats': GHIBLI_PALETTE[8],
            'Independent': GHIBLI_PALETTE[17], 'Clearwing Software': GHIBLI_PALETTE[15], 'default': GHIBLI_PALETTE[19]
        };

        function updateIndependenceChart(viewType) {
            const viewData = data[viewType];
            const maintainersBySponsor = {};
            data.maintainers.forEach(m => {
                if (viewType === 'active' && m.status !== 'active') return;
                if (!maintainersBySponsor[m.sponsor]) maintainersBySponsor[m.sponsor] = [];
                maintainersBySponsor[m.sponsor].push(m.name);
            });

            const pieData = viewData.by_sponsor.map(item => ({
                name: item.name, value: item.value,
                itemStyle: { color: sponsorColors[item.name] || sponsorColors['default'] },
                maintainers: maintainersBySponsor[item.name] || []
            }));

            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle, trigger: 'item',
                    formatter: function (params) {
                        const pct = (params.value / viewData.total * 100).toFixed(0);
                        const names = params.data.maintainers.map(n => `• ${n}`).join('<br/>');
                        return `
                            <div style="font-weight:bold; margin-bottom:4px; color:${params.color}">${params.name}</div>
                            <div style="font-size:12px; margin-bottom:8px;"><b>${params.value}</b> maintainer${params.value > 1 ? 's' : ''} (${pct}%)</div>
                            <div style="font-size:11px; color:${COLORS.textSecondary}; border-top:1px solid #eee; padding-top:6px;">${names}</div>
                        `;
                    }
                },
                legend: { ...legendStyle, orient: 'horizontal', bottom: 0, left: 'center', type: 'scroll', data: pieData.map(d => d.name) },
                series: [{
                    type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: true,
                    itemStyle: { borderRadius: 6, borderColor: '#1A202C', borderWidth: 2 },
                    label: { show: false },
                    emphasis: {
                        label: { show: true, fontSize: 14, fontWeight: 'bold', formatter: '{d}%' },
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' }
                    },
                    data: pieData
                }],
                graphic: [{
                    type: 'text', left: 'center', top: '40%',
                    style: { text: viewData.total, fill: COLORS.textPrimary, fontSize: 28, fontWeight: 'bold', textAlign: 'center' }
                }, {
                    type: 'text', left: 'center', top: '52%',
                    style: { text: viewType === 'active' ? 'Active' : 'Total', fill: COLORS.textLight, fontSize: 11, textAlign: 'center', textTransform: 'uppercase' }
                }]
            }, true);
        }

        updateIndependenceChart('active');
        const btnActive = document.getElementById('btn-maintainer-active'), btnAll = document.getElementById('btn-maintainer-all');
        if (btnActive && btnAll) {
            btnActive.addEventListener('click', () => {
                btnActive.classList.add('active'); btnAll.classList.remove('active');
                btnActive.style.background = '#fff'; btnActive.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btnAll.style.background = 'transparent'; btnAll.style.boxShadow = 'none';
                btnAll.style.color = '#718096'; btnActive.style.color = '#2D3748';
                updateIndependenceChart('active');
            });
            btnAll.addEventListener('click', () => {
                btnAll.classList.add('active'); btnActive.classList.remove('active');
                btnAll.style.background = '#fff'; btnAll.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                btnActive.style.background = 'transparent'; btnActive.style.boxShadow = 'none';
                btnActive.style.color = '#718096'; btnAll.style.color = '#2D3748';
                updateIndependenceChart('all_time');
            });
        }
        charts.maintainerIndependence = chart;
    } catch (e) { }
}

async function loadGeography() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_geography.json');
        if (!response.ok) return;
        const json = await response.json();
        const data = json.data.reverse();
        const chart = echarts.init(document.getElementById('chart-geography'));
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Impact by Geography', left: 'center', top: 0, textStyle: { color: COLORS.textLight, fontSize: 12, fontWeight: 500 } },
            tooltip: { ...tooltipStyle, trigger: 'axis' },
            grid: { left: '4%', right: '10%', bottom: '5%', containLabel: true },
            xAxis: { type: 'value', show: false },
            yAxis: { ...axisStyle, type: 'category', data: data.map(d => d.name), axisLabel: { ...axisStyle.axisLabel, color: COLORS.textSecondary } },
            series: [{
                type: 'bar', data: data.map(d => ({ value: d.value, itemStyle: { borderRadius: [0, 4, 4, 0] } })),
                color: GHIBLI_PALETTE[2],
                label: { show: true, position: 'right', color: COLORS.textSecondary, fontSize: 11, fontWeight: 'bold' }
            }]
        });
    } catch (e) { }
}

async function loadEmergingRegions() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_emerging_regions.json');
        if (!response.ok) return;
        const data = await response.json();
        const chart = echarts.init(document.getElementById('chart-emerging-regions'));

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis'
            },
            legend: {
                ...legendStyle,
                bottom: 0
            },
            grid: {
                left: '4%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                ...axisStyle,
                type: 'category',
                data: data.xAxis
            },
            yAxis: {
                ...axisStyle,
                type: 'value',
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            series: data.series.map((s, idx) => ({
                ...s,
                color: idx === 0 ? GHIBLI_PALETTE[3] : GHIBLI_PALETTE[12],
                barMaxWidth: 30,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                }
            }))
        });
        charts.emergingRegions = chart;
    } catch (e) { }
}

async function loadRegionalEvolution() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_regional_evolution.json');
        if (!response.ok) return;
        const data = await response.json();
        const chart = echarts.init(document.getElementById('chart-regional-evolution'));

        // Vibrant for emerging, subtle for established
        const regionColors = {
            'Africa': GHIBLI_PALETTE[4],           // Salmon/Orange
            'Latin America': GHIBLI_PALETTE[2],    // Green
            'Asia Pacific': GHIBLI_PALETTE[6],     // Blue
            'North America': '#718096',            // Slate
            'Europe': '#A0AEC0',                   // Grey-Blue
            'Undisclosed': '#CBD5E0'               // Clearly visible grey
        };

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis',
                axisPointer: { type: 'line', lineStyle: { opacity: 0.5 } },
                formatter: function (params) {
                    let total = 0;
                    params.forEach(p => total += p.value);
                    let html = `<div style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;"><b>Cohort Year: ${params[0].axisValue}</b></div>`;
                    html += `<div style="font-size:11px; color:#718096; margin-bottom:8px;">Total New Devs: <b>${total}</b></div>`;

                    // Sort by value to show largest contributors at top of tooltip
                    const sorted = [...params].sort((a, b) => b.value - a.value);
                    sorted.forEach(p => {
                        if (p.value > 0) {
                            const pct = ((p.value / total) * 100).toFixed(1);
                            html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:2px;">
                                <span>${p.marker} ${p.seriesName}</span>
                                <span><b>${p.value}</b> <span style="font-size:10px; opacity:0.7;">(${pct}%)</span></span>
                            </div>`;
                        }
                    });
                    return html;
                }
            },
            legend: {
                ...legendStyle,
                bottom: 0,
                icon: 'circle',
                selected: {
                    'Undisclosed': true
                }
            },
            grid: {
                left: '4%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.xAxis
            },
            yAxis: {
                ...axisStyle,
                type: 'value',
                name: 'New Devs',
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } }
            },
            series: data.series.map(s => ({
                ...s,
                type: 'line',
                stack: 'total',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    opacity: 0.8
                },
                lineStyle: { width: 0 },
                color: regionColors[s.name] || '#CBD5E0',
                emphasis: { focus: 'series' }
            }))
        });
        charts.regionalEvolution = chart;
    } catch (e) { }
}

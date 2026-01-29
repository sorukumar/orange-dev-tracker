/**
 * Contributors specific chart loaders
 */

async function loadContributorLandscape() {
    try {
        console.time("loadContributorLandscape");
        if (!charts.landscape) return;

        const res = await fetch('data/contributors_rich.json');
        const rawData = await res.json();

        const rankStyles = {
            'The Core (Top 1%)': { color: '#E07A5F', priority: 1, opacity: 1, symbol: 'diamond' },
            'The Contributors (Top 20%)': { color: '#F4A261', priority: 2, opacity: 0.9, symbol: 'circle' },
            'The Prospects (Bottom 80%)': { color: '#89B449', priority: 3, opacity: 0.7, symbol: 'circle' }
        };

        const portraits = {
            'Satoshi Nakamoto': 'assets/satoshi.png',
            'Gavin Andresen': 'assets/gavin_andresen.png',
            'Wladimir J. van der Laan': 'assets/wladimir.png',
            'MarcoFalke': 'assets/marcofalke.png',
            'Michael Ford': 'assets/michael_ford.png',
            'Pieter Wuille': 'assets/pieter_wuille.png',
            'Hal Finney': 'assets/hal_finney.png'
        };

        const historicalNotes = {
            "Satoshi Nakamoto": "Creator of Bitcoin and the original protocol designer.",
            "Gavin Andresen": "Early lead maintainer and first Bitcoin Core maintainer.",
            "Wladimir J. van der Laan": "Current lead maintainer of Bitcoin Core.",
            "Pieter Wuille": "Co-creator of SegWit and key consensus developer.",
            "MarcoFalke": "Lead maintainer and testing expert.",
            "Michael Ford": "Early contributor and developer.",
            "Hal Finney": "Second Bitcoin user and early advocate.",
            "sirius-m": "Martti Malmi, one of the first contributors and early website developer.",
            "Luke Dashjr": "Maintainer of Bitcoin Knots and early consensus developer."
        };

        const groupedSeries = {};
        Object.keys(rankStyles).forEach(rank => groupedSeries[rank] = []);

        rawData.filter(item => item && item.cohort_year && item.cohort_year <= 2025).forEach(item => {
            const p = item.percentile_raw || 0;
            let rank;
            if (p >= 99) rank = 'The Core (Top 1%)';
            else if (p >= 80) rank = 'The Contributors (Top 20%)';
            else rank = 'The Prospects (Bottom 80%)';

            const style = rankStyles[rank];
            const isActive = (item.last_active_year >= 2025);
            const portraitUrl = portraits[item.name];
            const valX = Number(item.cohort_year) + (Math.random() - 0.5) * 0.7;
            let valY = Math.max(1, Number(item.total_commits) || 1);
            if (valY <= 3) valY = Math.max(1, valY + (Math.random() - 0.5) * 0.6);
            const baseSize = Math.max(6, Math.log10(valY + 1) * 12 + 2);

            groupedSeries[rank].push({
                name: item.name,
                value: [valX, valY, item.impact, item.name, rank],
                raw: item,
                symbol: portraitUrl ? `image://${portraitUrl}` : style.symbol,
                symbolSize: portraitUrl ? baseSize * 1 : baseSize,
                itemStyle: {
                    color: style.color,
                    borderColor: (isActive || portraitUrl) ? '#fff' : 'transparent',
                    borderWidth: (isActive || portraitUrl) ? 1.5 : 0,
                    opacity: style.opacity
                }
            });
        });

        const series = Object.keys(rankStyles).map(rank => {
            const style = rankStyles[rank];
            return {
                name: rank, type: 'scatter', data: groupedSeries[rank],
                itemStyle: { color: style.color },
                emphasis: {
                    focus: 'self',
                    label: { show: true, fontSize: 12, fontWeight: 'bold' },
                    itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 15, shadowColor: '#fff' }
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
                borderWidth: 1, padding: 0,
                formatter: function (params) {
                    const r = params.data.raw;
                    const login = r.login && r.login !== "Anonymous" ? `<span style="color:#A0AEC0;">@${r.login}</span>` : "";
                    const rankLabel = params.seriesName.includes(' ') ? params.seriesName.split(' ').slice(1).join(' ') : params.seriesName;
                    const badge = `<span style="background:${params.color}; color:#000; padding:2px 6px; border-radius:10px; font-size:10px; font-weight:bold; margin-left:8px;">${rankLabel}</span>`;
                    const isActive = (r.last_active_year >= 2025);
                    const activeBadge = isActive ? `<div style="margin-top:4px;"><span style="background:#48BB78; color:#fff; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; text-transform:uppercase;">● Active</span></div>` : "";
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
                                <div><div style="font-size:15px; font-weight:bold;">${r.name}</div><div style="font-size:11px; opacity:0.8;">${login}</div>${activeBadge}</div>
                                ${badge}
                            </div>
                            <div style="margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11px;">
                                <div><span style="opacity:0.6;">Tenure:</span><br/><b>${r.span || 'N/A'}</b></div>
                                <div><span style="opacity:0.6;">Commits:</span><br/><b>${formatCount(r.total_commits || 0)}</b></div>
                                <div><span style="opacity:0.6;">Share:</span><br/><b>${shareStr}%</b></div>
                                ${params.seriesName.includes('Scouts') ? "" : `<div><span style="opacity:0.6;">Rank:</span><br/><b>Top ${(100 - (r.percentile_raw || 0) + 0.1).toFixed(1)}%</b></div>`}
                            </div>
                            ${focusHtml}
                            ${historicalNotes[r.name] ? `<div style="margin-top:8px; font-size:11px; color:#94a3b8; font-style:italic;">${historicalNotes[r.name]}</div>` : ''}
                        </div>`;
                }
            },
            xAxis: {
                ...axisStyle, type: 'value', min: 2008.5, max: 2025.5, splitLine: { show: false },
                name: 'Year Joined', nameLocation: 'middle', nameGap: 35
            },
            yAxis: {
                ...axisStyle, type: 'log', name: 'Total Commits (Depth)', nameLocation: 'middle', nameGap: 55,
                axisLabel: { formatter: (v) => v >= 1 ? v.toLocaleString() : v }
            },
            series: series
        });
        charts.landscape.on('click', function (params) {
            if (params.componentType === 'series') {
                renderContributorHistory(params.data.raw);
            }
        });

        console.timeEnd("loadContributorLandscape");
    } catch (e) {
        console.error("Galaxy Rendering Error:", e);
    }
}

function renderContributorHistory(contributor) {
    const historySection = document.getElementById('contributor-history-section');
    const historyTitle = document.getElementById('history-title');
    const chartContainer = document.getElementById('chart-contributor-history');

    if (!historySection || !chartContainer) return;

    historySection.style.display = 'block';

    // Format total commits with commas
    const totalCommits = contributor.total_commits ? contributor.total_commits.toLocaleString() : "0";
    historyTitle.innerText = `Contributor History: ${contributor.name} (${totalCommits} Commits)`;

    // Scroll to history
    historySection.scrollIntoView({ behavior: 'smooth' });

    if (charts.history) {
        charts.history.dispose();
    }
    charts.history = echarts.init(chartContainer);

    const historyData = contributor.history || {};
    const years = Object.keys(historyData).sort();

    // Get all unique categories
    const categories = new Set();
    Object.values(historyData).forEach(yearData => {
        Object.keys(yearData).forEach(cat => categories.add(cat));
    });
    const categoryList = Array.from(categories);

    const series = categoryList.map(cat => {
        return {
            name: cat,
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            data: years.map(y => historyData[y][cat] || 0),
            itemStyle: {
                color: (categoryColors && categoryColors[cat]) ? categoryColors[cat] : null
            }
        };
    });

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#1A202C',
            borderColor: '#2D3748',
            textStyle: { color: '#fff' },
            valueFormatter: (value) => value > 0 ? value.toFixed(1) : value
        },
        legend: {
            data: categoryList,
            bottom: 5,
            textStyle: { color: '#718096', fontSize: 11 },
            itemGap: 15
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '100px',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisLabel: { color: '#718096' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
            axisLabel: { color: '#718096' }
        },
        series: series
    };

    charts.history.setOption(option);

    // --- Render Radar Chart ---
    renderContributorRadarChart(contributor);
}

function renderContributorRadarChart(contributor) {
    const radarContainer = document.getElementById('chart-contributor-radar');
    if (!radarContainer) return;

    if (charts.radar) {
        charts.radar.dispose();
    }
    charts.radar = echarts.init(radarContainer);

    const profile = contributor.radar_profile || { "Security": 0, "Resilience": 0, "Usability": 0, "Quality": 0, "Education": 0 };

    // Normalize logic? Ideally we'd compare against cohort max, but for now let's use a log-ish scale or just raw if they are comparable.
    // The "Risk Score" is unbounded. Radar charts need a max.
    // Let's create a synthesized max based on the highest value in this profile + buffer, or a fixed "Hero" scale if we knew it.
    // For now, let's use [0, Max(Profile) * 1.2] to make the shape visible.

    const values = [
        profile.Security || 0,
        profile.Resilience || 0,
        profile.Usability || 0,
        profile.Quality || 0,
        profile.Education || 0
    ];

    const maxVal = Math.max(...values, 10); // Minimum 10 to avoid flat lines for 0

    // Indicators
    // Indicators with specific colors matching the theme
    const indicators = [
        { name: 'Security', max: maxVal * 1.2, color: '#E07A5F' },    // Matches "The Core"
        { name: 'Resilience', max: maxVal * 1.2, color: '#3D405B' },  // Matches Infrastructure
        { name: 'Usability', max: maxVal * 1.2, color: '#F4A261' },   // Matches "The Contributor"
        { name: 'Quality', max: maxVal * 1.2, color: '#81B29A' },     // Matches "The Prospect"
        { name: 'Education', max: maxVal * 1.2, color: '#D4AF37' }    // Gold for knowledge
    ];

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1A202C',
            borderColor: '#2D3748',
            textStyle: { color: '#fff' },
            formatter: (p) => {
                const formatNum = (val) => Math.round(val).toLocaleString();
                return `<div style="padding:5px; min-width:140px;">
                    <div style="font-weight:bold; border-bottom:1px solid #2D3748; margin-bottom:8px; padding-bottom:4px;">${contributor.name} Impact</div>
                    <div style="display:grid; grid-template-columns:1fr auto; gap:10px; font-size:12px;">
                        <span style="color:#E07A5F;">Security:</span> <b>${formatNum(values[0])}</b>
                        <span style="color:#3D405B;">Resilience:</span> <b>${formatNum(values[1])}</b>
                        <span style="color:#F4A261;">Usability:</span> <b>${formatNum(values[2])}</b>
                        <span style="color:#81B29A;">Quality:</span> <b>${formatNum(values[3])}</b>
                        <span style="color:#D4AF37;">Education:</span> <b>${formatNum(values[4])}</b>
                    </div>
                </div>`
            }
        },
        radar: {
            indicator: indicators,
            shape: 'circle',
            radius: '62%',
            center: ['50%', '50%'],
            splitNumber: 4,
            axisName: {
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: 'bold',
                padding: [5, 5]
            },
            splitLine: {
                lineStyle: {
                    color: [
                        'rgba(226, 232, 240, 0.1)',
                        'rgba(226, 232, 240, 0.2)',
                        'rgba(226, 232, 240, 0.4)',
                        'rgba(226, 232, 240, 0.6)'
                    ].reverse()
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.5)'
                }
            }
        },
        series: [{
            name: 'Risk Profile',
            type: 'radar',
            data: [{
                value: values,
                name: contributor.name,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: '#E07A5F'
                },
                areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                        { offset: 0, color: 'rgba(224, 122, 95, 0.1)' },
                        { offset: 1, color: 'rgba(224, 122, 95, 0.5)' }
                    ])
                }
            }]
        }]
    };

    charts.radar.setOption(option);
}

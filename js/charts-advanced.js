/**
 * Orange Dev Tracker - Advanced Engineering Metrics
 * - Churn vs Net (Refactoring Sprints)
 * - Retention (Workforce Stability vs New Joiner Loyalty)
 * - Top Reviewers (Unsung Heroes)
 */

async function loadChurnMetrics() {
    const chart = charts.churn;
    if (!chart) return;

    chart.showLoading();
    try {
        const resp = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_churn.json');
        const data = await resp.json();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...tooltipStyle,
                formatter: function (params) {
                    let dateStr = params[0].axisValue;
                    let html = `<div style="font-weight:600;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px;">Week of ${dateStr}</div>`;

                    params.forEach(p => {
                        const val = p.value;
                        const marker = p.marker;
                        const name = p.seriesName;
                        const formattedVal = (name === 'Commits') ? formatCount(val) : formatCount(val) + " LOC";

                        html += `<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:2px;">
                                    <span>${marker} ${name}</span>
                                    <span style="font-weight:600">${formattedVal}</span>
                                 </div>`;
                    });
                    return html;
                }
            },
            legend: {
                ...legendStyle,
                data: ['Net Change', 'Churn Intensity', 'Commits'],
                top: 0,
                left: 'center'
            },
            grid: { top: 60, bottom: 80, left: 70, right: 60 },
            xAxis: {
                type: 'category',
                data: data.dates,
                axisLabel: { ...axisStyle.axisLabel }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Lines of Code',
                    ...axisStyle,
                    axisLabel: {
                        ...axisStyle.axisLabel,
                        formatter: (val) => formatCount(val)
                    }
                },
                {
                    type: 'value',
                    name: 'Commits',
                    ...axisStyle,
                    splitLine: { show: false },
                    axisLabel: {
                        ...axisStyle.axisLabel,
                        formatter: (val) => formatCount(val)
                    }
                }
            ],
            dataZoom: [
                { type: 'inside', start: 80, end: 100 },
                { type: 'slider', start: 80, end: 100, bottom: 10 }
            ],
            series: [
                {
                    name: 'Net Change',
                    type: 'line',
                    data: data.net_change,
                    itemStyle: { color: COLORS.primary || '#E8916B' },
                    areaStyle: { opacity: 0.1 },
                    smooth: true,
                    symbol: 'none',
                    zIndex: 10
                },
                {
                    name: 'Churn Intensity',
                    type: 'bar',
                    data: data.churn,
                    itemStyle: { color: '#E2E8F0' },
                    emphasis: { itemStyle: { color: '#CBD5E0' } },
                    zIndex: 5
                },
                {
                    name: 'Commits',
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.commit_count,
                    itemStyle: { color: '#F6AD55' },
                    symbol: 'none',
                    smooth: true,
                    zIndex: 15
                }
            ]
        };

        chart.setOption(option);
    } catch (err) {
        console.error("Failed to load churn metrics:", err);
    } finally {
        chart.hideLoading();
    }
}

let retentionData = null;

async function loadRetentionMetrics() {
    const chart = charts.retention;
    if (!chart) return;

    chart.showLoading();
    try {
        const resp = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_retention.json?t=' + Date.now());
        retentionData = await resp.json();

        // Initial render with Workforce
        updateRetentionChart('workforce');

        // Setup Toggles
        const btnWorkforce = document.getElementById('btn-retention-workforce');
        const btnLoyalty = document.getElementById('btn-retention-loyalty');
        const descWorkforce = document.getElementById('retention-desc-workforce');
        const descLoyalty = document.getElementById('retention-desc-loyalty');

        if (btnWorkforce && btnLoyalty) {
            btnWorkforce.onclick = () => {
                btnWorkforce.classList.add('active');
                btnWorkforce.style.background = '#fff';
                btnWorkforce.style.color = 'inherit';
                btnWorkforce.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

                btnLoyalty.classList.remove('active');
                btnLoyalty.style.background = 'transparent';
                btnLoyalty.style.color = '#718096';
                btnLoyalty.style.boxShadow = 'none';

                if (descWorkforce) descWorkforce.style.display = 'block';
                if (descLoyalty) descLoyalty.style.display = 'none';

                updateRetentionChart('workforce');
            };

            btnLoyalty.onclick = () => {
                btnLoyalty.classList.add('active');
                btnLoyalty.style.background = '#fff';
                btnLoyalty.style.color = 'inherit';
                btnLoyalty.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

                btnWorkforce.classList.remove('active');
                btnWorkforce.style.background = 'transparent';
                btnWorkforce.style.color = '#718096';
                btnWorkforce.style.boxShadow = 'none';

                if (descWorkforce) descWorkforce.style.display = 'none';
                if (descLoyalty) descLoyalty.style.display = 'block';

                updateRetentionChart('loyalty');
            };
        }

    } catch (err) {
        console.error("Failed to load retention metrics:", err);
    } finally {
        chart.hideLoading();
    }
}

function updateRetentionChart(type) {
    const chart = charts.retention;
    if (!chart || !retentionData) return;

    // Professional sequential color palette (Darker/Bolder for recent, Lighter/Cooler for older)
    const cohortPalette = [
        '#2D3748', // 2018 (Deep Charcoal)
        '#4A5568', // 2019
        '#718096', // 2020
        '#A0AEC0', // 2021
        '#ED8936', // 2022 (Amber start)
        '#E07A5F', // 2023
        '#C53030', // 2024
        '#9B2C2C', // 2025 (Deep Red)
        '#702459'  // 2026 (Plum)
    ];

    const cohorts = retentionData[type];
    const series = cohorts.map((c, idx) => {
        const percentages = c.counts.map(cnt => cnt === null ? null : Math.round((cnt / c.starting_size) * 100));
        const color = cohortPalette[idx] || '#CBD5E0';

        return {
            name: `Cohort ${c.cohort_year} (n=${c.starting_size})`,
            type: 'line',
            data: percentages,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4, // Smaller symbols for cleaner lines
            color: color,
            emphasis: {
                focus: 'series',
                lineStyle: { width: 5 } // Make focused line pop
            },
            endLabel: {
                show: true,
                formatter: '{a}',
                distance: 12,
                color: color,
                fontSize: 11,
                fontWeight: 700,
                // Add a subtle padding to help with overlap shifting
                padding: [2, 4]
            },
            labelLayout: {
                moveOverlap: 'shiftY',
                dx: 5
            },
            lineStyle: { width: 2.5, opacity: 0.8 }
        };
    });

    const option = {
        tooltip: {
            trigger: 'item',
            ...tooltipStyle,
            formatter: (params) => {
                const val = params.value;
                if (val === null) return '';
                return `
                    <div style="font-weight:600;margin-bottom:5px;color:${params.color}">${params.seriesName}</div>
                    <div style="display:flex;justify-content:space-between;gap:20px">
                        <span>Retention in ${params.name}:</span>
                        <span style="font-weight:600">${val}%</span>
                    </div>`;
            }
        },
        legend: { show: false },
        grid: { top: 40, bottom: 40, left: 60, right: 160 }, // Even more right margin for the labels
        xAxis: {
            type: 'category',
            data: retentionData.xAxis.map(x => x === '2026' ? '2026 (Partial)' : x),
            axisLabel: { color: COLORS.textSecondary },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { formatter: '{value}%', color: COLORS.textSecondary },
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: series
    };

    chart.setOption(option, true);
}

async function loadReviewersMetrics() {
    const chart = charts.reviewers;
    if (!chart) return;

    console.log("Loading Reviewers Metrics...");
    chart.showLoading();
    try {
        const resp = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_reviewers.json?t=' + Date.now());
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const data = await resp.json();
        console.log(`Loaded ${data.length} reviewers`);

        // Take top 15 and reverse for horizontal bars
        const top15 = data.slice(0, 15).reverse();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...tooltipStyle
            },
            grid: { left: 180, right: 40, top: 20, bottom: 40 },
            xAxis: {
                type: 'value',
                name: 'Review Score',
                axisLabel: { color: COLORS.textSecondary },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            yAxis: {
                type: 'category',
                data: top15.map(d => d.name),
                axisLabel: {
                    color: COLORS.textSecondary,
                    fontWeight: 600,
                    interval: 0 // Show all labels
                }
            },
            series: [
                {
                    name: 'Consistency Score',
                    type: 'bar',
                    data: top15.map(d => d.score),
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{c}',
                        color: COLORS.textPrimary
                    },
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#A0AEC0' },
                            { offset: 1, color: '#E8916B' } // Hardcoded --primary color
                        ])
                    }
                }
            ]
        };

        chart.setOption(option);
        console.log("Reviewers chart option set successfully");
    } catch (err) {
        console.error("Failed to load reviewers metrics:", err);
        const container = document.getElementById('chart-reviewers');
        if (container) container.innerHTML = `<p style="color:red;padding:20px;">Error loading chart data: ${err.message}</p>`;
    } finally {
        chart.hideLoading();
    }
}

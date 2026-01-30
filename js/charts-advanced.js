/**
 * Orange Dev Tracker - Advanced Engineering Metrics
 * - Churn vs Net (Refactoring Sprints)
 * - Ghost Metrics (Retention)
 * - Top Reviewers (Unsung Heroes)
 */

async function loadChurnMetrics() {
    const chart = charts.churn;
    if (!chart) return;

    chart.showLoading();
    try {
        const resp = await fetch('data/stats_churn.json');
        const data = await resp.json();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Net Change', 'Churn Intensity', 'Commits'],
                bottom: 10,
                textStyle: { color: 'var(--text-secondary)' }
            },
            grid: { top: 40, bottom: 60, left: 60, right: 20 },
            xAxis: {
                type: 'category',
                data: data.dates,
                axisLabel: { color: 'var(--text-secondary)' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Lines of Code',
                    axisLabel: { color: 'var(--text-secondary)' },
                    splitLine: { lineStyle: { type: 'dashed' } }
                },
                {
                    type: 'value',
                    name: 'Commits',
                    axisLabel: { color: 'var(--text-secondary)' },
                    splitLine: { show: false }
                }
            ],
            dataZoom: [
                { type: 'inside', start: 80, end: 100 },
                { type: 'slider', start: 80, end: 100 }
            ],
            series: [
                {
                    name: 'Net Change',
                    type: 'line',
                    data: data.net_change,
                    itemStyle: { color: 'var(--primary)' },
                    areaStyle: { opacity: 0.1 },
                    smooth: true,
                    symbol: 'none'
                },
                {
                    name: 'Churn Intensity',
                    type: 'bar',
                    data: data.churn,
                    itemStyle: { color: '#E2E8F0' },
                    emphasis: { itemStyle: { color: '#CBD5E0' } }
                },
                {
                    name: 'Commits',
                    type: 'line',
                    yAxisIndex: 1,
                    data: data.commit_count,
                    itemStyle: { color: '#F6AD55' },
                    symbol: 'none',
                    smooth: true
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

async function loadRetentionMetrics() {
    const chart = charts.retention;
    if (!chart) return;

    chart.showLoading();
    try {
        const resp = await fetch('data/stats_retention.json');
        const data = await resp.json();

        // Ghost Metric: 2021 cohort retention
        const cohorts = data.cohorts;
        const series = cohorts.map(c => {
            // Calculate % retention
            const percentages = c.counts.map(cnt => cnt === null ? null : Math.round((cnt / c.starting_size) * 100));
            return {
                name: `Cohort ${c.cohort_year} (n=${c.starting_size})`,
                type: 'line',
                data: percentages,
                smooth: true,
                symbolSize: 8,
                emphasis: { focus: 'series' },
                label: { show: false }
            };
        });

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    let res = `<div style="font-weight:600;margin-bottom:5px">${params[0].axisValue} Retention</div>`;
                    params.forEach(p => {
                        if (p.value !== null) {
                            res += `<div style="display:flex;justify-content:space-between;gap:20px">
                                        <span>${p.seriesName}:</span>
                                        <span style="font-weight:600">${p.value}%</span>
                                    </div>`;
                        }
                    });
                    return res;
                }
            },
            legend: {
                bottom: 10,
                textStyle: { color: 'var(--text-secondary)', fontSize: 10 }
            },
            grid: { top: 40, bottom: 80, left: 50, right: 20 },
            xAxis: {
                type: 'category',
                data: data.xAxis,
                axisLabel: { color: 'var(--text-secondary)' }
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLabel: { formatter: '{value}%', color: 'var(--text-secondary)' },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: series
        };

        chart.setOption(option);
    } catch (err) {
        console.error("Failed to load retention metrics:", err);
    } finally {
        chart.hideLoading();
    }
}

async function loadReviewersMetrics() {
    const chart = charts.reviewers;
    if (!chart) return;

    chart.showLoading();
    try {
        const resp = await fetch('data/stats_reviewers.json');
        const data = await resp.json();

        const top15 = data.slice(0, 15).reverse();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: { left: 160, right: 40, top: 10, bottom: 40 },
            xAxis: {
                type: 'value',
                name: 'Review Score',
                axisLabel: { color: 'var(--text-secondary)' },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            yAxis: {
                type: 'category',
                data: top15.map(d => d.name),
                axisLabel: { color: 'var(--text-secondary)', fontWeight: 600 }
            },
            series: [
                {
                    name: 'Consistency Score',
                    type: 'bar',
                    data: top15.map(d => d.score),
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{c}'
                    },
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#A0AEC0' },
                            { offset: 1, color: 'var(--primary)' }
                        ])
                    }
                }
            ]
        };

        chart.setOption(option);
    } catch (err) {
        console.error("Failed to load reviewers metrics:", err);
    } finally {
        chart.hideLoading();
    }
}

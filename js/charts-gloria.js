/**
 * Chart Engine for Gloria's Spotlight
 * Uses Shared Theme and High-Contrast Dark Mode settings
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/lab/gloria_stats.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();

        // Update KPIs
        document.getElementById('stat-authored').textContent = data.summary.total_authored.toLocaleString();
        document.getElementById('stat-merged').textContent = data.summary.total_merged.toLocaleString();
        document.getElementById('stat-count').textContent = data.categories.length;
        document.getElementById('tenure-dates').textContent = `${data.summary.first_merge} to Feb 2026`;

        // Generate Dynamic Strategic Alignment
        generateStrategicAlignment(data);

        // Map milestones by month for search
        const milestoneMap = {};
        data.milestones.forEach(m => {
            milestoneMap[m.date.substring(0, 7)] = m;
        });

        // Initialize Charts
        initResilienceChart(data.trends, data.milestones, milestoneMap);
        initCategoryTrendChart(data.category_trends, data.milestones, milestoneMap);
        initCategoryDistributionChart(data.categories);

    } catch (error) {
        console.error('Error initializing charts:', error);
    }
});

/**
 * Functional Archetype Engine: Determines strategic identity based on footprint
 */
function generateStrategicAlignment(data) {
    const categories = data.categories;
    const total = data.summary.total_authored;

    const stats = {};
    categories.forEach(c => {
        stats[c.category] = (c.count / total) * 100;
    });

    let archetype = "Core Contributor";
    let tags = [];
    let bullets = [];

    // Gloria specific precision logic
    const testPct = Math.round(stats['Tests (QA)'] || 0);
    const consensusPct = Math.round(stats['Consensus (Domain Logic)'] || 0);
    const nodePct = Math.round(stats['Node & RPC (App/Interface)'] || 0);
    const p2pPct = Math.round(stats['P2P Network (Infrastructure)'] || 0);

    // Baseline Narrative
    bullets.push(`Gloria's journey began in 2020, focusing on rigorous codebase hardening through <b>Testing (QA)</b> and co-organizing the <b>Bitcoin Core PR Review Club</b>.`);
    bullets.push(`Her technical evolution led to a specialization in <b>Transaction Relay and Mempool Policy</b>, notably the design and implementation of <b>Package Relay (BIP 331)</b>.`);
    bullets.push(`Work on <b>V3 Transactions (BIP 431 TRUC)</b> specifically targets Lightning Network resilience, addressing critical fee-bumping and pinning attack vectors.`);

    if (data.summary.total_merged > 100) {
        bullets.push(`During her tenure as a <b>Bitcoin Core Maintainer</b> (2022-2026), she merged ${data.summary.total_merged} PRs, acting as a primary steward for the project's transaction relay rules.`);
    }

    // Determine Archetype for the badge
    if ((consensusPct + nodePct) > 30) {
        archetype = "Protocol Architect";
        tags = ["Mempool Engineering", "BIP 331 / 431", "L2 Scalability"];
    } else if (testPct > 40) {
        archetype = "Security & QA Hardener";
        tags = ["System Resilience", "QA Automation", "PR Review Club"];
    }

    // Populate UI
    document.getElementById('alignment-archetype').textContent = archetype;

    const narrativeContainer = document.getElementById('alignment-narrative');
    narrativeContainer.innerHTML = `
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
            ${bullets.map(b => `<li style="margin-bottom: 15px; position: relative;">
                <span style="position: absolute; left: -20px; color: #f7931a;">•</span>
                ${b}
            </li>`).join('')}
        </ul>
    `;

    const tagContainer = document.getElementById('alignment-tags');
    tagContainer.innerHTML = '';
    tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagContainer.appendChild(span);
    });
}

/**
 * Common Dark Mode Options for Gloria's Spotlight
 */
const DARK_CHART_DEFAULTS = {
    backgroundColor: 'transparent',
    textStyle: { color: '#94A3B8', fontFamily: 'Inter' },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '12%', containLabel: true }
};

function initResilienceChart(trends, milestones, milestoneMap) {
    const chart = echarts.init(document.getElementById('chart-resilience'));
    const firstActiveIndex = trends.findIndex(t => t.authored > 0 || t.merged > 0);
    const zoomStart = firstActiveIndex !== -1 ? Math.max(0, (firstActiveIndex / trends.length) * 100 - 5) : 0;

    const milestoneLines = milestones.map(m => ({
        xAxis: m.date.substring(0, 7),
        lineStyle: { color: 'rgba(247, 147, 26, 0.3)', type: 'dashed' },
        label: { show: false }
    }));

    const option = {
        ...DARK_CHART_DEFAULTS,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            backgroundColor: 'rgba(11, 14, 20, 0.95)',
            borderColor: '#2d3748',
            borderWidth: 1,
            textStyle: { color: '#f8fafc' },
            formatter: function (params) {
                let res = `<div style="font-weight:bold;margin-bottom:8px;border-bottom:1px solid #333;padding-bottom:5px">${params[0].name}</div>`;
                params.forEach(p => {
                    const val = p.value.toLocaleString();
                    res += `<div style="display:flex;justify-content:space-between;gap:30px;margin-bottom:4px">
                        <span style="color:#94a3b8">${p.marker} ${p.seriesName}</span>
                        <span style="font-weight:bold;color:#fff">${val}</span>
                    </div>`;
                });
                const m = milestoneMap[params[0].name];
                if (m) {
                    res += `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed #f7931a;color:#f7931a">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-bottom:2px">Key Milestone</div>
                        <div style="font-weight:bold;font-size:13px">${m.label}</div>
                        <div style="font-size:12px;color:#cbd5e1;white-space:normal;width:220px;margin-top:4px">${m.desc}</div>
                    </div>`;
                }
                return res;
            }
        },
        legend: {
            data: ['Authored', 'Merged', 'Project Baseline'],
            textStyle: { color: '#94A3B8' },
            top: 0
        },
        xAxis: {
            type: 'category',
            data: trends.map(t => t.month),
            axisLabel: { color: '#64748b' },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Commits',
                axisLabel: { color: '#64748b' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
                nameTextStyle: { color: '#475569' }
            },
            {
                type: 'value',
                name: 'Baseline',
                position: 'right',
                axisLabel: { color: '#475569' },
                splitLine: { show: false },
                nameTextStyle: { color: '#475569' }
            }
        ],
        dataZoom: [{
            type: 'slider',
            start: zoomStart,
            end: 100,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)',
            fillerColor: 'rgba(247, 147, 26, 0.1)',
            handleStyle: { color: '#f7931a' },
            textStyle: { color: '#475569' }
        }],
        series: [
            {
                name: 'Authored',
                type: 'bar',
                stack: 'gloria',
                data: trends.map(t => t.authored),
                itemStyle: { color: '#f7931a', borderRadius: [2, 2, 0, 0] },
                markLine: { symbol: ['none', 'none'], data: milestoneLines, silent: true }
            },
            {
                name: 'Merged',
                type: 'bar',
                stack: 'gloria',
                data: trends.map(t => t.merged),
                itemStyle: { color: '#2d3748', borderRadius: [2, 2, 0, 0] }
            },
            {
                name: 'Project Baseline',
                type: 'line',
                yAxisIndex: 1,
                data: trends.map(t => t.baseline),
                smooth: true,
                lineStyle: { color: '#475569', width: 2, type: 'dotted' },
                symbol: 'none'
            }
        ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function initCategoryTrendChart(categoryTrends, milestones, milestoneMap) {
    const chart = echarts.init(document.getElementById('chart-trend-categories'));
    if (!categoryTrends || categoryTrends.length === 0) return;
    const categories = Object.keys(categoryTrends[0]).filter(k => k !== 'month');

    const firstActiveIndex = categoryTrends.findIndex(t => Object.values(t).some(v => typeof v === 'number' && v > 0));
    const zoomStart = firstActiveIndex !== -1 ? Math.max(0, (firstActiveIndex / categoryTrends.length) * 100 - 5) : 0;

    const milestoneLines = milestones.map(m => ({
        xAxis: m.date.substring(0, 7),
        lineStyle: { color: 'rgba(247, 147, 26, 0.2)', type: 'dashed' },
        label: { show: false }
    }));

    const option = {
        ...DARK_CHART_DEFAULTS,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'line' },
            backgroundColor: 'rgba(11, 14, 20, 0.95)',
            borderColor: '#2d3748',
            borderWidth: 1,
            textStyle: { color: '#f8fafc' },
            formatter: function (params) {
                let res = `<div style="font-weight:bold;margin-bottom:10px;border-bottom:1px solid #333;padding-bottom:5px">${params[0].name}</div>`;
                const sorted = [...params].sort((a, b) => b.value - a.value);
                sorted.forEach(p => {
                    if (p.value > 0) {
                        res += `<div style="display:flex;justify-content:space-between;gap:30px;margin-bottom:4px">
                            <span style="color:#94a3b8">${p.marker} ${p.seriesName}</span>
                            <span style="font-weight:bold;color:#fff">${p.value}</span>
                        </div>`;
                    }
                });
                const m = milestoneMap[params[0].name];
                if (m) {
                    res += `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed #f7931a;color:#f7931a">
                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Technical Highlight</div>
                        <div style="font-weight:bold">${m.label}</div>
                    </div>`;
                }
                return res;
            }
        },
        legend: { data: categories, textStyle: { color: '#94A3B8' }, top: 0, type: 'scroll' },
        xAxis: {
            type: 'category',
            data: categoryTrends.map(t => t.month),
            axisLabel: { color: '#64748b' },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: '#64748b' }
        },
        dataZoom: [{
            type: 'slider',
            start: zoomStart,
            end: 100,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.05)',
            fillerColor: 'rgba(247, 147, 26, 0.1)',
            handleStyle: { color: '#f7931a' },
            textStyle: { color: '#475569' }
        }],
        series: categories.map((cat, idx) => ({
            name: cat,
            type: 'line',
            stack: 'Total',
            areaStyle: { opacity: 0.4 },
            emphasis: { focus: 'series' },
            data: categoryTrends.map(t => t[cat]),
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: { color: categoryColors[cat] || GHIBLI_PALETTE[idx % GHIBLI_PALETTE.length] },
            markLine: idx === 0 ? { symbol: ['none', 'none'], data: milestoneLines, silent: true } : null
        }))
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function initCategoryDistributionChart(categories) {
    const chart = echarts.init(document.getElementById('chart-categories'));
    const option = {
        ...DARK_CHART_DEFAULTS,
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(11, 14, 20, 0.95)',
            borderColor: '#2d3748',
            borderWidth: 1,
            textStyle: { color: '#f8fafc' },
            formatter: function (params) {
                const val = params.value;
                const formattedVal = val >= 10 ? Math.round(val) : val.toFixed(1);
                return `<div style="font-weight:bold;margin-bottom:4px">${params.name}</div>
                        <div style="display:flex;justify-content:space-between;gap:20px">
                            <span>Contribution:</span>
                            <span style="font-weight:bold">${formattedVal} units</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;gap:20px;color:#94a3b8;font-size:12px">
                            <span>Share:</span>
                            <span>${params.percent}%</span>
                        </div>`;
            }
        },
        series: [{
            name: 'Categories',
            type: 'pie',
            radius: ['45%', '75%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 12,
                borderColor: '#161B22',
                borderWidth: 3
            },
            label: { show: false, position: 'center' },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '16',
                    fontWeight: '800',
                    color: '#f7931a',
                    formatter: '{b}'
                },
                itemStyle: {
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            labelLine: { show: false },
            data: categories.map(c => ({
                name: c.category,
                value: c.count,
                itemStyle: { color: categoryColors[c.category] || GHIBLI_PALETTE[0] }
            }))
        }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}


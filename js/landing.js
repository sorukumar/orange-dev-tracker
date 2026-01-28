// Landing Page Controller

// --- Configuration ---
const VISUAL_OPTS = {
    textColor: '#94A3B8',
    accentColor: '#F7931A',
    backgroundColor: 'transparent',
    fontFamily: 'Inter, sans-serif'
};

let myChart = null;
let dataCache = {
    stackEvolution: null,
    contributorGrowth: null,
    heatmap: null,
    contributorsRich: null,
    processed: {
        totalLoc: [],
        years: [],
        stack2025: [],
        pyramid: []
    }
};

// --- Chart Configurations for Each Step ---
const SCENES = {
    'hero': {
        type: 'hero',
        onEnter: () => renderHero()
    },
    'scale-intro': {
        type: 'scale',
        onEnter: () => renderCodebaseHistory(0, 4) // 2009-2012
    },
    'scale-growth': {
        type: 'scale',
        onEnter: () => renderCodebaseHistory(0, 16) // 2009-2025
    },
    'army-intro': {
        type: 'army',
        onEnter: () => renderArmyGrowth()
    },
    'army-pyramid': {
        type: 'army',
        onEnter: () => renderArmyPyramid()
    },
    'dna-intro': {
        type: 'dna',
        onEnter: () => renderTechStack('core')
    },
    'dna-evolution': {
        type: 'dna',
        onEnter: () => renderTechStack('all')
    },
    'global': {
        type: 'global',
        onEnter: () => renderGlobalHeatmap()
    },
    'outro': {
        type: 'outro',
        onEnter: () => renderOutroGrid()
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    const chartDom = document.getElementById('landing-chart');
    myChart = echarts.init(chartDom, 'dark');
    window.addEventListener('resize', () => myChart.resize());

    await loadData();
    setupObserver();
    renderHero(); // Initial state
});

async function loadData() {
    try {
        const [stackRes, growthRes, heatmapRes, contribRes] = await Promise.all([
            fetch('data/stats_stack_evolution.json').then(r => r.json()),
            fetch('data/stats_contributor_growth.json').then(r => r.json()),
            fetch('data/stats_heatmap.json').then(r => r.json()),
            fetch('data/contributors_rich.json').then(r => r.json())
        ]);

        dataCache.stackEvolution = stackRes;
        dataCache.contributorGrowth = growthRes;
        dataCache.heatmap = heatmapRes;
        dataCache.contributorsRich = contribRes;

        // Process Codebase History
        const years = stackRes.xAxis.map(x => x.split('-')[0]);
        const totalLoc = new Array(years.length).fill(0);

        stackRes.series.forEach(s => {
            s.data.forEach((val, i) => {
                totalLoc[i] += val;
            });
        });

        dataCache.processed.years = years;
        dataCache.processed.totalLoc = totalLoc;

        // Process Tech Stack 2025 (Top 5)
        const lastIdx = years.length - 1;
        dataCache.processed.stack2025 = stackRes.series
            .map(s => {
                let details = s.details;
                if (Array.isArray(details)) details = details[lastIdx];
                return {
                    name: s.name,
                    value: s.data[lastIdx],
                    details: details
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 5 + Other

        // Process Contributor Pyramid (The Engagement Tiers Logic)
        processPyramid(contribRes);

    } catch (e) {
        console.error("Failed to load data", e);
    }
}

function processPyramid(data) {
    if (!data) return;

    // Sort desc by commits
    data.sort((a, b) => b.total_commits - a.total_commits);
    const count = data.length;

    // Tiers: 1%, 19% (Top 20%), 80% (Bottom 80%)
    const i1 = Math.ceil(count * 0.01);
    const i20 = Math.ceil(count * 0.20);

    // Group 1: 0 to i1
    const group1 = data.slice(0, i1);
    // Group 2: i1 to i20
    const group2 = data.slice(i1, i20);
    // Group 3: i20 to end
    const group3 = data.slice(i20);

    dataCache.processed.pyramid = [
        { value: group1.length, name: `The Core (Top 1%)`, itemStyle: { color: VISUAL_OPTS.accentColor } },
        { value: group2.length, name: `The Contributors (Top 20%)`, itemStyle: { color: '#3b82f6' } },
        { value: group3.length, name: `🌱 The Prospects (Bottom 80%)`, itemStyle: { color: '#334155' } }
    ];
}

function setupObserver() {
    const steps = document.querySelectorAll('.step');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');

                const stepName = entry.target.dataset.step;
                if (SCENES[stepName] && SCENES[stepName].onEnter) {
                    SCENES[stepName].onEnter();
                }
            }
        });
    }, { threshold: 0.5, rootMargin: "-10% 0px -10% 0px" });

    steps.forEach(step => observer.observe(step));
}

// --- Renderers ---

function renderHero() {
    const nodes = [];
    const links = [];
    const N = 40;

    for (let i = 0; i < N; i++) {
        nodes.push({
            id: i,
            x: Math.random() * 1000,
            y: Math.random() * 800,
            symbolSize: Math.random() * 8 + 2,
            itemStyle: {
                color: i % 3 === 0 ? VISUAL_OPTS.accentColor : 'rgba(255,255,255,0.3)'
            }
        });
        for (let j = 0; j < 2; j++) {
            const target = Math.floor(Math.random() * N);
            if (target !== i) links.push({ source: i, target: target });
        }
    }

    myChart.setOption({
        backgroundColor: 'transparent',
        title: { show: false },
        tooltip: { show: false },
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            roam: false,
            label: { show: false },
            force: { repulsion: 200, gravity: 0.05 },
            lineStyle: { opacity: 0.1, curveness: 0.2, color: '#fff' }
        }],
        animationDurationUpdate: 2000
    }, true);
}

function renderCodebaseHistory(startIndex, endIndex) {
    if (!dataCache.processed.totalLoc.length) return;

    const fullYears = dataCache.processed.years;
    const fullData = dataCache.processed.totalLoc;

    const years = fullYears.slice(startIndex, endIndex + 1);
    const data = fullData.slice(startIndex, endIndex + 1);

    myChart.setOption({
        title: {
            text: 'Codebase Size (Lines of Code)',
            left: 'center', top: '15%',
            textStyle: { color: VISUAL_OPTS.textColor, fontFamily: VISUAL_OPTS.fontFamily }
        },
        grid: { top: '25%', bottom: '25%', left: '15%', right: '15%' },
        xAxis: {
            type: 'category',
            data: years,
            axisLabel: { color: VISUAL_OPTS.textColor },
            axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
            axisLabel: { color: VISUAL_OPTS.textColor, formatter: (v) => formatCount(v, 0) }
        },
        series: [{
            type: 'line',
            data: data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { color: VISUAL_OPTS.accentColor, width: 4 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(247, 147, 26, 0.4)' },
                    { offset: 1, color: 'rgba(247, 147, 26, 0.0)' }
                ])
            },
            itemStyle: { color: VISUAL_OPTS.accentColor, borderWidth: 2, borderColor: '#fff' },
            markPoint: {
                data: endIndex > 10 ? [{ type: 'max', name: 'Max' }] : []
            }
        }],
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    }, { notMerge: true });
}


function renderArmyGrowth() {
    if (!dataCache.contributorGrowth) return;
    const raw = dataCache.contributorGrowth;
    const limitIdx = raw.xAxis.indexOf("2025");
    const years = raw.xAxis.slice(0, limitIdx + 1);
    const newContribs = raw.series.find(s => s.name === "New Contributors").data.slice(0, limitIdx + 1);
    const veterans = raw.series.find(s => s.name === "Veterans").data.slice(0, limitIdx + 1);

    myChart.setOption({
        title: {
            text: 'Active Contributors',
            left: 'center', top: '15%',
            textStyle: { color: VISUAL_OPTS.textColor }
        },
        tooltip: { trigger: 'axis' },
        grid: { top: '25%', bottom: '25%', left: '15%', right: '15%' },
        xAxis: {
            type: 'category',
            data: years,
            axisLabel: { color: VISUAL_OPTS.textColor }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#1e293b' } },
            axisLabel: { color: VISUAL_OPTS.textColor, formatter: (v) => formatCount(v, 0) }
        },
        series: [
            {
                name: 'Veterans',
                type: 'bar',
                stack: 'total',
                data: veterans,
                itemStyle: { color: '#3b82f6' }
            },
            {
                name: 'New Contributors',
                type: 'bar',
                stack: 'total',
                data: newContribs,
                itemStyle: { color: VISUAL_OPTS.accentColor, borderRadius: [4, 4, 0, 0] }
            }
        ]
    }, true);
}

function renderArmyPyramid() {
    const data = dataCache.processed.pyramid;

    // Fallback if data hasn't loaded (e.g. valid file:// CORS)
    const finalData = (data && data.length) ? data : [
        { value: 12, name: 'The Core (Top 1%) Loading...', itemStyle: { color: VISUAL_OPTS.accentColor } }
    ];

    myChart.setOption({
        title: {
            text: 'The Contributor Pyramid',
            left: 'center', top: '15%',
            textStyle: { color: VISUAL_OPTS.textColor }
        },
        tooltip: {
            trigger: 'item',
            formatter: (p) => `<b>${p.name}</b><br/>Contributors: <b>${formatCount(p.value, 0)}</b>`
        },
        series: [{
            type: 'funnel',
            left: 'center',
            width: '50%',
            height: '60%',
            top: '25%',
            sort: 'ascending',
            gap: 2,
            label: {
                show: true,
                position: 'right',
                formatter: (p) => `${p.name}: ${formatCount(p.value, 0)} Devs`,
                color: VISUAL_OPTS.textColor
            },
            data: finalData
        }]
    }, true);
}


function renderTechStack(mode) {
    if (!dataCache.processed.stack2025.length) return;

    let data = dataCache.processed.stack2025;

    // Mode 'core': Highlight C++, gray others
    // Mode 'all': Show colorful
    const palette = ['#f34b7d', '#3572A5', '#e34c26', '#f1e05a', '#563d7c', '#4F5D95', '#1e293b'];

    const coloredData = data.map((d, i) => {
        let color = palette[i % palette.length];
        if (mode === 'core') {
            color = d.name === 'C++' ? '#f34b7d' : '#334155'; // C++ pink, others dark slate
        } else {
            // Specific overrides
            if (d.name === 'C++') color = '#f34b7d';
            if (d.name === 'Python') color = '#3572A5';
        }
        return {
            value: d.value,
            name: d.name,
            itemStyle: { color: color }
        };
    });

    myChart.setOption({
        title: {
            text: 'Codebase Composition (2025)',
            left: 'center', top: '15%',
            textStyle: { color: VISUAL_OPTS.textColor }
        },
        tooltip: {
            trigger: 'item',
            formatter: (p) => {
                let html = `<b>${p.name}</b><br/>Lines: <b>${formatCount(p.value)}</b> (${p.percent}%)`;
                if (p.data.details) {
                    html += `<div style="font-size:10px; color:#94a3b8; margin-top:4px; max-width:180px;">Includes: ${p.data.details}</div>`;
                }
                return html;
            }
        },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '55%'],
            itemStyle: { borderRadius: 5, borderColor: '#0B0E14', borderWidth: 2 },
            label: { color: VISUAL_OPTS.textColor },
            data: coloredData
        }]
    }, true);
}

function renderGlobalHeatmap() {
    if (!dataCache.heatmap) return;

    // Aggregate by Hour (index 1)
    const hourCounts = new Array(24).fill(0);
    dataCache.heatmap.data.forEach(d => {
        hourCounts[d[1]] += d[2];
    });

    const data = hourCounts.map((val, i) => ({ value: val, name: `${i}:00` }));

    myChart.setOption({
        title: {
            text: 'Global Heartbeat (Commits by Hour)',
            left: 'center', top: '10%',
            textStyle: { color: VISUAL_OPTS.textColor }
        },
        polar: { radius: [30, '80%'] },
        angleAxis: {
            type: 'category',
            data: hourCounts.map((_, i) => i + 'h'),
            startAngle: 75,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' }
        },
        radiusAxis: { type: 'value', show: false },
        tooltip: {
            trigger: 'item',
            formatter: (p) => `<b>${p.name}</b><br/>Commits: <b>${formatCount(p.value)}</b>`
        },
        series: [{
            type: 'bar',
            data: hourCounts,
            coordinateSystem: 'polar',
            itemStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: VISUAL_OPTS.accentColor },
                        { offset: 1, color: 'rgba(247, 147, 26, 0.2)' }
                    ]
                }
            }
        }]
    }, true);
}

function renderOutroGrid() {
    myChart.clear();
    myChart.setOption({
        title: {
            text: 'Explore the full dashboard',
            left: 'center',
            top: 'center',
            textStyle: {
                fontSize: 30,
                color: 'rgba(255,255,255,0.1)'
            }
        },
        graphic: {
            type: 'image',
            style: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg', // Placeholder logo
                width: 100,
                height: 100,
                opacity: 0.1
            },
            left: 'center',
            top: '40%'
        }
    });
}

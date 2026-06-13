async function initGovernance() {
    console.log("Initializing Governance Dashboard...");

    // Data paths
    const STATS_URL = DATA_PATH_PREFIX + 'output/tracker/stats_ui.json';
    const THEMES_URL = DATA_PATH_PREFIX + 'output/tracker/themes_ui.json';
    const FUNNEL_URL = DATA_PATH_PREFIX + 'output/tracker/funnel_ui.json';
    const BIPS_URL = DATA_PATH_PREFIX + 'output/tracker/bips_ui.json';
    const EXPERTISE_URL = DATA_PATH_PREFIX + 'output/tracker/expertise.json';

    try {
        const [stats, themes, funnel, bips, expertise] = await Promise.all([
            fetch(STATS_URL).then(r => r.json()),
            fetch(THEMES_URL).then(r => r.json()),
            fetch(FUNNEL_URL).then(r => r.json()),
            fetch(BIPS_URL).then(r => r.json()),
            fetch(EXPERTISE_URL).then(r => r.json())
        ]);

        updateKPIs(stats);
        renderThemeChart(themes);
        renderFunnelChart(funnel);
        renderGatekeepersChart(expertise.gatekeepers);
        renderArchitectsList(expertise.full_stack_architects);
        renderBipLedger(bips);

    } catch (err) {
        console.error("Error loading governance data:", err);
    }
}

function updateKPIs(stats) {
    document.getElementById('kpi-total-bips').textContent = stats.total_bips;
    document.getElementById('kpi-final-bips').textContent = stats.final_active_bips;
    document.getElementById('kpi-social-mentions').textContent = stats.social_mentions.toLocaleString();
    document.getElementById('kpi-revisions').textContent = stats.total_revisions.toLocaleString();
}

function renderThemeChart(data) {
    const chart = echarts.init(document.getElementById('chart-themes'));

    // Sort and filter for better visibility
    const sortedData = data.bip_counts.sort((a, b) => b.value - a.value);

    const option = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: '0', left: 'center', textStyle: { fontSize: 10 } },
        color: [
            '#3E6073', '#7BA9CC', '#5B8266', '#E07A5F',
            '#D4AF37', '#6D597A', '#89B449', '#E27396'
        ],
        series: [
            {
                name: 'BIP Themes',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 8, borderColor: '#1A202C', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
                labelLine: { show: false },
                data: sortedData
            }
        ]
    };
    chart.setOption(option);
}

function renderFunnelChart(data) {
    const chart = echarts.init(document.getElementById('chart-funnel'));

    // Aggregate status for a cleaner funnel if needed, but let's use raw for now
    const option = {
        tooltip: { trigger: 'item', formatter: '{b} : {c}' },
        series: [
            {
                name: 'Consensus Funnel',
                type: 'funnel',
                left: '10%',
                top: 20,
                bottom: 20,
                width: '80%',
                min: 0,
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: { show: true, position: 'inside' },
                labelLine: { show: false },
                itemStyle: { opacity: 0.8, borderColor: '#1A202C', borderWidth: 1 },
                emphasis: { label: { fontSize: 14 } },
                data: data.sort((a, b) => b.value - a.value).slice(0, 8)
            }
        ]
    };
    chart.setOption(option);
}

function renderGatekeepersChart(data) {
    const chart = echarts.init(document.getElementById('chart-gatekeepers'));

    const sortedData = data.slice(0, 10).reverse();

    const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', splitLine: { show: false } },
        yAxis: {
            type: 'category',
            data: sortedData.map(d => d.canonical_id),
            axisLabel: { fontSize: 10 }
        },
        series: [
            {
                name: 'Post Count',
                type: 'bar',
                data: sortedData.map(d => d.social_post_count),
                itemStyle: { color: '#E07A5F', borderRadius: [0, 4, 4, 0] },
                label: { show: true, position: 'right', fontSize: 10 }
            }
        ]
    };
    chart.setOption(option);
}

function renderArchitectsList(data) {
    const tbody = document.getElementById('architects-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${item.canonical_id}</td>
            <td><span class="status-pill" style="background: #F3F4F6; color: #374151;">${item.bips_authored}</span></td>
            <td><span class="status-pill" style="background: #FEF9C3; color: #854D0E;">${item.commits_authored}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBipLedger(bips) {
    const tbody = document.getElementById('bip-ledger-body');
    tbody.innerHTML = '';

    bips.forEach(bip => {
        const tr = document.createElement('tr');

        const maturityClass = bip.maturity_score > 0.4 ? 'maturity-high' :
            (bip.maturity_score > 0.15 ? 'maturity-mid' : 'maturity-low');

        const statusClass = `status-${bip.status.toLowerCase().replace(/[^a-z]/g, '')}`;

        tr.innerHTML = `
            <td style="font-weight: 600;">BIP ${bip.bip_id}</td>
            <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${bip.title}">${bip.title}</td>
            <td><span class="status-pill ${statusClass}">${bip.status}</span></td>
            <td>${bip.theme}</td>
            <td><i class="fa-regular fa-comment" style="margin-right: 5px; color: #718096;"></i> ${bip.social_mention_count}</td>
            <td><i class="fa-solid fa-code-branch" style="margin-right: 5px; color: #718096;"></i> ${bip.revision_count}</td>
            <td><span class="maturity-badge ${maturityClass}">${bip.maturity_score.toFixed(2)}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

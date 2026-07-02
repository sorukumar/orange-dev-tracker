/**
 * Health & Culture specific chart loaders
 */



async function loadMaintainerIndependence() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/shared/maintainers/stats_maintainers.json');
        if (!response.ok) return;
        const data = await response.json();
        const matrixEl = document.getElementById('matrix-maintainer-independence');
        if (!matrixEl) return;

        const sponsorColors = {
            'Brink': GHIBLI_PALETTE[2], 'Chaincode Labs': GHIBLI_PALETTE[0], 'Spiral (Block/Square)': GHIBLI_PALETTE[4],
            'Blockstream': GHIBLI_PALETTE[10], 'MIT Digital Currency Initiative': GHIBLI_PALETTE[6], 'OpenSats': GHIBLI_PALETTE[8],
            'Independent': GHIBLI_PALETTE[17], 'Clearwing Software': GHIBLI_PALETTE[15], 'default': GHIBLI_PALETTE[19]
        };

        // Helper to convert hex to rgba for background tints
        function hexToRgba(hex, alpha) {
            let c;
            if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                c = hex.substring(1).split('');
                if (c.length === 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c = '0x' + c.join('');
                return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
            }
            return `rgba(255,255,255,${alpha})`;
        }

        function updateIndependenceMatrix(viewType) {
            matrixEl.innerHTML = '';
            
            const maintainersBySponsor = {};
            data.maintainers.forEach(m => {
                if (viewType === 'active' && m.status !== 'active') return;
                if (!maintainersBySponsor[m.sponsor]) maintainersBySponsor[m.sponsor] = [];
                maintainersBySponsor[m.sponsor].push(m.name);
            });

            // Sort sponsors by count (descending), then alphabetically
            const sortedSponsors = Object.keys(maintainersBySponsor).sort((a, b) => {
                const countDiff = maintainersBySponsor[b].length - maintainersBySponsor[a].length;
                if (countDiff !== 0) return countDiff;
                return a.localeCompare(b);
            });

            let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
            
            sortedSponsors.forEach(sponsor => {
                const maintainers = maintainersBySponsor[sponsor].sort();
                const color = sponsorColors[sponsor] || sponsorColors['default'];
                const bgColor = hexToRgba(color, 0.1);
                const borderColor = hexToRgba(color, 0.2);

                html += `<div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">`;
                html += `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${color}; font-weight: 700; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${sponsor}</span>
                            <span style="background: ${color}; color: #fff; padding: 2px 6px; border-radius: 12px; font-size: 10px;">${maintainers.length}</span>
                         </div>`;
                
                html += `<div style="display: flex; flex-wrap: wrap; gap: 6px;">`;
                maintainers.forEach(m => {
                    html += `<span style="background: ${bgColor}; border: 1px solid ${borderColor}; color: ${color}; padding: 4px 10px; border-radius: 16px; font-size: 12px; font-weight: 500;">${m}</span>`;
                });
                html += `</div></div>`;
            });
            
            html += '</div>';
            matrixEl.innerHTML = html;
        }

        updateIndependenceMatrix('active');
        
        const btnActive = document.getElementById('btn-maintainer-active'), btnAll = document.getElementById('btn-maintainer-all');
        if (btnActive && btnAll) {
            // Remove old listeners to prevent duplication if init is called twice
            const newBtnActive = btnActive.cloneNode(true);
            const newBtnAll = btnAll.cloneNode(true);
            btnActive.parentNode.replaceChild(newBtnActive, btnActive);
            btnAll.parentNode.replaceChild(newBtnAll, btnAll);

            newBtnActive.addEventListener('click', () => {
                newBtnActive.classList.add('active'); newBtnAll.classList.remove('active');
                updateIndependenceMatrix('active');
            });
            newBtnAll.addEventListener('click', () => {
                newBtnAll.classList.add('active'); newBtnActive.classList.remove('active');
                updateIndependenceMatrix('all_time');
            });
        }
    } catch (e) { console.error("Matrix load error:", e); }
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

/**
 * Populate the "Sun Never Sets" vital signs panel with data from heatmap and weekend stats.
 * Called after loadStory() completes in app.js.
 */
async function populateVitalSignsPanel() {
    try {
        // --- Hourly Coverage: count active hours in latest year ---
        const hmRes = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_heatmap.json');
        if (hmRes.ok) {
            const hmData = await hmRes.json();
            const latestYear = hmData.years[hmData.years.length - 1];
            const latestYearIdx = hmData.years.indexOf(latestYear);
            // Count hours with > 0 commits for the latest full year (use second-to-last if current year is partial)
            const targetYear = hmData.years.length > 1 ? hmData.years[hmData.years.length - 2] : latestYear;
            const targetIdx = hmData.years.indexOf(targetYear);
            let activeHours = 0;
            hmData.data.forEach(point => {
                // point = [yearLabel, hourLabel, value]
                if (point[0] === targetYear && point[2] > 0) activeHours++;
            });
            const el = document.getElementById('vital-hourly-coverage');
            if (el) el.textContent = `${activeHours} / 24 hrs`;
        }

        // --- Weekend Coding: first vs last value ---
        const wRes = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_weekend.json');
        if (wRes.ok) {
            const wData = await wRes.json();
            const weekendSeries = wData.series.find(s => s.name.toLowerCase().includes('weekend'));
            if (weekendSeries && weekendSeries.data.length > 1) {
                const firstVal = weekendSeries.data[0];
                const firstYear = wData.xAxis[0];
                // Use second-to-last for latest full year
                const lastIdx = weekendSeries.data.length > 1 ? weekendSeries.data.length - 2 : weekendSeries.data.length - 1;
                const lastVal = weekendSeries.data[lastIdx];
                const lastYear = wData.xAxis[lastIdx];

                const firstPct = (firstVal * 100).toFixed(0);
                const lastPct = (lastVal * 100).toFixed(0);

                const statEl = document.getElementById('vital-weekend-stat');
                if (statEl) statEl.textContent = `${firstPct}% → ${lastPct}%`;

                const narrativeEl = document.getElementById('vital-weekend-narrative');
                if (narrativeEl) {
                    narrativeEl.textContent = `Weekend coding has declined from ${firstPct}% (${firstYear}) to ${lastPct}% (${lastYear}). Bitcoin is no longer a hobby; it is a professional vocation.`;
                }
            }
        }
    } catch (e) {
        console.error("Vital Signs Panel Error:", e);
    }
}

/**
 * Populate the retention summary KPI cards from stats_retention.json.
 * Called after loadRetentionMetrics() completes.
 */
async function populateRetentionKPIs() {
    try {
        const res = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_retention.json');
        if (!res.ok) return;
        const data = await res.json();
        const cohorts = data.workforce;
        if (!cohorts || cohorts.length === 0) return;

        // --- Active Regulars: latest cohort's starting size ---
        const latestCohort = cohorts[cohorts.length - 1];
        const el1 = document.getElementById('kpi-active-regulars');
        if (el1) el1.textContent = latestCohort.starting_size;

        // --- 1-Year Survival: find the most recent cohort that has a year+1 data point ---
        // We want a cohort where counts has at least 2 non-null entries
        let survivalPct = null;
        let survivalCohortYear = null;
        for (let i = cohorts.length - 1; i >= 0; i--) {
            const c = cohorts[i];
            // Find position of this cohort in the xAxis
            const cohortIdx = data.xAxis.indexOf(String(c.cohort_year));
            if (cohortIdx >= 0 && cohortIdx + 1 < c.counts.length && c.counts[cohortIdx] !== null && c.counts[cohortIdx + 1] !== null) {
                survivalPct = Math.round((c.counts[cohortIdx + 1] / c.starting_size) * 100);
                survivalCohortYear = c.cohort_year;
                break;
            }
        }
        const el2 = document.getElementById('kpi-1yr-survival');
        if (el2 && survivalPct !== null) el2.textContent = survivalPct + '%';
        const el2sub = document.getElementById('kpi-1yr-survival-sub');
        if (el2sub && survivalCohortYear) el2sub.textContent = `of ${survivalCohortYear} regulars returned`;

        // --- Workforce Half-Life: from the oldest completed cohort, find years to reach 50% ---
        let halfLife = null;
        for (let i = 0; i < cohorts.length; i++) {
            const c = cohorts[i];
            const halfTarget = c.starting_size * 0.5;
            const cohortIdx = data.xAxis.indexOf(String(c.cohort_year));
            if (cohortIdx < 0) continue;
            
            // Walk forward from cohort start to find when it drops below 50%
            for (let j = cohortIdx + 1; j < c.counts.length; j++) {
                if (c.counts[j] !== null && c.counts[j] <= halfTarget) {
                    halfLife = j - cohortIdx;
                    break;
                }
            }
            if (halfLife !== null) break; // Use earliest completed cohort's half-life
        }
        const el3 = document.getElementById('kpi-half-life');
        if (el3) {
            if (halfLife !== null) {
                el3.textContent = `~${halfLife}yr`;
            } else {
                el3.textContent = '>5yr';
            }
        }
    } catch (e) {
        console.error("Retention KPIs Error:", e);
    }
}

async function loadVitalSignsScorecard() {
    try {
        const scorecardEl = document.getElementById('vital-signs-scorecard');
        if (!scorecardEl) return;

        // Fetch data
        const [busFactorRes, retentionRes, maintainerRes, corpRes] = await Promise.all([
            fetch(DATA_PATH_PREFIX + 'output/tracker/stats_bus_factor.json').catch(() => null),
            fetch(DATA_PATH_PREFIX + 'output/tracker/stats_retention.json').catch(() => null),
            fetch(DATA_PATH_PREFIX + 'output/shared/maintainers/stats_maintainers.json').catch(() => null),
            fetch(DATA_PATH_PREFIX + 'output/tracker/stats_corporate.json').catch(() => null)
        ]);

        let html = '';

        // 1. Bus Factor
        if (busFactorRes && busFactorRes.ok) {
            const data = await busFactorRes.json();
            const bf = data.headline.bus_factor;
            const bfPrev = data.historical.bus_factor[data.historical.bus_factor.length - 2] || bf;
            const dir = bf > bfPrev ? '▲' : (bf < bfPrev ? '▼' : '−');
            const dirColor = bf > bfPrev ? 'var(--color-success)' : (bf < bfPrev ? 'var(--color-danger)' : 'var(--text-secondary)');
            const dirText = bf !== bfPrev ? `from ${bfPrev} last year` : 'unchanged';
            
            html += `
            <div style="padding: 24px; border-right: 1px solid rgba(255,255,255,0.05); text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 15px;">
                    <i class="fas fa-shield-alt" style="margin-right: 6px; opacity: 0.7;"></i>Bus Factor
                </div>
                <div style="font-size: 3em; font-weight: bold; color: var(--primary); margin: 10px 0; line-height: 1;">${bf}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">key developers</div>
                <div style="font-size: 11px; color: ${dirColor}; font-weight: 600;">${dir} <span style="color: var(--text-secondary); font-weight: 400;">${dirText}</span></div>
            </div>`;
        }

        // 2. Active Regulars
        if (retentionRes && retentionRes.ok) {
            const data = await retentionRes.json();
            const cohorts = data.workforce;
            const current = cohorts[cohorts.length - 1].starting_size;
            const prev = cohorts[cohorts.length - 2].starting_size;
            const dir = current > prev ? '▲' : (current < prev ? '▼' : '−');
            const dirColor = current > prev ? 'var(--color-success)' : (current < prev ? 'var(--color-danger)' : 'var(--text-secondary)');
            
            html += `
            <div style="padding: 24px; border-right: 1px solid rgba(255,255,255,0.05); text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 15px;">
                    <i class="fas fa-users" style="margin-right: 6px; opacity: 0.7;"></i>Active Regulars
                </div>
                <div style="font-size: 3em; font-weight: bold; color: var(--primary); margin: 10px 0; line-height: 1;">${current}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">with 3+ commits</div>
                <div style="font-size: 11px; color: ${dirColor}; font-weight: 600;">${dir} <span style="color: var(--text-secondary); font-weight: 400;">from ${prev} last year</span></div>
            </div>`;
        }

        // 3. Sponsor Diversity
        if (maintainerRes && maintainerRes.ok) {
            const data = await maintainerRes.json();
            const sponsors = new Set();
            data.maintainers.forEach(m => {
                if (m.status === 'active' && m.sponsor && m.sponsor !== 'Independent') sponsors.add(m.sponsor);
            });
            const count = sponsors.size;
            
            html += `
            <div style="padding: 24px; border-right: 1px solid rgba(255,255,255,0.05); text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 15px;">
                    <i class="fas fa-building" style="margin-right: 6px; opacity: 0.7;"></i>Sponsor Diversity
                </div>
                <div style="font-size: 3em; font-weight: bold; color: var(--primary); margin: 10px 0; line-height: 1;">${count}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">orgs funding maintainers</div>
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 400;">current active snapshot</div>
            </div>`;
        }

        // 4. Professionalization
        if (corpRes && corpRes.ok) {
            const data = await corpRes.json();
            const sponsoredSeries = data.series.find(s => s.name.includes('Sponsored'));
            if (sponsoredSeries && sponsoredSeries.data.length > 0) {
                const current = Math.round(sponsoredSeries.data[sponsoredSeries.data.length - 1]);
                const prev = Math.round(sponsoredSeries.data[sponsoredSeries.data.length - 2]);
                const dir = current > prev ? '▲' : (current < prev ? '▼' : '−');
                const dirColor = current > prev ? 'var(--color-success)' : (current < prev ? 'var(--color-danger)' : 'var(--text-secondary)');
                
                html += `
                <div style="padding: 24px; text-align: center; flex: 1;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 15px;">
                        <i class="fas fa-briefcase" style="margin-right: 6px; opacity: 0.7;"></i>Professionalization
                    </div>
                    <div style="font-size: 3em; font-weight: bold; color: var(--primary); margin: 10px 0; line-height: 1;">${current}%</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">sponsored commits</div>
                    <div style="font-size: 11px; color: ${dirColor}; font-weight: 600;">${dir} <span style="color: var(--text-secondary); font-weight: 400;">from ${prev}% last year</span></div>
                </div>`;
            }
        }

        scorecardEl.innerHTML = html;

    } catch(e) {
        console.error("Scorecard load error:", e);
    }
}

async function loadBusFactorChart() {
    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/stats_bus_factor.json');
        if (!response.ok) return;
        const data = await response.json();
        const chartEl = document.getElementById('chart-bus-factor');
        if (!chartEl) return;
        const chart = echarts.init(chartEl);

        const seriesData = data.historical.bus_factor;
        const maxBF = Math.max(...seriesData);
        
        function hexToRgba(hex, alpha) {
            let c;
            if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                c = hex.substring(1).split('');
                if (c.length === 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c = '0x' + c.join('');
                return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
            }
            return `rgba(255,255,255,${alpha})`;
        }

        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                ...tooltipStyle,
                trigger: 'axis'
            },
            grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
            xAxis: {
                ...axisStyle,
                type: 'category',
                boundaryGap: false,
                data: data.historical.xAxis
            },
            yAxis: {
                ...axisStyle,
                type: 'value',
                name: 'Bus Factor',
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.1 } },
                max: Math.ceil(maxBF * 1.2) // Give some headroom
            },
            series: [{
                name: 'Bus Factor',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: GHIBLI_PALETTE[4] },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: hexToRgba(GHIBLI_PALETTE[4], 0.5) },
                        { offset: 1, color: hexToRgba(GHIBLI_PALETTE[4], 0.0) }
                    ])
                },
                data: seriesData,
                markLine: {
                    symbol: ['none', 'none'],
                    label: { show: true, position: 'middle', formatter: '{b}', color: COLORS.textSecondary },
                    lineStyle: { type: 'dashed', color: COLORS.textSecondary, width: 1, opacity: 0.5 },
                    data: [
                        { xAxis: '2014', name: 'Blockstream (2014)', label: { position: 'insideStartTop', padding: [0, 0, 0, 10] } },
                        { xAxis: '2016', name: 'Chaincode (2016)', label: { position: 'insideStartTop', padding: [0, 0, 0, 10] } },
                        { xAxis: '2020', name: 'Brink (2020)', label: { position: 'insideStartTop', padding: [0, 0, 0, 10] } },
                        { yAxis: 3, name: 'Critical Risk Zone', label: { position: 'end', color: '#f59e0b', formatter: '{b}' }, lineStyle: { color: '#f59e0b', type: 'solid', opacity: 0.8, width: 2 } }
                    ]
                }
            }]
        });
        charts.busFactor = chart;
    } catch(e) {
        console.error("Bus Factor chart load error:", e);
    }
}

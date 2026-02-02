/**
 * Codebase specific chart loaders
 */

async function loadCodebaseSnapshots() {
    try {
        try {
            const resVital = await fetch('data/dashboard_vital_signs.json');
            const dataVital = await resVital.json();
            if (document.getElementById('kpi-total-lines')) {
                document.getElementById('kpi-total-lines').innerText = (dataVital.current_codebase_size / 1000000).toFixed(2) + "M";
            }
        } catch (e) { }

        const res = await fetch('data/stats_codebase_snapshots.json');
        if (!res.ok) return;
        const data = await res.json();

        const totalFiles = data.files_by_cat.reduce((acc, curr) => acc + curr.value, 0);
        const totalLangs = data.files_by_lang.length;

        if (document.getElementById('kpi-total-files')) document.getElementById('kpi-total-files').innerText = totalFiles.toLocaleString();
        if (document.getElementById('kpi-total-langs')) document.getElementById('kpi-total-langs').innerText = totalLangs;

        if (charts.filesLang) {
            const slice = data.files_by_lang.slice(0, 12);
            charts.filesLang.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0], val = item.value / totalFiles * 100, pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        let html = `<b>${item.name}</b><br/><b>${formatCount(item.value)} Files</b> (${pct}%)`;
                        if (item.data && item.data.details) html += `<div style="font-size:10px; color:#718096; margin-top:4px; max-width:200px;">Includes: ${item.data.details}</div>`;
                        return html;
                    }
                },
                grid: { left: '4%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', show: false },
                yAxis: { ...axisStyle, type: 'category', data: slice.map(x => x.name), inverse: true },
                series: [{
                    name: 'Files', type: 'bar', data: slice.map(x => ({ value: x.value, details: x.details })),
                    itemStyle: { color: GHIBLI_PALETTE[2], borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' }
                }]
            });
        }

        if (charts.filesCat) {
            const slice = data.files_by_cat;
            charts.filesCat.setOption({
                backgroundColor: 'transparent',
                tooltip: {
                    ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' },
                    formatter: function (params) {
                        const item = params[0], val = item.value / totalFiles * 100, pct = val < 5 ? val.toFixed(1) : val.toFixed(0);
                        return `<b>${item.name}</b><br/><b>${formatCount(item.value)} Files</b> (${pct}%)`;
                    }
                },
                grid: { left: '4%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', show: false },
                yAxis: { ...axisStyle, type: 'category', data: slice.map(x => x.name), inverse: true, axisLabel: { ...axisStyle.axisLabel, fontSize: 10 } },
                series: [{
                    name: 'Files', type: 'bar', data: slice.map(x => x.value),
                    itemStyle: { color: GHIBLI_PALETTE[5], borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' }
                }]
            });
        }
    } catch (e) { }
}

async function loadStreamgraph() {
    try {
        const res = await fetch('data/stats_stack_evolution.json');
        if (!res.ok) return;
        const data = await res.json();
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2026 ? i : -1).filter(i => i !== -1);
        const riverData = [];
        data.series.forEach(s => {
            validIndices.forEach(idx => {
                const date = data.xAxis[idx] + "-01";
                const val = s.data[idx];
                if (val > 0) riverData.push([date, val, s.name]);
            });
        });

        charts.streamgraph.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } },
                formatter: function (params) {
                    if (!params || !params.length) return "";
                    const dateStr = params[0].axisValue, dateObj = new Date(dateStr), formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                    let total = 0; params.forEach(p => total += p.value[1]);
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${formattedDate}</b></div><div style="margin-bottom:5px; font-size:11px;">Total: <b>${formatCount(total)}</b> Lines</div>`;
                    const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);
                    sorted.forEach(p => {
                        const val = p.value[1], name = p.value[2], pct = (val / total * 100).toFixed(1);
                        const series = data.series.find(s => s.name === name);
                        let details = series ? series.details : null;
                        if (Array.isArray(details)) {
                            const dateIdx = data.xAxis.indexOf(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`);
                            details = details[dateIdx] || null;
                        }
                        html += `<div style="display:flex; flex-direction:column; margin-bottom:4px;"><div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;"><span>${p.marker} ${name}</span><span><b>${pct}%</b> <span style="opacity:0.7">(${formatCount(val)})</span></span></div>`;
                        if (details) html += `<div style="font-size:10px; color:#718096; margin-left:18px;">Includes: ${details}</div>`;
                        html += `</div>`;
                    });
                    return html;
                },
                ...tooltipStyle
            },
            legend: { ...legendStyle, data: data.series.map(s => s.name), bottom: 0 },
            singleAxis: {
                top: 50, bottom: 50, type: 'time',
                axisTick: { show: false }, axisLabel: { ...axisStyle.axisLabel },
                axisPointer: { animation: true, label: { show: true } },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.2 } }
            },
            series: [{
                type: 'themeRiver', emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } },
                data: riverData, label: { show: false }, itemStyle: { shadowBlur: 2, shadowColor: 'rgba(0,0,0,0.3)' }
            }],
            color: GHIBLI_PALETTE.slice(2)
        });
    } catch (e) { }
}

async function loadCategoryHistory() {
    try {
        const res = await fetch('data/stats_category_history.json');
        if (!res.ok) return;
        const data = await res.json();
        const validIndices = data.xAxis.map((x, i) => parseInt(x) <= 2026 ? i : -1).filter(i => i !== -1);
        const riverData = [];
        data.series.forEach(s => {
            validIndices.forEach(idx => {
                const date = data.xAxis[idx] + "-01";
                const val = s.data[idx];
                if (val > 0) riverData.push([date, val, s.name]);
            });
        });

        charts.catEvolution.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } },
                formatter: function (params) {
                    if (!params || !params.length) return "";
                    const dateStr = params[0].axisValue, dateObj = new Date(dateStr), formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                    let total = 0; params.forEach(p => total += p.value[1]);
                    let html = `<div style="margin-bottom:5px; border-bottom:1px solid #eee;"><b>${formattedDate}</b></div><div style="margin-bottom:5px; font-size:11px;">Total: <b>${formatCount(total)}</b> Lines</div>`;
                    const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);
                    sorted.forEach(p => {
                        const val = p.value[1], name = p.value[2], pct = (val / total * 100).toFixed(1);
                        html += `<div style="display:flex; justify-content:space-between; gap:15px; font-size:12px;"><span>${p.marker} ${name}</span><span><b>${pct}%</b> <span style="opacity:0.7">(${formatCount(val)})</span></span></div>`;
                    });
                    return html;
                },
                ...tooltipStyle
            },
            legend: { ...legendStyle, data: data.series.map(s => s.name), bottom: 0, type: 'scroll' },
            singleAxis: {
                top: 50, bottom: 50, type: 'time',
                axisTick: { show: false }, axisLabel: { ...axisStyle.axisLabel },
                axisPointer: { animation: true, label: { show: true } },
                splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.2 } }
            },
            series: [{
                type: 'themeRiver', emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } },
                data: riverData, label: { show: false }, itemStyle: { shadowBlur: 2, shadowColor: 'rgba(0,0,0,0.3)' }
            }],
            color: GHIBLI_PALETTE
        });
    } catch (e) { }
}

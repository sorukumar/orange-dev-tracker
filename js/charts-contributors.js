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
            'The Regulars (Top 10%)': { color: '#F4A261', priority: 2, opacity: 0.9, symbol: 'circle' },
            'The Sustainers (Top 25%)': { color: '#D4AF37', priority: 3, opacity: 0.8, symbol: 'circle' },
            'The Explorers': { color: '#89B449', priority: 4, opacity: 0.7, symbol: 'circle' },
            'The Scouts': { color: '#3182CE', priority: 5, opacity: 0.5, symbol: 'circle' }
        };

        const portraits = {
            'Satoshi Nakamoto': 'assets/satoshi.png',
            'Gavin Andresen': 'assets/gavin_andresen.png',
            'Wladimir J. van der Laan': 'assets/wladimir.png',
            'MarcoFalke': 'assets/marcofalke.png',
            'Michael Ford': 'assets/michael_ford.png',
            'Pieter Wuille': 'assets/pieter_wuille.png'
        };

        const groupedSeries = {};
        Object.keys(rankStyles).forEach(rank => groupedSeries[rank] = []);

        rawData.filter(item => item && item.cohort_year && item.cohort_year <= 2025).forEach(item => {
            const p = item.percentile_raw || 0;
            let rank;
            if (p >= 99) rank = 'The Core (Top 1%)';
            else if (p >= 90) rank = 'The Regulars (Top 10%)';
            else if (p >= 75) rank = 'The Sustainers (Top 25%)';
            else if (p >= 50) rank = 'The Explorers';
            else rank = 'The Scouts';

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
        console.timeEnd("loadContributorLandscape");
    } catch (e) {
        console.error("Galaxy Rendering Error:", e);
    }
}

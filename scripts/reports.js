/* reports.js for orange-dev-tracker Playwright targets */

document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Fetching monthly snapshot data...");
        // In playwright context, this route will be intercepted and fed the latest JSON
        const response = await fetch('data/monthly_snapshots/latest.json');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Snapshot data loaded:", data);
        
        populateCover(data);
        renderActiveDevsChart(data);
        populateStackMetrics(data);
        
        // Signal Playwright that rendering is complete
        setTimeout(() => {
            document.body.setAttribute('data-loaded', 'true');
        }, 1000);
        
    } catch (error) {
        console.error("Error generating report:", error);
        document.body.innerHTML = `<h1>Error generating report: ${error.message}</h1>`;
        document.body.setAttribute('data-loaded', 'true');
    }
});

function populateCover(data) {
    const month = data.target_month_formatted || "Unknown Month";
    
    document.getElementById("cover-date").textContent = month;
    document.getElementById("s2-date").textContent = month;
    document.getElementById("s3-date").textContent = month;
    
    const m = data.metrics || {};
    document.getElementById("val-active-devs").textContent = m.monthly_active_contributors || "0";
    document.getElementById("val-new-devs").textContent = m.monthly_new_contributors || "0";
    document.getElementById("val-total-prs").textContent = m.total_prs ? m.total_prs.toLocaleString() : "0";
    document.getElementById("val-total-devs").textContent = m.total_contributors ? m.total_contributors.toLocaleString() : "0";
}

function renderActiveDevsChart(data) {
    const ctx = document.getElementById('active-devs-chart');
    if (!ctx) return;
    
    const growth = data.raw_data?.growth || {};
    if (!growth.labels || !growth.active_contributors) {
        console.warn("No growth data for chart");
        return;
    }
    
    // Take the last 24 months for the chart
    const labels = growth.labels.slice(-24);
    const active = growth.active_contributors.slice(-24);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Active Contributors',
                data: active,
                backgroundColor: '#F7931A',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E0E0E0' },
                    ticks: { font: { size: 14 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        font: { size: 12 },
                        maxTicksLimit: 12
                    }
                }
            }
        }
    });
}

function populateStackMetrics(data) {
    const container = document.getElementById("stack-metrics");
    if (!container) return;
    
    const stack = data.raw_data?.stack || {};
    if (!stack.labels || !stack.series || !stack.series.length) {
        container.innerHTML = '<div class="list-item">No stack data available</div>';
        return;
    }
    
    // Sort stack areas by volume (using the first series, assuming it's PR volume or similar)
    const volumes = stack.labels.map((label, i) => ({
        label: label,
        value: stack.series[0].data[i] || 0
    })).sort((a, b) => b.value - a.value);
    
    let html = '';
    volumes.slice(0, 5).forEach((item, index) => {
        html += `
        <div class="list-item">
            <div class="rank">#${index + 1}</div>
            <div class="label">${item.label.toUpperCase()}</div>
            <div class="value">${item.value} PRs</div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

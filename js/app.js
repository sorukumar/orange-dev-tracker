/**
 * Orange Dev Tracker - Main Orchestrator
 */

async function init() {
    console.log("Orange Dev Tracker: Initializing...");

    // Refresh palette from CSS variables (defined in theme.js)
    GHIBLI_PALETTE = getGhibliPalette();

    function initChart(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        try {
            const instance = echarts.init(el);
            console.log(`Initialized ECharts for #${id}`);
            return instance;
        } catch (e) {
            console.error(`Failed to initialize ECharts for #${id}:`, e);
            return null;
        }
    }

    // Registry of all potential charts across all pages
    charts.snapshotWork = initChart('chart-snapshot-work');
    charts.snapshotVolume = initChart('chart-snapshot-volume');
    charts.snapshotStack = initChart('chart-snapshot-stack');
    charts.filesLang = initChart('chart-snapshot-files-lang');
    charts.filesCat = initChart('chart-snapshot-files-cat');
    charts.stackEvolution = initChart('chart-stack-evolution');
    charts.streamgraph = initChart('chart-streamgraph');
    charts.catEvolution = initChart('chart-category-evolution');
    charts.heatmap = initChart('chart-heatmap');
    charts.weekend = initChart('chart-weekend');
    charts.category = initChart('chart-category');
    charts.growth = initChart('chart-growth');
    charts.engagement = initChart('chart-engagement-tiers');
    charts.social = initChart('chart-social');

    charts.landscape = initChart('chart-contributor-landscape');
    charts.churn = initChart('chart-churn');
    charts.retention = initChart('chart-retention');
    charts.reviewers = initChart('chart-reviewers');
    charts.regionalEvolution = initChart('chart-regional-evolution');
    charts.busFactor = initChart('chart-bus-factor');

    window.addEventListener('resize', () => {
        Object.values(charts).forEach(c => c && c.resize());
    });

    // Strategy: Only load data for charts that actually exist in the current DOM
    try {
        // Shared / Snapshots logic
        if (charts.snapshotWork || charts.snapshotVolume || charts.snapshotStack) {
            await loadSnapshots(); // in charts-dashboard.js (now shared-ish)
        }

        // Dashboard specific
        if (document.getElementById('kpi-contributors')) await loadVitalSigns();
        if (charts.category) await loadCategory();
        if (charts.growth) await loadGrowth();
        if (charts.engagement) await loadEngagementTiers();
        if (charts.social) await loadSocial();

        if (charts.heatmap) await loadStory();

        // Codebase specific
        if (charts.streamgraph || charts.filesCat) await loadCodebaseSnapshots();
        if (charts.streamgraph) await loadStreamgraph();
        if (charts.catEvolution) await loadCategoryHistory();

        // Health specific
        if (document.getElementById('chart-geography')) await loadGeography();
        if (document.getElementById('matrix-maintainer-independence')) await loadMaintainerIndependence();
        if (document.getElementById('chart-regional-evolution')) await loadRegionalEvolution();
        if (document.getElementById('vital-signs-scorecard')) await loadVitalSignsScorecard();
        if (charts.busFactor) await loadBusFactorChart();

        // Health: Data-driven vital signs panel (after heatmap/weekend charts are loaded)
        if (document.getElementById('vital-hourly-coverage')) await populateVitalSignsPanel();

        // Health: Retention KPI summary cards
        if (document.getElementById('kpi-active-regulars')) await populateRetentionKPIs();

        // Advanced Engineering Metrics
        if (charts.churn) await loadChurnMetrics();
        if (charts.retention) await loadRetentionMetrics();
        if (charts.reviewers) await loadReviewersMetrics();

        // Contributors specific
        if (charts.landscape) await loadContributorLandscape();

    } catch (err) {
        console.error("Initialization Error during data load:", err);
    }
}

// Initialized via DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', init);

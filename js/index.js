/**
 * Ecosystem Portal - Landing Page Logic
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SHARED_BASE = isLocal
    ? 'output/shared/'
    : 'https://raw.githubusercontent.com/sorukumar/orange-dev-data/main/output/shared/';

const STATS_URL = SHARED_BASE + 'ecosystem_summary.json';
const SNAPSHOT_URL = SHARED_BASE + 'network_home_snapshot.json';

async function initLanding() {
    let stats = null;
    let snapshot = null;

    try {
        const [statsResp, snapshotResp] = await Promise.all([
            fetch(STATS_URL),
            fetch(SNAPSHOT_URL),
        ]);

        if (statsResp.ok) stats = await statsResp.json();
        if (snapshotResp.ok) snapshot = await snapshotResp.json();
    } catch (error) {
        console.error('Failed to load landing data:', error);
    }

    if (stats) {
        renderDomainSummary(stats);
    } else {
        const listEl = document.getElementById('domain-count-list');
        if (listEl) {
            listEl.innerHTML = '<li>Unable to load contributor counts at this time.</li>';
        }
    }

    renderFreshnessLine(stats, snapshot);
    renderLiveWidgets(stats, snapshot);
}

function renderDomainSummary(stats) {
    const listEl = document.getElementById('domain-count-list');
    const insightEl = document.getElementById('summary-insight');
    if (!listEl) return;

    const groups = stats.groups || {};
    const vennSummary = stats.venn_summary || {};
    const values = [
        { label: 'Code contributors', value: groups.committers, note: 'Git committers and core PR participants' },
        { label: 'Review contributors', value: groups.reviewers, note: 'Peer review and code feedback contributors' },
        { label: 'Research contributors', value: groups.research, note: 'Mailing list and Delving discussion participants' },
        { label: 'BIP authors', value: groups.standards, note: 'Standards authors and protocol specification contributors' },
        { label: 'All four domains', value: vennSummary.all_four, note: 'People active in Code, Review, Research, and Standards' }
    ];

    const allFourValue = vennSummary.all_four != null ? vennSummary.all_four.toLocaleString() : '—';
    const totalDevs = groups.total_registry || groups.total_active;
    const totalStr  = totalDevs ? totalDevs.toLocaleString() : null;
    if (insightEl) {
        insightEl.innerText = totalStr
            ? `Out of ${totalStr} developers tracked, ${allFourValue} have contributed across all four domains.`
            : `Currently ${allFourValue} contributors span all four domains.`;
    }

    listEl.innerHTML = values.map(item => {
        const value = item.value != null ? item.value.toLocaleString() : '–';
        return `<li><strong>${item.label}:</strong> ${value}<span>${item.note}</span></li>`;
    }).join('');

}

function renderFreshnessLine(stats, snapshot) {
    const el = document.getElementById('freshness-line');
    if (!el) return;

    const generated = (stats && stats.generated_at) || (snapshot && snapshot.generated_at);
    const count = snapshot ? snapshot.contributors_tracked : null;

    const stamp = generated ? formatMonthYear(generated) : 'Unknown date';
    el.textContent = `Updated ${stamp}`;
}

function renderLiveWidgets(stats, snapshot) {
    renderActiveContributorsWidget(snapshot);
    renderResearchActivityWidget(snapshot);
    renderDiscussionVoicesWidget(snapshot);
    renderTopicMomentumWidget(snapshot);
    renderRecentBipsWidget(snapshot);
    renderNewcomersWidget(stats);
    renderMergedPrsWidget(stats);
    renderSpotlightWidget(stats);
}

function renderActiveContributorsWidget(snapshot) {
    const valueEl = document.getElementById('widget-active-count');
    if (!valueEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets.active_contributors_30d : null;
    if (!widget) {
        valueEl.textContent = '-';
        return;
    }

    const current = Number(widget.value || 0);
    const previous = Number(widget.previous_30d || 0);
    const delta = Number(widget.delta_30d || (current - previous));

    valueEl.textContent = current.toLocaleString();
}

function renderMergedPrsWidget(stats) {
    const valueEl = document.getElementById('widget-prs-count');
    const noteEl = document.getElementById('widget-prs-note');
    const commitsEl = document.getElementById('widget-commits-count');
    if (!valueEl || !noteEl) return;

    if (!stats || !stats.prs) {
        valueEl.textContent = '-';
        noteEl.textContent = 'PR metrics unavailable.';
        return;
    }

    const merged30d = Number(stats.prs.merged_30d || 0);
    const total = Number(stats.prs.total_merged || 0);

    valueEl.textContent = merged30d.toLocaleString();
    noteEl.textContent = `Sustaining velocity with ${total.toLocaleString()} cumulative PRs merged to date.`;
    
    if (commitsEl && stats.commits) {
        commitsEl.textContent = Number(stats.commits.commits_30d || 0).toLocaleString();
    }
}

function renderTopicMomentumWidget(snapshot) {
    const el = document.getElementById('widget-topics');
    if (!el) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets.topic_momentum_30d : null;
    const items = widget ? (widget.items || []).slice(0, 3) : [];
    if (!items.length) {
        el.innerHTML = '<li>Topic momentum unavailable.</li>';
        return;
    }

    el.innerHTML = items.map(item => {
        const label = escHtml(item.label || item.topic || 'Unknown');
        const count = Math.round(item.mentions_30d || 0).toLocaleString();
        const delta = Number(item.delta_30d || 0);
        return `<li>${label} <strong>${count}</strong> <span class="delta-pill">${formatDelta(delta)}</span></li>`;
    }).join('');
}

function renderRecentBipsWidget(snapshot) {
    const el = document.getElementById('widget-bips');
    if (!el) return;

    const items = snapshot && snapshot.widgets && snapshot.widgets.recent_bips
        ? (snapshot.widgets.recent_bips.items || []).slice(0, 3)
        : [];
    if (!items.length) {
        el.innerHTML = '<li>No recent BIP discussions in this window.</li>';
        return;
    }

    el.innerHTML = items.map(item => {
        const bipId = String(item.bip_id || '');
        const title = escHtml(item.title || `BIP ${bipId}`);
        const author = escHtml(item.primary_author || 'Unknown');
        const authorLink = item.primary_author_uuid
            ? `https://sorukumar.github.io/orange-dev-network/profile.html?uuid=${encodeURIComponent(item.primary_author_uuid)}`
            : null;
        const authorHtml = authorLink
            ? `<a class="bip-link" href="${authorLink}" target="_blank" rel="noopener noreferrer">${author}</a>`
            : author;

        const delta = Number(item.delta_30d || 0);
        const mentions = Number(item.mentions_30d || 0).toLocaleString();
        return `<li><strong>BIP ${escHtml(bipId)}</strong> ${title}<span> - ${authorHtml} · ${mentions} mentions · ${formatDelta(delta)}</span></li>`;
    }).join('');
}

function renderResearchActivityWidget(snapshot) {
    const sparkEl = document.getElementById('widget-mailing-spark');
    if (!sparkEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets.research_activity_30d : null;
    if (!widget) {
        sparkEl.textContent = 'Signal unavailable';
        return;
    }

    const ml30 = Number(widget.messages_30d || 0);
    const prev30 = Number(widget.previous_30d || 0);
    const delta = Number(widget.delta_30d || (ml30 - prev30));
    const paceLabel = widget.momentum || 'steady';
    sparkEl.textContent = `${ml30.toLocaleString()} messages (Δ ${formatDelta(delta)})`;
}

function renderDiscussionVoicesWidget(snapshot) {
    const valueEl = document.getElementById('widget-voices-count');
    if (!valueEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets.discussion_voices_30d : null;
    if (!widget) {
        valueEl.textContent = '-';
        return;
    }

    const current = Number(widget.value || 0);
    const previous = Number(widget.previous_30d || 0);
    const delta = Number(widget.delta_30d || (current - previous));
    valueEl.textContent = current.toLocaleString();
}

function renderNewcomersWidget(stats) {
    const valueEl = document.getElementById('widget-newcomers');
    if (!valueEl) return;

    const onboarding = stats && stats.onboarding ? stats.onboarding : null;
    if (!onboarding) {
        valueEl.textContent = '-';
        return;
    }

    const coders = onboarding.new_coders_30d !== undefined 
        ? Number(onboarding.new_coders_30d) 
        : Math.round(Number(onboarding.new_coders_90d || 0) / 3);
        
    const discussants = onboarding.new_discussants_30d !== undefined 
        ? Number(onboarding.new_discussants_30d) 
        : Math.round(Number(onboarding.new_discussants_90d || 0) / 3);
        
    const total = coders + discussants;

    valueEl.textContent = total.toLocaleString();
}

function renderSpotlightWidget(stats) {
    const container = document.getElementById('widget-spotlight-container');
    const content = document.getElementById('widget-spotlight-content');
    if (!container || !content) return;

    if (stats && stats.spotlight) {
        const name = escHtml(stats.spotlight.name || 'Unknown');
        const desc = escHtml(stats.spotlight.description || '');
        const uuid = stats.spotlight.uuid;
        
        let nameHtml = `<strong style="color: var(--text-primary);">${name}</strong>`;
        if (uuid && uuid !== 'nan' && uuid !== 'None') {
            const profileLink = `https://sorukumar.github.io/orange-dev-network/profile.html?uuid=${encodeURIComponent(uuid)}`;
            nameHtml = `<a class="reviewer-link" href="${profileLink}" target="_blank" rel="noopener noreferrer"><strong>${name}</strong></a>`;
        }
        
        content.innerHTML = `${nameHtml} — ${desc}`;
    } else {
        // Fallback placeholder while orange-dev-data is updated
        content.innerHTML = `<strong style="color: var(--text-primary);">Awaiting Data</strong> — Pipeline will feature first-time contributors here.`;
    }
}

function formatMonthYear(input) {
    const d = new Date(input);
    if (!Number.isFinite(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDelta(n) {
    const val = Number(n || 0);
    if (val > 0) return `+${val.toLocaleString()}`;
    if (val < 0) return `${val.toLocaleString()}`;
    return '0';
}

document.addEventListener('DOMContentLoaded', initLanding);

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
    
    setupWindowToggle(stats, snapshot);
    renderLiveWidgets(stats, snapshot, '30d');

}


function setupWindowToggle(stats, snapshot) {
    const toggle = document.getElementById('pulse-window-toggle');
    if (!toggle) return;
    
    toggle.querySelectorAll('.window-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggle.querySelectorAll('.window-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderLiveWidgets(stats, snapshot, btn.dataset.window);
        });
    });
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
    el.textContent = `Data as of: ${stamp}`;
}

function renderLiveWidgets(stats, snapshot, windowKey = '30d') {
    renderActiveContributorsWidget(snapshot, windowKey);
    renderResearchActivityWidget(snapshot, windowKey);
    renderDiscussionVoicesWidget(snapshot, windowKey);
    renderTopicMomentumWidget(snapshot, windowKey);
    renderRecentBipsWidget(snapshot, windowKey);
    renderNewcomersWidget(stats, windowKey);
    renderMergedPrsWidget(stats, windowKey);
    renderSpotlightWidget(stats, windowKey);
}

function renderActiveContributorsWidget(snapshot, windowKey = '30d') {
    const valueEl = document.getElementById('widget-active-count');
    if (!valueEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets[`active_contributors_${windowKey}`] : null;
    if (!widget) {
        valueEl.textContent = '-';
        return;
    }

    const current = Number(widget.value || 0);
    const previous = Number(widget[`previous_${windowKey}`] || 0);
    const delta = Number(widget[`delta_${windowKey}`] || (current - previous));

    valueEl.innerHTML = `${current.toLocaleString()} <span class="delta-pill" style="font-size: 14px; margin-left: 8px; vertical-align: middle;" title="Change vs previous window">${formatDelta(delta)}</span>`;
}

function renderMergedPrsWidget(stats, windowKey = '30d') {
    const valueEl = document.getElementById('widget-prs-count');
    const noteEl = document.getElementById('widget-prs-note');
    const commitsEl = document.getElementById('widget-commits-count');
    if (!valueEl || !noteEl) return;

    if (!stats || !stats.prs) {
        valueEl.textContent = '-';
        noteEl.textContent = 'PR metrics unavailable.';
        return;
    }

    const merged30d = Number(stats.prs[`merged_${windowKey}`] || 0);
    const prevMerged30d = Number(stats.prs[`merged_prev_${windowKey}`] || 0);
    const deltaMerged = merged30d - prevMerged30d;
    const total = Number(stats.prs.total_merged || 0);

    const deltaHtml = stats.prs[`merged_prev_${windowKey}`] !== undefined 
        ? `<span class="delta-pill" style="font-size: 14px; margin-left: 8px; vertical-align: middle;" title="Change vs previous window">${formatDelta(deltaMerged)}</span>`
        : '';

    valueEl.innerHTML = `${merged30d.toLocaleString()} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">PRs Merged</span>${deltaHtml}`;
    noteEl.textContent = `Sustaining velocity with ${total.toLocaleString()} cumulative PRs merged to date.`;
    
    if (commitsEl && stats.commits) {
        const c30 = Number(stats.commits[`commits_${windowKey}`] || 0);
        const cPrev = Number(stats.commits[`commits_prev_${windowKey}`] || 0);
        const deltaC = c30 - cPrev;
        const deltaCHtml = stats.commits[`commits_prev_${windowKey}`] !== undefined 
            ? ` <span class="delta-pill" title="Change vs previous window">${formatDelta(deltaC)}</span>`
            : '';
        commitsEl.innerHTML = `<strong>${c30.toLocaleString()}</strong> commits pushed${deltaCHtml}`;
    }
}

function renderTopicMomentumWidget(snapshot, windowKey = '30d') {
    const el = document.getElementById('widget-topics');
    if (!el) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets[`topic_momentum_${windowKey}`] : null;
    const items = widget ? (widget.items || []).slice(0, 3) : [];
    if (!items.length) {
        el.innerHTML = '<li>Topic momentum unavailable.</li>';
        return;
    }

    el.innerHTML = items.map(item => {
        const label = escHtml(item.label || item.topic || 'Unknown');
        const count = Math.round(item[`mentions_${windowKey}`] || 0).toLocaleString();
        const delta = Number(item[`delta_${windowKey}`] || 0);
        return `<li>${label} <strong>${count}</strong> <span class="delta-pill" title="Change vs previous window">${formatDelta(delta)}</span></li>`;
    }).join('');
}

function renderRecentBipsWidget(snapshot, windowKey = '30d') {
    const el = document.getElementById('widget-bips');
    if (!el) return;

    const items = snapshot && snapshot.widgets && snapshot.widgets[`recent_bips_${windowKey}`]
        ? (snapshot.widgets[`recent_bips_${windowKey}`].items || []).slice(0, 3)
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

        const delta = Number(item[`delta_${windowKey}`] || 0);
        const mentions = Number(item[`mentions_${windowKey}`] || 0).toLocaleString();
        return `<li><strong>BIP ${escHtml(bipId)}</strong> ${title}<span> - ${authorHtml} · ${mentions} mentions · ${formatDelta(delta)}</span></li>`;
    }).join('');
}

function renderResearchActivityWidget(snapshot, windowKey = '30d') {
    const countEl = document.getElementById('widget-research-count');
    const noteEl = document.getElementById('widget-research-note');
    if (!countEl || !noteEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets[`research_activity_${windowKey}`] : null;
    if (!widget) {
        countEl.textContent = '-';
        noteEl.textContent = 'Signal unavailable';
        return;
    }

    const ml30 = Number(widget[`messages_${windowKey}`] || 0);
    const prev30 = Number(widget[`previous_${windowKey}`] || 0);
    const delta = Number(widget[`delta_${windowKey}`] || (ml30 - prev30));
    
    countEl.textContent = ml30.toLocaleString();
    noteEl.textContent = `Messages across mailing lists and forums (Δ ${formatDelta(delta)})`;
}

function renderDiscussionVoicesWidget(snapshot, windowKey = '30d') {
    const valueEl = document.getElementById('widget-voices-count');
    if (!valueEl) return;

    const widget = snapshot && snapshot.widgets ? snapshot.widgets[`discussion_voices_${windowKey}`] : null;
    if (!widget) {
        valueEl.textContent = '-';
        return;
    }

    const current = Number(widget.value || 0);
    const previous = Number(widget[`previous_${windowKey}`] || 0);
    const delta = Number(widget[`delta_${windowKey}`] || (current - previous));
    valueEl.innerHTML = `<strong>${current.toLocaleString()}</strong> research participants <span class="delta-pill" title="Change vs previous window">${formatDelta(delta)}</span>`;
}

function renderNewcomersWidget(stats, windowKey = '30d') {
    const codersEl = document.getElementById('widget-new-coders');
    const discussantsEl = document.getElementById('widget-new-discussants');
    
    if (!codersEl || !discussantsEl) return;

    const onboarding = stats && stats.onboarding ? stats.onboarding : null;
    if (!onboarding) {
        codersEl.innerHTML = `<strong>-</strong> new code contributors`;
        discussantsEl.innerHTML = `<strong>-</strong> new forum voices`;
        return;
    }

    const coders = onboarding[`new_coders_${windowKey}`] !== undefined 
        ? Number(onboarding[`new_coders_${windowKey}`]) 
        : Math.round(Number(onboarding.new_coders_90d || 0) / 3);
        
    const discussants = onboarding[`new_discussants_${windowKey}`] !== undefined 
        ? Number(onboarding[`new_discussants_${windowKey}`]) 
        : Math.round(Number(onboarding.new_discussants_90d || 0) / 3);

    codersEl.innerHTML = `<strong>${coders.toLocaleString()}</strong> new code contributors`;
    discussantsEl.innerHTML = `<strong>${discussants.toLocaleString()}</strong> new forum voices`;
}

function renderSpotlightWidget(stats, windowKey = '30d') {
    const container = document.getElementById('widget-spotlight-container');
    const content = document.getElementById('widget-spotlight-content');
    if (!container || !content) return;

    if (stats && stats.spotlight) {
        const name = escHtml(stats.spotlight.name || 'Unknown');
        const desc = escHtml(stats.spotlight.description || '');
        const uuid = stats.spotlight.uuid;
        const gh = stats.spotlight.github_login || '';
        
        const avatarUrl = gh 
            ? `https://github.com/${encodeURIComponent(gh)}.png?size=80` 
            : 'https://bitcoindatalabs.org/images/default_avatar.png';

        let nameHtml = `<div style="color: var(--text-primary); font-weight: 700;">${name}</div>`;
        if (uuid && uuid !== 'nan' && uuid !== 'None') {
            const profileLink = `https://sorukumar.github.io/orange-dev-network/profile.html?uuid=${encodeURIComponent(uuid)}`;
            nameHtml = `<a class="reviewer-link" href="${profileLink}" target="_blank" rel="noopener noreferrer" style="color: var(--text-primary); font-weight: 700; text-decoration: none;">${name}</a>`;
        }
        
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                <img src="${avatarUrl}" alt="${name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" onerror="this.src='https://github.com/identicons/${name}.png'">
                <div>
                    ${nameHtml}
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${desc}</div>
                </div>
            </div>
        `;
    } else {
        // Fallback placeholder while orange-dev-data is updated
        content.innerHTML = `<strong style="color: var(--text-primary);">Awaiting Data</strong> — Pipeline will feature first-time core contributors here.`;
    }
}

function formatMonthYear(input) {
    if (!input) return 'Unknown';
    const parts = input.split('T')[0].split('-');
    if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'Unknown';
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

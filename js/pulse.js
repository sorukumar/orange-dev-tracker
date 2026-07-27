/**
 * Protocol Pulse — Page Logic
 * Fetches discussions_pulse.json + ecosystem_summary.json and renders all sections.
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const PULSE_URL = isLocal
    ? 'output/shared/discussions_pulse.json'
    : 'https://raw.githubusercontent.com/sorukumar/orange-dev-data/main/output/shared/discussions_pulse.json';

const ECOSYSTEM_URL = isLocal
    ? 'output/shared/ecosystem_summary.json'
    : 'https://raw.githubusercontent.com/sorukumar/orange-dev-data/main/output/shared/ecosystem_summary.json';

// Palette for theme bars (cycles for up to 10 themes)
const THEME_COLORS = [
    'var(--primary)',
    '#3b82f6',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
    '#ef4444',
    '#84cc16',
    '#71717a',
];

let pulseData = null;
let activeWindow = '90d';
let activeThreadSource = 'all';

async function initPulse() {
    try {
        const [pulseResp, ecoResp] = await Promise.all([
            fetch(PULSE_URL),
            fetch(ECOSYSTEM_URL),
        ]);

        if (!pulseResp.ok) throw new Error(`Pulse fetch failed: ${pulseResp.status}`);
        pulseData = await pulseResp.json();

        let ecoData = null;
        if (ecoResp.ok) {
            ecoData = await ecoResp.json();
        }

        setupToggle();
        setupThreadTabs();
        renderWindow(activeWindow);

        if (ecoData) {
            // R&D Focus hidden — renderRdFocus(ecoData.rd_focus || {});
        }
    } catch (err) {
        console.error('Failed to load pulse data:', err);
        const hero = document.querySelector('.hero-section p');
        if (hero) hero.textContent = 'Discussion data is currently unavailable. Please try again later.';
    }
}

function setupToggle() {
    document.querySelectorAll('.window-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.window-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeWindow = btn.dataset.window;
            renderWindow(activeWindow);
        });
    });
}

function setupThreadTabs() {
    document.querySelectorAll('.thread-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.thread-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeThreadSource = tab.dataset.source;
            const data = pulseData?.windows?.[activeWindow];
            if (data) renderHotThreads(data.hot_threads || [], activeThreadSource);
        });
    });
}

function renderWindow(windowKey) {
    const data = pulseData?.windows?.[windowKey];
    if (!data) return;

    renderStats(data);
    renderThemes(data.themes || []);
    renderHotThreads(data.hot_threads || [], activeThreadSource);
    renderBipSpotlight(data.top_bips || []);
    renderTopVoices(data.top_voices || []);
    
    // Always render 30d editorial regardless of which window is active
    const w30 = pulseData?.windows?.['30d'];
    renderEditorial(w30?.pulse_editorial);
}

// ── Pulse Editorial ─────────────────────────────────────────────────────────
function renderEditorial(editorial) {
    const container = document.getElementById('pulse-editorial-container');
    if (!container) return;

    if (!editorial || !editorial.summary) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    const summaryEl = document.getElementById('pulse-editorial-summary');
    if (summaryEl) summaryEl.textContent = editorial.summary;

    const insightsEl = document.getElementById('pulse-editorial-insights');
    if (insightsEl) {
        const insights = editorial.insights || [];
        insightsEl.innerHTML = insights.map(i => `<li>${escHtml(i)}</li>`).join('');
    }
}

// ── Stats row ──────────────────────────────────────────────────────────────
function renderStats(data) {
    setText('stat-messages', (data.total_messages || 0).toLocaleString());
    setText('stat-threads', (data.total_threads || 0).toLocaleString());
    setText('stat-voices', (data.unique_voices || 0).toLocaleString());
}

// ── Themes ──────────────────────────────────────────────────────────────────
function renderThemes(themes) {
    const el = document.getElementById('themes-grid');
    if (!el) return;

    if (themes.length === 0) {
        el.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No theme data available.</p>';
        return;
    }

    const maxShare = themes[0]?.share || 1;

    el.innerHTML = themes.map((t, i) => {
        const color = THEME_COLORS[i] || THEME_COLORS[THEME_COLORS.length - 1];
        const barWidth = maxShare > 0 ? Math.round((t.share / maxShare) * 100) : 0;
        const trendClass = `trend-${t.trend || 'steady'}`;
        const trendLabel = { rising: '↑ Rising', fading: '↓ Fading', steady: 'Steady', new: '★ New' }[t.trend] || 'Steady';

        return `
            <div class="theme-card">
                <div class="theme-card-top">
                    <span class="theme-label">${t.label}</span>
                    <div class="theme-meta">
                        <span class="theme-share">${t.share}%</span>
                        <span class="trend-badge ${trendClass}">${trendLabel}</span>
                    </div>
                </div>
                <div class="theme-bar-bg">
                    <div class="theme-bar-fill" style="width: ${barWidth}%; background: ${color};"></div>
                </div>
                <div class="theme-detail">
                    <span><strong>${t.msgs.toLocaleString()}</strong> messages</span>
                    <span><strong>${t.threads.toLocaleString()}</strong> threads</span>
                    <span><strong>${t.voices.toLocaleString()}</strong> voices</span>
                </div>
            </div>
        `;
    }).join('');
}

// ── Hot Threads ─────────────────────────────────────────────────────────────
function renderHotThreads(threads, sourceFilter) {
    const el = document.getElementById('hot-threads-list');
    if (!el) return;

    const filtered = (sourceFilter && sourceFilter !== 'all')
        ? threads.filter(t => t.source === sourceFilter)
        : threads;

    const toRender = filtered.slice(0, 8);

    if (toRender.length === 0) {
        const label = sourceFilter === 'delving' ? 'Delving Bitcoin' : sourceFilter === 'mailing_list' ? 'the mailing list' : 'this window';
        el.innerHTML = `<p style="color: var(--text-secondary); font-size: 14px;">No active threads from ${label} in this window.</p>`;
        return;
    }

    el.innerHTML = toRender.map(t => {
        const hasLink = t.link && t.link.trim();
        const sourceClass = `source-${(t.source || '').replace(' ', '_')}`;
        const sourceLabel = t.source === 'delving' ? 'Delving' : 'Mailing List';
        const lastPost = t.last_post ? formatDate(t.last_post) : '';
        
        const subjectHtml = hasLink ? `<a href="${escHtml(t.link)}" target="_blank" style="color: inherit; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(t.subject)}</a>` : escHtml(t.subject);

        let authorName = t.author || '';
        authorName = authorName.replace(/'? via Bitcoin Development Mailing List'?/gi, '').replace(/'/g, '').trim();

        let authorHtml = '';
        if (authorName && authorName !== 'nan' && authorName !== 'None') {
            if (t.author_uuid && t.author_uuid !== 'nan' && t.author_uuid !== 'None') {
                authorHtml = `<a href="https://network.bitcoindatalabs.org/profile.html?uuid=${escHtml(t.author_uuid)}" target="_blank" style="color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='inherit'">@${escHtml(authorName)}</a>`;
            } else {
                authorHtml = `@${escHtml(authorName)}`;
            }
        }
        
        const prefix = t.is_original_author === false ? 'Discussion led by' : 'By';
        
        const authorLine = authorHtml 
            ? `<div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-top: -2px; margin-bottom: 12px;">${prefix} ${authorHtml}</div>` 
            : '';

        return `
            <div class="thread-card">
                <div class="thread-card-top" style="margin-bottom: 4px;">
                    <span class="thread-subject">${subjectHtml}</span>
                    <div class="thread-badges">
                        <span class="category-badge">${escHtml(t.label)}</span>
                        <span class="source-badge ${sourceClass}">${sourceLabel}</span>
                    </div>
                </div>
                ${authorLine}
                <div class="thread-description" style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                    ${t.summary ? escHtml(t.summary) : (t.insight ? `<em>${escHtml(t.insight)}</em>` : (t.snippet ? escHtml(t.snippet) : ''))}
                </div>
                ${t.technical_summary ? `
                <details class="thread-tech-details">
                    <summary>Technical Details</summary>
                    <div class="tech-details-content">${escHtml(t.technical_summary)}</div>
                </details>
                ` : ''}
                <div class="thread-footer">
                    <span class="thread-footer-stat"><i class="fas fa-reply"></i> ${t.reply_count} repl${t.reply_count === 1 ? 'y' : 'ies'}</span>
                    <span class="thread-footer-stat"><i class="fas fa-users"></i> ${t.unique_authors} voice${t.unique_authors === 1 ? '' : 's'}</span>
                    ${lastPost ? `<span class="thread-footer-stat"><i class="far fa-clock"></i> ${lastPost}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ── BIP Spotlight ────────────────────────────────────────────────────────────
function renderBipSpotlight(bips) {
    const el = document.getElementById('bip-spotlight');
    if (!el) return;

    if (bips.length === 0) {
        el.innerHTML = '<p style="padding: 16px; color: var(--text-secondary); font-size: 13px;">No BIP references in this window.</p>';
        return;
    }

    el.innerHTML = bips.map(b => `
        <div class="bip-row">
            <span class="bip-id">BIP ${escHtml(String(b.bip_id))}</span>
            <span class="bip-title">${b.title ? escHtml(b.title) : '—'}</span>
            <span class="bip-mentions">${b.mentions} mention${b.mentions === 1 ? '' : 's'}</span>
        </div>
    `).join('');
}

// ── Top Voices ───────────────────────────────────────────────────────────────
function renderTopVoices(voices) {
    const el = document.getElementById('top-voices');
    if (!el) return;

    if (voices.length === 0) {
        el.innerHTML = '<p style="padding: 16px; color: var(--text-secondary); font-size: 13px;">No voice data available.</p>';
        return;
    }

    el.innerHTML = voices.map((v, i) => `
        <a href="https://network.bitcoindatalabs.org/profile.html?uuid=${encodeURIComponent(v.uuid)}" target="_blank" class="voice-row" style="text-decoration: none;">
            <span class="voice-rank">${i + 1}</span>
            <span class="voice-name" style="color: var(--text-primary); text-decoration: none;">${escHtml(v.name)}</span>
            <span class="voice-posts">${v.posts} post${v.posts === 1 ? '' : 's'}</span>
        </a>
    `).join('');
}

// ── R&D Focus ────────────────────────────────────────────────────────────────
function renderRdFocus(rdFocus) {
    if (!rdFocus || Object.keys(rdFocus).length === 0) return;

    const SKIP = new Set(['Other', 'General', 'None', 'none', 'code', 'other', '']);
    const sorted = Object.entries(rdFocus)
        .filter(([k]) => !SKIP.has(k))
        .sort((a, b) => b[1] - a[1]);

    const top = sorted.slice(0, 5);
    if (top.length === 0) return;

    setText('rd-focus-val', top[0][0]);
    setText('rd-focus-sub', `Leading R&D area by contributor focus (${top[0][1]}% of active contributors)`);

    const bar = document.getElementById('focus-bar');
    const legend = document.getElementById('focus-legend');
    if (!bar) return;

    bar.innerHTML = '';
    if (legend) legend.innerHTML = '';

    top.forEach(([name, pct], i) => {
        const color = THEME_COLORS[i] || 'var(--text-secondary)';

        const seg = document.createElement('div');
        seg.className = 'focus-segment';
        seg.style.width = `${pct}%`;
        seg.style.background = color;
        seg.title = `${name}: ${pct}%`;
        bar.appendChild(seg);

        if (legend) {
            const dot = document.createElement('div');
            dot.style.cssText = `display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary);`;
            dot.innerHTML = `<span style="width:8px; height:8px; border-radius:50%; background:${color}; display:inline-block; flex-shrink:0;"></span>${escHtml(name)} <span style="color:var(--text-primary); font-weight:600;">${pct}%</span>`;
            legend.appendChild(dot);
        }
    });
}

// ── Utilities ────────────────────────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

document.addEventListener('DOMContentLoaded', initPulse);

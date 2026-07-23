import re

# Update script.js
path_js = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path_js, 'r') as f:
    js = f.read()

old_populate = """function populateGhostGallery(overlapData) {
    const gallery = document.getElementById('ghost-gallery');
    if (!gallery || !overlapData.both_devs) return;

    // Filter to ancient_ghost provenance, sort by all-time Core commits (descending)
    const ghosts = overlapData.both_devs
        .filter(d => d.provenance === 'ancient_ghost')
        .sort((a, b) => b.commits_core_all_time - a.commits_core_all_time)
        .slice(0, 5); // Top 5 most prolific

    if (ghosts.length === 0) {
        gallery.innerHTML = '<p style="color: var(--text-secondary);">No ghost contributors found.</p>';
        return;
    }

    gallery.innerHTML = ghosts.map(dev => {
        const profileLink = dev.has_profile
            ? `<a href="https://network.bitcoindatalabs.org/profile.html?uuid=${dev.uuid}" target="_blank" style="color: var(--text-primary); text-decoration: none;">${dev.name}</a>`
            : dev.name;
        return `
            <div class="ghost-card">
                <div class="ghost-emoji">👻</div>
                <div class="ghost-name">${profileLink}</div>
                <div class="ghost-stats">
                    <strong>${dev.commits_core_all_time.toLocaleString()}</strong> Core commits<br>
                    <strong>${dev.commits_knots}</strong> in Knots (salvaged)
                </div>
            </div>
        `;
    }).join('');
}"""

new_populate = """function populateGhostGallery(overlapData) {
    const gallery = document.getElementById('ghost-gallery');
    if (!gallery || !overlapData.both_devs) return;

    const ghosts = overlapData.both_devs
        .filter(d => d.provenance === 'ancient_ghost')
        .sort((a, b) => b.commits_core_all_time - a.commits_core_all_time)
        .slice(0, 5);

    if (ghosts.length === 0) {
        gallery.innerHTML = '<p style="color: var(--text-secondary);">No ghost contributors found.</p>';
        return;
    }

    gallery.innerHTML = ghosts.map(dev => {
        const profileUrl = dev.has_profile ? `https://network.bitcoindatalabs.org/profile.html?uuid=${dev.uuid}` : '#';
        const avatarUrl = dev.github ? `https://github.com/${dev.github}.png` : `https://github.com/identicon/${dev.uuid}.png`;
        
        let commitsHtml = '';
        if (dev.sample_commits && dev.sample_commits.length > 0) {
            const earliest = dev.sample_commits.slice(0, 2).map(c => 
                `<a href="https://github.com/bitcoinknots/bitcoin/commit/${c.hash}" target="_blank" style="color: var(--primary); text-decoration: none; font-family: monospace; font-size: 0.8em; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.subject}">${c.hash.substring(0,7)}: ${c.subject}</a>`
            ).join('');
            commitsHtml = `<div style="margin-top: 10px; text-align: left; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;"><div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase;">Earliest Salvaged</div>${earliest}</div>`;
        }

        return `
            <div class="ghost-card" style="display: flex; flex-direction: column; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; width: 180px; box-sizing: border-box;">
                <a href="${profileUrl}" target="${dev.has_profile ? '_blank' : '_self'}" style="text-decoration: none; display: flex; justify-content: center; position: relative;">
                    <img src="${avatarUrl}" alt="${dev.name}" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 10px; border: 2px solid #636e72;">
                    <div style="position: absolute; bottom: 5px; right: calc(50% - 32px); font-size: 20px; text-shadow: 0 0 5px rgba(0,0,0,0.8);">👻</div>
                </a>
                <div class="ghost-name" style="margin-bottom: 8px;"><a href="${profileUrl}" target="${dev.has_profile ? '_blank' : '_self'}" style="color: var(--text-primary); text-decoration: none; font-weight: 600;">${dev.name}</a></div>
                <div class="ghost-stats" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
                    <strong>${dev.commits_core_all_time.toLocaleString()}</strong> Core commits<br>
                    <strong>${dev.commits_knots}</strong> in Knots
                </div>
                ${commitsHtml}
            </div>
        `;
    }).join('');
}

function populateTrackedCommits(overlapData) {
    const tbody = document.getElementById('tbody-tracked-commits');
    if (!tbody || !overlapData.both_devs) return;

    const rows = [];
    overlapData.both_devs.forEach(dev => {
        if (dev.provenance === 'ancient_ghost' && dev.sample_commits) {
            dev.sample_commits.slice(0, 3).forEach(c => {
                rows.push({
                    devName: dev.name,
                    subject: c.subject,
                    hash: c.hash,
                    date: c.author_date
                });
            });
        }
    });

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--text-secondary);">No tracked commits found.</td></tr>';
        return;
    }

    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    tbody.innerHTML = rows.map(r => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 15px; color: var(--text-primary); font-weight: 500;">${r.devName}</td>
            <td style="padding: 10px; color: var(--text-secondary);">
                <a href="https://github.com/bitcoinknots/bitcoin/commit/${r.hash}" target="_blank" style="color: var(--primary); text-decoration: none;">${r.subject}</a>
            </td>
            <td style="padding: 10px; text-align: center; color: var(--text-secondary);">${r.date}</td>
        </tr>
    `).join('');
}"""

if old_populate in js:
    js = js.replace(old_populate, new_populate)
    # inject populateTrackedCommits into the DOMContentLoaded listener
    js = js.replace("populateGhostGallery(data.overlap);\n        }", "populateGhostGallery(data.overlap);\n            populateTrackedCommits(data.overlap);\n        }")
    with open(path_js, 'w') as f:
        f.write(js)
    print("Updated script.js")
else:
    print("Failed to update script.js")

# Update index.html
path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

appendix_target = '<!-- GitHub Explainer Section -->'
appendix_insert = """<!-- Ghost Commits Tracker -->
                        <section class="card" style="margin-bottom: 0;">
                            <h3 style="margin: 0 0 15px 0;"><i class="fas fa-ghost" style="margin-right: 8px;"></i>Tracked Salvaged Commits</h3>
                            <div style="color: var(--text-secondary); font-size: 0.92rem; line-height: 1.7; max-width: 750px; margin-bottom: 15px;">
                                <p style="margin: 0;">
                                    This table tracks the earliest salvaged commits from Core developers who did not intentionally contribute to Knots. It helps trace exactly <em>why</em> unapproved or abandoned Core code was eventually merged into Knots.
                                </p>
                            </div>
                            <div style="max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid var(--border-color);">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <thead>
                                        <tr style="border-bottom: 2px solid var(--border-color); position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                                            <th style="text-align: left; padding: 12px 15px; color: var(--text-secondary);">Ghost Developer</th>
                                            <th style="text-align: left; padding: 12px 10px; color: var(--text-secondary);">Subject</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Originally Authored</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-tracked-commits">
                                        <tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        """

if appendix_target in html:
    html = html.replace(appendix_target, appendix_insert + appendix_target)
    
    # Also adjust ghost gallery styles
    html = html.replace('<div id="ghost-gallery" class="ghost-gallery">', '<div id="ghost-gallery" class="ghost-gallery" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">')
    
    with open(path_html, 'w') as f:
        f.write(html)
    print("Updated index.html")
else:
    print("Failed to update index.html")

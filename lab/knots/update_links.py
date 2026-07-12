# Update index.html
path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

target_html = """                                        <tr style="border-bottom: 2px solid var(--border-color); position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                                            <th style="text-align: left; padding: 12px 15px; color: var(--text-secondary);">Ghost Developer</th>
                                            <th style="text-align: left; padding: 12px 10px; color: var(--text-secondary);">Subject</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Originally Authored</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-tracked-commits">
                                        <tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</td></tr>"""

repl_html = """                                        <tr style="border-bottom: 2px solid var(--border-color); position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                                            <th style="text-align: left; padding: 12px 15px; color: var(--text-secondary);">Ghost Developer</th>
                                            <th style="text-align: left; padding: 12px 10px; color: var(--text-secondary);">Subject</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Originally Authored</th>
                                            <th style="text-align: center; padding: 12px 15px; color: var(--text-secondary);">View In</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-tracked-commits">
                                        <tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</td></tr>"""

if target_html in html:
    html = html.replace(target_html, repl_html)
    with open(path_html, 'w') as f:
        f.write(html)
    print("Updated index.html headers")
else:
    print("Could not find index.html target")

# Update script.js
path_js = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path_js, 'r') as f:
    js = f.read()

target_js = """    if (rows.length === 0) {
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
    `).join('');"""

repl_js = """    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-secondary);">No tracked commits found.</td></tr>';
        return;
    }

    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    tbody.innerHTML = rows.map(r => {
        const coreUrl = `https://github.com/bitcoin/bitcoin/pulls?q=is:pr+"${encodeURIComponent(r.subject.replace(/"/g, ''))}"`;
        const knotsUrl = `https://github.com/bitcoinknots/bitcoin/commit/${r.hash}`;
        return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 15px; color: var(--text-primary); font-weight: 500; white-space: nowrap;">${r.devName}</td>
            <td style="padding: 10px; color: var(--text-secondary); max-width: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.subject}">
                ${r.subject}
            </td>
            <td style="padding: 10px; text-align: center; color: var(--text-secondary); white-space: nowrap;">${r.date}</td>
            <td style="padding: 10px 15px; text-align: center; white-space: nowrap;">
                <a href="${coreUrl}" target="_blank" style="color: #f39c12; margin-right: 15px; text-decoration: none; font-weight: 600;" title="Search Core PRs">Core 🔍</a>
                <a href="${knotsUrl}" target="_blank" style="color: #2ed8a3; text-decoration: none; font-weight: 600;" title="View Knots Commit">Knots <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i></a>
            </td>
        </tr>
    `}).join('');"""

if target_js in js:
    js = js.replace(target_js, repl_js)
    with open(path_js, 'w') as f:
        f.write(js)
    print("Updated script.js table rows")
else:
    print("Could not find script.js target")

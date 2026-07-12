# Update index.html
path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

target_html = """                                        <tr style="border-bottom: 2px solid var(--border-color); position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                                            <th style="text-align: left; padding: 12px 15px; color: var(--text-secondary);">Ghost Developer</th>
                                            <th style="text-align: left; padding: 12px 10px; color: var(--text-secondary);">Subject</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Originally Authored</th>
                                            <th style="text-align: center; padding: 12px 15px; color: var(--text-secondary);">View In</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-tracked-commits">
                                        <tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</td></tr>"""

repl_html = """                                        <tr style="border-bottom: 2px solid var(--border-color); position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                                            <th style="text-align: left; padding: 12px 15px; color: var(--text-secondary);">Ghost Developer</th>
                                            <th style="text-align: left; padding: 12px 10px; color: var(--text-secondary);">Subject</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Category</th>
                                            <th style="text-align: center; padding: 12px 10px; color: var(--text-secondary);">Originally Authored</th>
                                            <th style="text-align: center; padding: 12px 15px; color: var(--text-secondary);">View In</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-tracked-commits">
                                        <tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading...</td></tr>"""

if target_html in html:
    html = html.replace(target_html, repl_html)
    with open(path_html, 'w') as f:
        f.write(html)
    print("Updated index.html categories column")
else:
    print("Could not find index.html target")

# Update script.js
path_js = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path_js, 'r') as f:
    js = f.read()

target_js_1 = """                    subject: c.subject,
                    hash: c.hash,
                    date: c.author_date
                });"""

repl_js_1 = """                    subject: c.subject,
                    hash: c.hash,
                    date: c.author_date,
                    category: c.category || 'other'
                });"""

js = js.replace(target_js_1, repl_js_1)

target_js_2 = """        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 15px; color: var(--text-primary); font-weight: 500; white-space: nowrap;">${r.devName}</td>
            <td style="padding: 10px; color: var(--text-secondary); max-width: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.subject}">
                ${r.subject}
            </td>
            <td style="padding: 10px; text-align: center; color: var(--text-secondary); white-space: nowrap;">${r.date}</td>
            <td style="padding: 10px 15px; text-align: center; white-space: nowrap;">"""

repl_js_2 = """        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 15px; color: var(--text-primary); font-weight: 500; white-space: nowrap;">${r.devName}</td>
            <td style="padding: 10px; color: var(--text-secondary); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.subject}">
                ${r.subject}
            </td>
            <td style="padding: 10px; text-align: center; color: var(--text-secondary); white-space: nowrap; text-transform: capitalize; font-size: 0.8em; opacity: 0.8;">${r.category.replace(/_/g, ' ')}</td>
            <td style="padding: 10px; text-align: center; color: var(--text-secondary); white-space: nowrap;">${r.date}</td>
            <td style="padding: 10px 15px; text-align: center; white-space: nowrap;">"""

js = js.replace(target_js_2, repl_js_2)

with open(path_js, 'w') as f:
    f.write(js)
print("Updated script.js table rows for categories")


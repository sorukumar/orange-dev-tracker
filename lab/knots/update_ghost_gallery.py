path = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path, 'r') as f:
    js = f.read()

target = """        let commitsHtml = '';
        if (dev.sample_commits && dev.sample_commits.length > 0) {
            const earliest = dev.sample_commits.slice(0, 2).map(c => 
                `<a href="https://github.com/bitcoinknots/bitcoin/commit/${c.hash}" target="_blank" style="color: var(--primary); text-decoration: none; font-family: monospace; font-size: 0.8em; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.subject}">${c.hash.substring(0,7)}: ${c.subject}</a>`
            ).join('');
            commitsHtml = `<div style="margin-top: 10px; text-align: left; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;"><div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase;">Earliest Salvaged</div>${earliest}</div>`;
        }"""

repl = """        let commitsHtml = '';
        if (dev.sample_commits && dev.sample_commits.length > 0) {
            const earliest = dev.sample_commits.slice(0, 2).map(c => `
                <div style="margin-bottom: 6px; line-height: 1.2;">
                    <a href="https://github.com/bitcoinknots/bitcoin/commit/${c.hash}" target="_blank" style="color: var(--primary); text-decoration: none; font-family: monospace; font-size: 0.75em; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.subject}">${c.subject}</a>
                    <div style="font-size: 0.65em; color: var(--text-secondary); margin-top: 2px; text-transform: capitalize;">
                        <i class="far fa-calendar-alt" style="margin-right: 3px; opacity: 0.7;"></i>${c.author_date} <span style="margin: 0 3px; opacity: 0.3;">|</span> <i class="fas fa-tag" style="margin-right: 3px; opacity: 0.7;"></i>${(c.category || 'other').replace(/_/g, ' ')}
                    </div>
                </div>
            `).join('');
            commitsHtml = `<div style="margin-top: 10px; text-align: left; background: rgba(0,0,0,0.2); padding: 8px 8px 2px 8px; border-radius: 4px;"><div style="font-size: 0.7em; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Earliest Salvaged</div>${earliest}</div>`;
        }"""

if target in js:
    js = js.replace(target, repl)
    with open(path, 'w') as f:
        f.write(js)
    print("Updated ghost gallery HTML")
else:
    print("Target not found")

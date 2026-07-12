import re

path = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path, 'r') as f:
    html = f.read()

old_block = """                    <!-- Right: Developer Overlap -->
                    <div class="card" style="flex: 2; min-width: 300px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <h3 style="margin: 0;">Developer Overlap (All-Time)</h3>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0 0 15px 0; line-height: 1.4;">
                            Is there a schism in talent? This chart shows developers who contributed exclusively to Core, exclusively to Knots, and those who contribute to both.
                        </p>
                        <div id="chart-overlap" style="flex: 1; height: 350px; width: 100%;"></div>
                    </div>"""

new_block = """                    <!-- Right: Developer Mindshare -->
                    <div class="card" style="flex: 1.5; min-width: 300px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <h3 style="margin: 0;">Active Mindshare (Last 12 Months)</h3>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0 0 25px 0; line-height: 1.4;">
                            Is the active engineering pool migrating to Knots? This compares the number of active developers who intentionally authored code in either project over the last year.
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center;">
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Bitcoin Core</div>
                                <div id="mindshare-core" style="font-size: 3.5rem; font-weight: 700; color: #fff; line-height: 1;">-</div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">Active Developers</div>
                            </div>
                            <div style="background: rgba(46, 216, 163, 0.05); border: 1px solid rgba(46, 216, 163, 0.2); border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-size: 0.9rem; color: #2ed8a3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Bitcoin Knots</div>
                                <div id="mindshare-knots" style="font-size: 3.5rem; font-weight: 700; color: #2ed8a3; line-height: 1;">-</div>
                                <div style="font-size: 0.85rem; color: rgba(46, 216, 163, 0.7); margin-top: 5px;">Active Developers (Excluding Ghosts)</div>
                            </div>
                        </div>
                    </div>"""

if old_block in html:
    html = html.replace(old_block, new_block)
    # Also fix hygiene text to mention 1-year pattern
    old_hyg = '<h3 style="margin: 0 0 5px 0;">Keeping Up: Knots vs Core Merge Patterns</h3>'
    new_hyg = '<h3 style="margin: 0 0 5px 0;">Keeping Up: Merge Patterns (Last 12 Months)</h3>'
    html = html.replace(old_hyg, new_hyg)
    
    with open(path, 'w') as f:
        f.write(html)
    print("Replaced successfully")
else:
    print("Block not found!")

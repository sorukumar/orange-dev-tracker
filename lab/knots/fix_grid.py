path_js = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path_js, 'r') as f:
    js = f.read()

# Change card width from 180px to 100%
target_js = """<div class="ghost-card" style="display: flex; flex-direction: column; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; width: 180px; box-sizing: border-box;">"""
repl_js = """<div class="ghost-card" style="display: flex; flex-direction: column; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; width: 100%; box-sizing: border-box;">"""

if target_js in js:
    js = js.replace(target_js, repl_js)
    with open(path_js, 'w') as f:
        f.write(js)
    print("Fixed script.js")
else:
    print("Could not find target in script.js")

path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

target_html = """<div id="ghost-gallery" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 20px;"></div>"""
repl_html = """<div id="ghost-gallery" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px;"></div>"""

if target_html in html:
    html = html.replace(target_html, repl_html)
    with open(path_html, 'w') as f:
        f.write(html)
    print("Fixed index.html")
else:
    print("Could not find target in index.html")


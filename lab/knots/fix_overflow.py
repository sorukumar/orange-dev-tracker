path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

target_html = """<div id="ghost-gallery" class="ghost-gallery" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; justify-content: center;">"""
repl_html = """<div id="ghost-gallery" class="ghost-gallery" style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; justify-content: center;">"""

if target_html in html:
    html = html.replace(target_html, repl_html)
    with open(path_html, 'w') as f:
        f.write(html)
    print("Fixed grid in index.html")
else:
    print("Could not find grid target in index.html")

path_js = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/script.js'
with open(path_js, 'r') as f:
    js = f.read()

target_js = """<div class="ghost-card" style="display: flex; flex-direction: column; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; width: 100%; box-sizing: border-box;">"""
repl_js = """<div class="ghost-card" style="display: flex; flex-direction: column; text-align: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; width: 100%; min-width: 0; box-sizing: border-box;">"""

if target_js in js:
    js = js.replace(target_js, repl_js)
    with open(path_js, 'w') as f:
        f.write(js)
    print("Fixed card overflow in script.js")
else:
    print("Could not find card target in script.js")


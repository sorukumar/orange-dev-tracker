path_html = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path_html, 'r') as f:
    html = f.read()

target_html = """<div id="ghost-gallery" class="ghost-gallery" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">"""
repl_html = """<div id="ghost-gallery" class="ghost-gallery" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; justify-content: center;">"""

if target_html in html:
    html = html.replace(target_html, repl_html)
    with open(path_html, 'w') as f:
        f.write(html)
    print("Fixed index.html")
else:
    print("Could not find target in index.html")

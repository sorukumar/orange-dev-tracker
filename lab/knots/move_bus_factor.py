import re

path = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path, 'r') as f:
    html = f.read()

# Find Bus Factor section
start_bus = html.find('<!-- Bus Factor Treemap -->')
end_bus = html.find('</section>', start_bus) + len('</section>')

bus_section = html[start_bus:end_bus]

# Remove it from the original location
new_html = html[:start_bus] + html[end_bus:]

# Clean up empty lines left behind (optional but good)
new_html = new_html.replace('\n\n\n\n', '\n\n')

# Find the appendix div
appendix_start = new_html.find('<div style="padding-top: 25px; display: flex; flex-direction: column; gap: 30px;">')
if appendix_start != -1:
    insert_pos = appendix_start + len('<div style="padding-top: 25px; display: flex; flex-direction: column; gap: 30px;">')
    
    # modify bus_section to have margin-bottom: 0 instead of 30px for appendix styling
    bus_section = bus_section.replace('margin-bottom: 30px;', 'margin-bottom: 0;')
    
    final_html = new_html[:insert_pos] + '\n                        ' + bus_section + new_html[insert_pos:]
    
    with open(path, 'w') as f:
        f.write(final_html)
    print("Moved successfully")
else:
    print("Could not find appendix")

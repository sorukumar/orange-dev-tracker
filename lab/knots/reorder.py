import re

path = '/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/lab/knots/index.html'
with open(path, 'r') as f:
    html = f.read()

# Define the exact start and end of the block we want to replace
start_marker = '<div class="container" style="padding-top: 0;">'
end_marker = '            </div>\n        </div>\n    </div>\n\n    <!-- Reusable Footer -->'

start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

pre_html = html[:start_idx + len(start_marker) + 1]
post_html = html[end_idx:]
block = html[start_idx + len(start_marker) + 1 : end_idx]

# Split the block into sections based on HTML comments
# We know the sections start with <!-- ... --> and end with </section>

def extract_section(name_marker):
    s = block.find(name_marker)
    if s == -1: return ""
    e = block.find('</section>', s)
    if e == -1: return ""
    return block[s:e+len('</section>')] + '\n\n'

sec_ghost = extract_section('<!-- Ghost Gallery:')
sec_bus = extract_section('<!-- Bus Factor Treemap')
sec_grave = extract_section('<!-- The Graveyard:')
sec_hygiene = extract_section('<!-- Row 1: Hygiene')
sec_divergence = extract_section('<!-- Row 2: Codebase')
sec_momentum = extract_section('<!-- Row 2.5: Commit')
sec_roster = extract_section('<!-- Row 3: Developer')
sec_github = extract_section('<!-- GitHub Explainer')
sec_conclusion = extract_section('<!-- Conclusion:')

new_block = (
    "                " + sec_ghost.strip() + "\n\n" +
    "                " + sec_grave.strip() + "\n\n" +
    "                " + sec_bus.strip() + "\n\n" +
    "                " + sec_hygiene.strip() + "\n\n" +
    "                " + sec_roster.strip() + "\n\n" +
    "                " + sec_conclusion.strip() + "\n\n" +
    "                <!-- APPENDIX -->\n" +
    "                <details style=\"margin-bottom: 30px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;\">\n" +
    "                    <summary style=\"cursor: pointer; color: var(--text-secondary); font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;\">\n" +
    "                        <i class=\"fas fa-microchip\"></i> Appendix: Additional Technical Details\n" +
    "                    </summary>\n" +
    "                    <div style=\"padding-top: 25px; display: flex; flex-direction: column; gap: 30px;\">\n" +
    "                        " + sec_divergence.strip().replace('margin-bottom: 30px;', 'margin-bottom: 0;') + "\n\n" +
    "                        " + sec_momentum.strip().replace('margin-bottom: 30px;', 'margin-bottom: 0;') + "\n\n" +
    "                        " + sec_github.strip().replace('margin-bottom: 30px;', 'margin-bottom: 0;') + "\n" +
    "                    </div>\n" +
    "                </details>\n"
)

with open(path, 'w') as f:
    f.write(pre_html + new_block + post_html)
print("Reordered successfully")

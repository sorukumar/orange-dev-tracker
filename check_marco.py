import json

with open("output/lab/knots_comparison.json") as f:
    data = json.load(f)

name = "MarcoFalke"
print(f"--- {name} ---")
dev = next((d for d in data["overlap"]["both_devs"] if name.lower() in d["name"].lower() or d["name"].lower() in name.lower()), None)
if dev:
    print(f"Found in both_devs: knots={dev['commits_knots']}, core_1yr={dev['commits_core_1yr']}, core_all={dev['commits_core_all_time']}, provenance={dev.get('provenance')}")
else:
    print("Not found in both_devs.")
    
graveyard_commits = [c for c in data["graveyard"]["commits"] if name.lower() in c["author_name"].lower()]
if graveyard_commits:
    print(f"Found {len(graveyard_commits)} salvaged commits in the sample:")
    for c in graveyard_commits[:5]:
        print(f"  {c['author_date']} -> {c['committer_date']} (Delta: {c['delta_days']}, core_pr={c.get('is_core_pr')}): {c['subject']}")
else:
    print("No salvaged commits found.")

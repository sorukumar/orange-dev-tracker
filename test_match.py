import os, json

print("Building PR index from 5000 files...")
d = "/Users/saurabhkumar/Desktop/Work/github/orange-dev-data/data/sources/bitcoin-github-metadata/pulls"
files = os.listdir(d)[:5000]
core_subjects = set()
for f in files:
    if not f.endswith(".json"): continue
    with open(os.path.join(d, f)) as jf:
        try:
            data = json.load(jf)
            title = data.get("pull", {}).get("title")
            if title: core_subjects.add(title.strip().lower())
            for ev in data.get("events", []):
                if ev.get("event") == "committed":
                    msg = ev.get("message", "").split("\n")[0].strip().lower()
                    if msg: core_subjects.add(msg)
        except: pass

print("Loading knots graveyard...")
with open("output/lab/knots_comparison.json") as f:
    data = json.load(f)
    
matches = 0
total = 0
for c in data.get("graveyard", {}).get("commits", []):
    if c["author_uuid"] != "can_luke_dashjr":
        total += 1
        subj = c["subject"].strip().lower()
        if subj in core_subjects:
            matches += 1

print(f"Matched {matches} out of {total} non-Luke Knots commits against 5000 Core PRs.")

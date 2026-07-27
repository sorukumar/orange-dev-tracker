import os, json
d = "/Users/saurabhkumar/Desktop/Work/github/orange-dev-data/data/sources/gui-github-metadata/pulls"
found = False
if os.path.exists(d):
    for f in os.listdir(d):
        if not f.endswith(".json"): continue
        with open(os.path.join(d, f)) as jf:
            try:
                data = json.load(jf)
                for ev in data.get("events", []):
                    if ev.get("event") == "committed" and "multiselect" in ev.get("message", "").lower():
                        print(f"Found in GUI PR {f}: {ev.get('message')}")
                        found = True
            except: pass
if not found: print("Not found in GUI metadata either.")

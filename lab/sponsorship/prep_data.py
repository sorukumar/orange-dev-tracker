import json
import os
import pandas as pd
from datetime import datetime

def prep_lab_data():
    base_path = "/Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker"
    
    # Paths
    sponsors_path = os.path.join(base_path, "data/cache/sponsors_lookup.json")
    evidence_path = os.path.join(base_path, "data/cache/sponsors_evidence.json")
    rich_path = os.path.join(base_path, "data/core/contributors_rich.json")
    output_path = os.path.join(base_path, "lab/sponsorship/data/sponsorship_stats.json")

    print("Loading data...")
    with open(sponsors_path, 'r') as f:
        sponsors_data = json.load(f)
    
    with open(evidence_path, 'r') as f:
        evidence_data = json.load(f)
        
    with open(rich_path, 'r') as f:
        rich_data = json.load(f)

    # 1. Create lookup for rich data (by name)
    rich_map = {c['name']: c for c in rich_data}
    
    # 2. Create lookup for evidence (by name)
    # We now allow multiple evidence entries per developer
    evidence_map = {}
    for ev in evidence_data.get('evidence', []):
        names = [n.strip() for n in ev['canonical_name'].split(',')]
        for n in names:
            if n not in evidence_map:
                evidence_map[n] = []
            evidence_map[n].append(ev)
    
    # 3. Process Sponsors
    sponsor_index = {s['id']: s for s in sponsors_data.get('sponsors', [])}
    # Add a virtual sponsor for 'multiple' or 'affiliated' if needed, but usually 'other' is fine
    processed_sponsors = {}
    
    for s_id, s_info in sponsor_index.items():
        processed_sponsors[s_id] = {
            "id": s_id,
            "name": s_info['name'],
            "type": s_info.get('type', 'other'),
            "website": s_info.get('website', ''),
            "funded_devs": [],
            "tech_areas": {} 
        }

    # 4. Integrate Developers & Consolidate Identities
    # We use canonical_name as the primary key to merge data
    consolidated_devs = {}
    
    for dev in sponsors_data.get('sponsored_developers', []):
        name = dev['canonical_name']
        s_id = dev['sponsor_id']
        past_ids = dev.get('past_sponsor_ids', [])
        
        # Get metrics from rich data (Already canonicalized in the main pipeline)
        contributor_data = rich_map.get(name, {})
        if not contributor_data:
            # Fallback: check if we can find them by github login
            login = dev.get('github')
            if login:
                for c in rich_data:
                    if c.get('login') == login:
                        contributor_data = c
                        name = c['name'] # Sync to canonical name
                        break
        
        if name not in consolidated_devs:
            # Get evidence
            ev_list = evidence_map.get(name, [])
            primary_ev = ev_list[0] if ev_list else {}
            
            consolidated_devs[name] = {
                "name": name,
                "github": dev.get('github', contributor_data.get('login', '')),
                "status": dev.get('status', 'active'),
                "is_maintainer": contributor_data.get('is_maintainer', False),
                "cohort_year": contributor_data.get('cohort_year', None),
                "total_commits": contributor_data.get('total_commits', 0),
                "focus_areas": contributor_data.get('focus_areas', {}),
                "sponsor_id": s_id,
                "current_sponsor": sponsor_index.get(s_id, {}).get('name', s_id),
                "past_sponsors": [sponsor_index.get(p_id, {}).get('name', p_id) for p_id in past_ids],
                "evidence_url": primary_ev.get('source_url', ''),
                "notes": dev.get('notes', '')
            }
        else:
            # Merging logic for duplicates or multi-sponsor entries
            old_entry = consolidated_devs[name]
            # If new entry has more data or is 'active' vs 'emeritus', update
            if dev.get('status') == 'active':
                old_entry['status'] = 'active'
                old_entry['sponsor_id'] = s_id
                old_entry['current_sponsor'] = sponsor_index.get(s_id, {}).get('name', s_id)

    # 4.5 Assign Consolidated Devs to Sponsors & Aggregate Footprint
    capital_composition = {"nonprofit": 0, "corporate": 0, "academic": 0, "other": 0}
    
    for name, dev_entry in consolidated_devs.items():
        s_id = dev_entry["sponsor_id"]
        
        if s_id in processed_sponsors:
            processed_sponsors[s_id]["funded_devs"].append(dev_entry)
            
            # Aggregate Capital Weight
            s_type = processed_sponsors[s_id]["type"]
            capital_composition[s_type] = capital_composition.get(s_type, 0) + 1
            
            # Aggregate Tech Areas for the CURRENT sponsor
            for area, percentage in dev_entry["focus_areas"].items():
                processed_sponsors[s_id]["tech_areas"][area] = processed_sponsors[s_id]["tech_areas"].get(area, 0) + (percentage * dev_entry["total_commits"])

    # 5. Finalize Tech Area Normalization, Metrics & Concentration Analysis
    # First, aggregate WHO funds WHAT across the whole project
    domain_funding = {} # area -> {sponsor_name: total_impact}
    
    for s_id in processed_sponsors:
        s = processed_sponsors[s_id]
        total_impact = sum(s["tech_areas"].values())
        if total_impact > 0:
            for area, pct in s["tech_areas"].items():
                s["tech_areas"][area] = round(pct / total_impact, 3)
                
                if area not in domain_funding:
                    domain_funding[area] = {}
                domain_funding[area][s['name']] = domain_funding[area].get(s['name'], 0) + (pct * len(s['funded_devs']))

    # Calculate Concentration Risk
    concentration_report = {}
    for area, sponsors_impact in domain_funding.items():
        total_area_weight = sum(sponsors_impact.values())
        if total_area_weight > 0:
            # Sort sponsors by weight in this domain
            sorted_sponsors = sorted(sponsors_impact.items(), key=lambda x: x[1], reverse=True)
            top_sponsor, top_weight = sorted_sponsors[0]
            share = top_weight / total_area_weight
            
            concentration_report[area] = {
                "top_sponsor": top_sponsor,
                "share": round(share, 3),
                "risk_level": "CRITICAL" if share > 0.8 else "HIGH" if share > 0.5 else "LOW",
                "sponsor_count": len(sponsors_impact)
            }

    for s_id in processed_sponsors:
        s = processed_sponsors[s_id]
        # Add summary metrics for bubble chart
        s["metrics"] = {
            "dev_count": len(s["funded_devs"]),
            "total_commits": sum(d["total_commits"] for d in s["funded_devs"]),
            "tech_breadth": len(s["tech_areas"]),
            "diversification_score": round(len(s["tech_areas"]) / 12, 2) # Normalized against 12 core areas
        }

    # 6. Generate Sankey Data (Capital -> Sponsor -> Developer -> Domain)
    sankey_nodes = []
    sankey_links = []
    node_set = set()

    def add_node(name):
        if name not in node_set:
            sankey_nodes.append({"name": name})
            node_set.add(name)

    # We use commit volume for the flow values
    for s_id, s in processed_sponsors.items():
        if not s['funded_devs']: continue
        
        capital_label = f"Type: {s['type'].capitalize()}"
        sponsor_label = s['name']
        
        add_node(capital_label)
        add_node(sponsor_label)
        
        # Link Capital to Sponsor
        total_sponsor_commits = sum(d['total_commits'] for d in s['funded_devs'])
        if total_sponsor_commits > 0:
            sankey_links.append({
                "source": capital_label,
                "target": sponsor_label,
                "value": total_sponsor_commits
            })
            
            for dev in s['funded_devs']:
                dev_label = dev['name']
                add_node(dev_label)
                
                # Link Sponsor to Developer
                if dev['total_commits'] > 0:
                    sankey_links.append({
                        "source": sponsor_label,
                        "target": dev_label,
                        "value": dev['total_commits']
                    })
                    
                    # Link Developer to Domains
                    for domain, share in dev['focus_areas'].items():
                        domain_label = f"Domain: {domain}"
                        add_node(domain_label)
                        domain_val = round(share * dev['total_commits'], 2)
                        if domain_val > 0:
                            sankey_links.append({
                                "source": dev_label,
                                "target": domain_label,
                                "value": domain_val
                            })

    # Final Output structure
    output_data = {
        "sponsors": list(processed_sponsors.values()),
        "concentration_risk": concentration_report,
        "sankey": {
            "nodes": sankey_nodes,
            "links": sankey_links
        },
        "metadata": {
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
            "total_funded_devs": len(consolidated_devs),
            "capital_composition": capital_composition,
            "domain_count": len(concentration_report)
        }
    }

    # Save
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"Sponsorship lab data saved to {output_path}")

if __name__ == "__main__":
    prep_lab_data()

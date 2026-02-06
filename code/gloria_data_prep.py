import pandas as pd
import json
import os
from datetime import datetime

def prepare_gloria_data():
    print("Preparing Gloria Zhao profile data...")
    
    # Paths
    COMMITS_FILE = "data/commits.parquet"
    ALIASES_FILE = "data/aliases_lookup.json"
    OUTPUT_FILE = "data/gloria_stats.json"
    
    if not os.path.exists(COMMITS_FILE):
        print(f"Error: {COMMITS_FILE} not found.")
        return

    # Load data
    df = pd.read_parquet(COMMITS_FILE)
    df['date_utc'] = pd.to_datetime(df['date_utc'])
    df['month_year'] = df['date_utc'].dt.to_period('M').astype(str)
    
    gloria_aliases = ["Gloria Zhao", "glozow"]
    gloria_emails = ["gloriajzhao@gmail.com", "gzhao408@berkeley.edu"]
    
    # Filter for Gloria's activity
    # Authored: Where author is Gloria
    is_author = df['author_name'].isin(gloria_aliases) | df['author_email'].str.lower().isin(gloria_emails)
    # Merged: Where committer is Gloria AND it's a merge
    is_committer = df['committer_name'].isin(gloria_aliases) | df['committer_email'].str.lower().isin(gloria_emails)
    is_merge_action = is_committer & (df['is_merge'] == True) & (df['category'] == 'Merge')
    
    authored_df = df[is_author & (df['category'] != 'Merge')].copy()
    merge_df = df[is_merge_action].copy()
    
    # --- FRACTIONAL ATTRIBUTION LOGIC ---
    # Calculate how many categories each commit touches (N)
    commit_cats = df.groupby('hash')['category'].nunique().reset_index().rename(columns={'category': 'n_cats'})
    authored_df = authored_df.merge(commit_cats, on='hash')
    authored_df['weight'] = 1.0 / authored_df['n_cats']
    
    # 1. Total Activity Counts (Matches dashboard unique counts)
    total_authored = authored_df['hash'].nunique()
    total_merged = merge_df['hash'].nunique()
    
    # 2. Maintenance Tenure
    maintenance_dates = merge_df['date_utc'].sort_values()
    if not maintenance_dates.empty:
        first_merge = maintenance_dates.iloc[0].strftime('%Y-%m-%d')
        last_merge = maintenance_dates.iloc[-1].strftime('%Y-%m-%d')
    else:
        first_merge = "N/A"
        last_merge = "N/A"
        
    # 3. Monthly Trends (Resilience Index uses raw unique counts)
    gloria_auth_monthly = authored_df.groupby('month_year')['hash'].nunique().to_dict()
    gloria_merge_monthly = merge_df.groupby('month_year')['hash'].nunique().to_dict()
    overall_all = df.groupby('month_year')['hash'].nunique().to_dict()
    
    all_months = sorted(list(set(overall_all.keys())))
    trend_data = []
    
    # 4. Category Trends (Uses Fractional Weight for sum consistency)
    tracked_cats = ["Tests (QA)", "Consensus (Domain Logic)", "Node & RPC (App/Interface)", "Mempool", "P2P Network (Infrastructure)"]
    cat_monthly_w = authored_df.groupby(['month_year', 'category'])['weight'].sum().unstack(fill_value=0)
    category_trend_data = []
    
    for m in all_months:
        trend_data.append({
            "month": m,
            "authored": int(gloria_auth_monthly.get(m, 0)),
            "merged": int(gloria_merge_monthly.get(m, 0)),
            "baseline": int(overall_all.get(m, 0))
        })
        
        cat_slice = {"month": m}
        for cat in tracked_cats:
            # We round to 2 decimals for fractional counts
            val = float(cat_monthly_w.loc[m, cat]) if m in cat_monthly_w.index and cat in cat_monthly_w.columns else 0
            cat_slice[cat] = round(val, 2)
        category_trend_data.append(cat_slice)
        
    # 5. Category Breakdown (Static total, uses Fractional Weight)
    category_w_sum = authored_df.groupby('category')['weight'].sum().sort_values(ascending=False).to_dict()
    category_data = [{"category": k, "count": round(float(v), 2)} for k, v in category_w_sum.items() if v > 0]
    
    # 6. Milestones
    milestones = [
        {"date": "2021-02-23", "label": "Package RPCs", "desc": "Initial functional tests for packages in RPCs"},
        {"date": "2021-07-15", "label": "Package Limits", "desc": "Mempool package ancestor/descendant limits"},
        {"date": "2022-07-12", "label": "Maintainer", "desc": "Promoted to Bitcoin Core Maintainer"},
        {"date": "2022-08-31", "label": "V3 Submission", "desc": "V3 transaction submission tests"},
        {"date": "2023-04-19", "label": "Orphan Handling", "desc": "Transaction orphan handling improvements"}
    ]
    
    # Final Stats Object
    stats = {
        "name": "Gloria Zhao",
        "title": "Bitcoin Core Maintainer & Contributor",
        "summary": {
            "total_authored": int(total_authored),
            "total_merged": int(total_merged),
            "first_merge": first_merge,
            "last_merge": last_merge
        },
        "trends": trend_data,
        "category_trends": category_trend_data,
        "categories": category_data,
        "milestones": milestones,
        "generated_at": datetime.now().isoformat()
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"Successfully generated {OUTPUT_FILE}")

if __name__ == "__main__":
    prepare_gloria_data()

import pandas as pd
import json
import os
import ast
import numpy as np
from datetime import datetime, timedelta
import clean


# --- Configuration ---
class Config:
    DATA_DIR = "data"
    OUTPUT_DIR = "data"
    COMMITS_FILE = f"{DATA_DIR}/commits.parquet"
    SOCIAL_FILE = f"{DATA_DIR}/social_history.parquet"
    METADATA_FILE = f"{DATA_DIR}/social_metadata.json"
    ENRICHED_FILE = f"{DATA_DIR}/contributors_enriched.parquet"

    # Map output filenames
    FILES = {
        "vital_signs": f"{OUTPUT_DIR}/dashboard_vital_signs.json",
        "snapshot_work": f"{OUTPUT_DIR}/stats_work_distribution.json",
        "snapshot_volume": f"{OUTPUT_DIR}/stats_code_volume.json",
        "snapshot_stack": f"{OUTPUT_DIR}/stats_tech_stack.json",
        "trend_category": f"{OUTPUT_DIR}/stats_category_evolution.json",
        "trend_growth": f"{OUTPUT_DIR}/stats_contributor_growth.json",
        "trend_maintainers": f"{OUTPUT_DIR}/stats_maintainers.json",
        "trend_social": f"{OUTPUT_DIR}/stats_social_proof.json",
        "trend_corporate": f"{OUTPUT_DIR}/stats_corporate.json", # New
        "meta_heatmap": f"{OUTPUT_DIR}/stats_heatmap.json",
        "meta_weekend": f"{OUTPUT_DIR}/stats_weekend.json",
        "meta_geography": f"{OUTPUT_DIR}/stats_geography.json", # New
        "contributors_rich": f"{OUTPUT_DIR}/contributors_rich.json" # For bubble chart
    }

# --- Data Factory ---
class DataFactory:
    @staticmethod
    def load():
        print("Loading data...")
        if not os.path.exists(Config.COMMITS_FILE):
            raise FileNotFoundError(f"Missing {Config.COMMITS_FILE}")
            
        commits = pd.read_parquet(Config.COMMITS_FILE)
        
        # Safe load social
        try:
            social = pd.read_parquet(Config.SOCIAL_FILE)
            if 'date' in social.columns:
                 social['date'] = pd.to_datetime(social['date'])
        except:
            social = pd.DataFrame(columns=["date", "type"])
            
        return commits, social

    @staticmethod
    def normalize_data(commits):
        return clean.Consolidator.normalize(commits)


# --- Metric Generators ---
class MetricGenerators:
    
    @staticmethod
    def generate_vital_signs(commits, social):
        """
        KPI Cards: Contributors, Maintainers, Codebase Size, Stars/Forks
        """
        print("Generating Vital Signs...")
        
        # 1. Unique Contributors (Canonical)
        unique_contributors = commits['canonical_id'].nunique()
        
        # 1.5 Total Commits (Simulated SHA count if available, else row count)
        total_commits = commits['hash'].nunique()

        # 2. Maintainers (Active in last year)
        # Use dataset max date, not system time
        max_date = commits['date_utc'].max()
        last_year = commits[commits['date_utc'] > (max_date - pd.Timedelta(days=365))]
        unique_maintainers_active = last_year[last_year['is_merge'] == True]['committer_email'].nunique()
        
        # 2.1 Total Maintainers (All Time)
        unique_maintainers_total = commits[commits['is_merge'] == True]['committer_email'].nunique()
        
        # 3. Current Codebase Size (True Static LOC)
        # We prefer the actual scan data over historical net churn
        meta_path = os.path.join(Config.DATA_DIR, "category_metadata.json")
        net_lines = 0
        
        if os.path.exists(meta_path):
             try:
                 with open(meta_path, "r") as f:
                     meta_scan = json.load(f)
                     # Sum all categories
                     for cat_data in meta_scan.values():
                         net_lines += cat_data.get("loc", 0)
             except: 
                 pass
        
        # Fallback to Churn if Metadata missing
        if net_lines == 0:
            total_adds = commits['additions'].sum()
            total_dels = commits['deletions'].sum()
            net_lines = int(total_adds - total_dels)
        
        
        # 4. Social Stats (Stars, Forks, Watchers)
        # Try metadata first (Realtime totals), else fallback to history
        stars = 0
        forks = 0
        watchers = 0
        
        # Load metadata
        if os.path.exists(Config.METADATA_FILE):
             try:
                 with open(Config.METADATA_FILE, "r") as f:
                     meta = json.load(f)
                     stars = int(meta.get("stars", 0))
                     forks = int(meta.get("forks", 0))
                     watchers = int(meta.get("watchers", 0))
             except: pass
        
        # Fallback if 0 (and history exists)
        if stars == 0 and not social.empty:
            social_counts = social['type'].value_counts()
            stars = int(social_counts.get('star', 0))
            forks = int(social_counts.get('fork', 0))
            
        data = {
            "unique_contributors": int(unique_contributors),
            "unique_maintainers": int(unique_maintainers_active),
            "total_maintainers": int(unique_maintainers_total),
            "total_commits": int(total_commits),
            "current_codebase_size": net_lines,
            "total_stars": stars,
            "total_forks": forks,
            "total_watchers": watchers,
            "generated_at": datetime.now().strftime("%Y-%m-%d")
        }
        
        with open(Config.FILES["vital_signs"], "w") as f:
            json.dump(data, f)

    @staticmethod
    def generate_snapshots(commits):
        """
        Snapshots: Work (Commits), Volume (Net Lines), Stack (Language)
        AND Rich Category Details
        """
        print("Generating Snapshots...")
        
        # Deduplication is now handled by ingest.py (clean (hash, category) pairs).
        # We assume 'commits' has one row per (hash, category) where applicable.
        
        # Load Static Metadata (Files, LOC)
        meta_path = os.path.join(Config.DATA_DIR, "category_metadata.json")
        static_meta = {}
        if os.path.exists(meta_path):
             with open(meta_path, "r") as f:
                 static_meta = json.load(f)
        
        # --- 1. Category Rich Stats ---
        # Commits Total
        # Filter to 2025 for consistency with Snapshot label
        commits_2025 = commits[commits['date_utc'].dt.year <= 2025]
        
        # Count unique hashes per category (A commit can count for multiple categories)
        # ingest now guarantees clean rows, so we rely on 'category' column
        cat_counts = commits_2025.groupby('category')['hash'].nunique()
        
        # Commits Last 5 Years
        max_date = commits['date_utc'].max()
        cutoff_date = max_date - pd.Timedelta(days=5*365)
        recent_commits = commits[commits['date_utc'] > cutoff_date]
        cat_recent = recent_commits.groupby('category')['hash'].nunique()
        
        # Last Commit Year
        cat_last_year = commits.groupby('category')['year'].max()
        
        # Aggregating
        rich_data = []
        all_cats = set(cat_counts.index) | set(static_meta.keys())
        
        for cat in all_cats:
            # Static
            s = static_meta.get(cat, {})
            files = s.get("files", 0)
            loc = s.get("loc", 0)
            langs = s.get("languages", {})
            
            # Dynamic
            total_c = int(cat_counts.get(cat, 0))
            recent_c = int(cat_recent.get(cat, 0))
            last_y = int(cat_last_year.get(cat, 0))
            
            # Language breakdown calculations
            rich_data.append({
                "name": cat,
                "files": files,
                "loc": loc,
                "commits_total": total_c,
                "commits_last_5y": recent_c,
                "last_year": last_y,
                "languages": langs # {ext: {files, loc}}
            })
            
        with open(os.path.join(Config.OUTPUT_DIR, "stats_category_details.json"), "w") as f:
            json.dump({"data": rich_data}, f)

        # --- Legacy Snapshot Support ---
        
        # 1. Work Distribution (Commits by Category)
        work_data = [{"name": d["name"], "value": d["commits_total"]} for d in rich_data if d["commits_total"] > 0]
        work_data.sort(key=lambda x: x["value"], reverse=True)
        with open(Config.FILES["snapshot_work"], "w") as f:
            json.dump({"data": work_data}, f)
            
        # 2. Code Volume (Net Lines by Category)
        vol_data = [{"name": d["name"], "value": d["loc"]} for d in rich_data if d["loc"] > 0]
        vol_data.sort(key=lambda x: x["value"], reverse=True)
        with open(Config.FILES["snapshot_volume"], "w") as f:
            json.dump({"data": vol_data}, f)
            
        # 3. Tech Stack (Global Languages)
        # Aggregate static language stats from all categories
        global_langs = {}
        for cat_stats in rich_data:
            for ext, metrics in cat_stats.get("languages", {}).items():
                if ext not in global_langs: global_langs[ext] = 0
                global_langs[ext] += metrics["loc"]
        
        # Map extension to Name
        def get_lang_name(ext):
            mapping = {
                ".cpp": "C++", ".h": "C++", ".hpp": "C++", ".cc": "C++", ".c": "C", 
                ".py": "Python", ".pyi": "Python",
                ".md": "Markdown", ".txt": "Text", ".rst": "Documentation",
                ".sh": "Shell", ".bash": "Shell",
                ".java": "Java", ".go": "Go", ".js": "JavaScript", ".ts": "TypeScript",
                ".yml": "YAML", ".yaml": "YAML", ".json": "JSON", ".xml": "XML",
                ".am": "Build System", ".ac": "Build System", "Makefile": "Build System", ".m4": "Build System",
                ".in": "Build System", ".cmake": "Build System", "CMakeLists.txt": "Build System",
                ".html": "Web", ".css": "Web"
            }
            return mapping.get(ext, "Other")

        final_stack = {}
        for ext, count in global_langs.items():
            name = get_lang_name(ext)
            final_stack[name] = final_stack.get(name, 0) + count
            
        stack_out = [{"name": k, "value": v} for k, v in final_stack.items() if v > 1000]
        stack_out.sort(key=lambda x: x['value'], reverse=True)
            
        with open(Config.FILES["snapshot_stack"], "w") as f:
            json.dump({"data": stack_out}, f)

    @staticmethod
    def generate_category_evolution(commits):
        print("Generating Category Evolution...")
        # Annual Aggregation (December only) for cleaner chart
        # Count unique hashes per category per year.
        
        commits['year'] = commits['date_utc'].dt.year
        
        # Group by Year + Category, count UNIQUE commits
        pivot = commits.groupby(['year', 'category'])['hash'].nunique().unstack(fill_value=0)
        
        # Filter 2026? User said "no need to show 2026"
        if 2026 in pivot.index:
            pivot = pivot.drop(2026)
        
        categories = pivot.columns.tolist()
        data = {
            "categories": categories,
            "xAxis": [str(y) for y in pivot.index.tolist()],
            "series": []
        }
        for cat in categories:
            data["series"].append({
                "name": cat,
                "type": "line",
                "stack": "Total",
                "areaStyle": {},
                "emphasis": {"focus": "series"},
                "data": pivot[cat].tolist()
            })
            
        with open(Config.FILES["trend_category"], "w") as f:
            json.dump(data, f)
            
    @staticmethod
    def generate_contributor_growth(commits):
        print("Generating Contributor Growth...")
        # First seen year (Canonical)
        author_start = commits.groupby('canonical_id')['year'].min().reset_index().rename(columns={'year': 'start_year'})
        commits_merged = commits.merge(author_start, on='canonical_id')
        
        years = sorted(commits['year'].unique())

        new_counts = []
        vet_counts = []
        
        # Calculate per year (distinct people)
        for y in years:
            active = commits_merged[commits_merged['year'] == y]
            if active.empty:
                new_counts.append(0)
                vet_counts.append(0)
                continue
                
            # New if start_year == y
            # Vet if start_year < y
            
            # Get unique authors active this year and their start years
            # Distinct pairs (canonical_id, start_year)
            unique_active = active[['canonical_id', 'start_year']].drop_duplicates()
            
            n_new = len(unique_active[unique_active['start_year'] == y])
            n_vet = len(unique_active[unique_active['start_year'] < y])
            
            new_counts.append(n_new)
            vet_counts.append(n_vet)
            
        data = {
            "xAxis": [str(y) for y in years],
            "series": [
                {"name": "New Contributors", "type": "bar", "stack": "total", "data": new_counts},
                {"name": "Veterans", "type": "bar", "stack": "total", "data": vet_counts}
            ]
        }
        with open(Config.FILES["trend_growth"], "w") as f:
            json.dump(data, f)
            
    @staticmethod
    def generate_contributor_landscape(commits):
        """
        Interactive Bubble Chart Data
        """
        print("Generating Contributor Landscape...")
        
        if os.path.exists(Config.ENRICHED_FILE):
             enriched_df = pd.read_parquet(Config.ENRICHED_FILE)
             # Map canonical_id -> Enriched Data
             enrich_map = enriched_df.set_index('canonical_id').to_dict(orient='index')
        else:
             enrich_map = {}
        
        # Group by Author
        # metrics: start_year, end_year, active_years_count, total_commits, total_lines_added, primary_cat
        
        # 1. Basic Stats
        # We need a custom aggregation
        
        # Flatten categories per author for "Focus Areas"
        # We can't do this easily with just the primary_category column unless we trust it.
        # "Focus Areas: % breakdown of commits by Category"
        # Yes, we can aggregate the primary_category column for each author.
        
        # Group 1: Time & Volume
        g1 = commits.groupby('canonical_id').agg({
            'year': ['min', 'max', 'nunique'], # Start, End, Tenure (Active Years)
            'additions': 'sum', # Impact
            'hash': 'nunique', # Total Commits (Unique SHAs)
            'canonical_name': 'first' # Name
        })
        g1.columns = ['start_year', 'end_year', 'tenure', 'lines_added', 'commits', 'name']
        
        # Group 2: Focus / Category
        # Most frequent category
        def get_top_cat(x):
            return x.value_counts().index[0] if not x.empty else "Unknown"
        
        # Logic for tooltips: % breakdown
        # Pivot: Author x Category -> Count
        cat_pivot = pd.crosstab(commits['canonical_id'], commits['category'])
        # Normalize to percentage
        cat_pct = cat_pivot.div(cat_pivot.sum(axis=1), axis=0).round(2)
        
        # Merge
        df = g1.join(cat_pct) # Adds category columns
        
        # --- ENRICHMENT METRICS ---
        total_project_commits = commits.shape[0]
        
        # Sort by commits for ranking
        df = df.sort_values('commits', ascending=False)
        
        # Calculate Ranks and Percentiles
        df['rank'] = df['commits'].rank(ascending=False, method='min')
        df['percentile'] = df['commits'].rank(pct=True) # 0 to 1, higher is better (more commits)
        
        def get_rank_label(row, total_authors):
            # Top 1% or Top 5 is "Legend"
            pct = row['percentile']
            comm = row['commits']
            
            if pct > 0.99: return "👑 The Core" # Top 1%
            if pct > 0.90: return "⭐ The Regulars" # Top 10%
            if pct > 0.75: return "⚒️ The Sustainers" # Top 25%
            if pct > 0.50: return "🔭 The Explorers" # Top 50%
            return "🔎 The Scouts" # Bottom 50%

        # Build JSON list
        output_list = []
        possible_cats = list(cat_pivot.columns)
        total_authors = len(df)
        
        for cid, row in df.iterrows():
             # Determine primary (max pct)
             # row[possible_cats] are the %s
             focus_map = row[possible_cats].to_dict()
             # Filter 0s
             focus_map = {k:v for k,v in focus_map.items() if v > 0}
             
             primary = max(focus_map, key=focus_map.get) if focus_map else "None"
             
             # Enrichment
             enrich_data = enrich_map.get(cid, {})
             login = enrich_data.get('login')
             company = enrich_data.get('company')
             location = enrich_data.get('location')
             
             # Metrics
             contribution_pct = (row['commits'] / total_project_commits) * 100
             rank_label = get_rank_label(row, total_authors)
             
             output_list.append({
                 "id": str(cid), 
                 "name": row['name'],
                 "login": login,
                 "company": company,
                 "location": location,
                 "cohort_year": int(row['start_year']),
                 "last_active_year": int(row['end_year']),
                 "total_commits": int(row['commits']),
                 "impact": int(row['lines_added']),
                 "primary_category": primary,
                 "span": f"{int(row['start_year'])}-{int(row['end_year'])}",
                 "tenure": int(row['tenure']),
                 "focus_areas": focus_map,
                 "contribution_pct": round(contribution_pct, 4),
                 "rank_label": rank_label,
                 "percentile_raw": round(row['percentile'] * 100, 1) # e.g. 99.5
             })
             
        with open(Config.FILES["contributors_rich"], "w") as f:
            json.dump(output_list, f)

    @staticmethod
    def generate_common_metrics(commits):
        # Maintainers, Heatmap, Weekend
        print("Generating Common Metrics...")
        
        # Maintainers
        merges = commits[commits['is_merge'] == True].copy()
        if merges.empty: merges = commits.copy()
        
        merges['date'] = merges['date_utc']
        merges = merges.set_index('date').sort_index()
        
        # Rolling 12m distinct maintainers
        # Resample first to reduce loop size?
        # No, rolling on dates is easiest manually
        dates = []
        counts = []
        periods = pd.date_range(start=commits['date_utc'].min(), end=commits['date_utc'].max(), freq='M')
        
        for p in periods:
            start_date = p - pd.DateOffset(months=12)
            mask = (merges.index > start_date) & (merges.index <= p)
            n = merges.loc[mask, 'committer_email'].nunique()
            dates.append(p.strftime("%Y-%m"))
            counts.append(int(n))
            
        with open(Config.FILES["trend_maintainers"], "w") as f:
            json.dump({"xAxis": dates, "series": [{"name": "Active Maintainers", "type": "line", "step": "start", "data": counts}]}, f)
            
        # Heatmap
        heatmap = []
        years = sorted(commits['year'].unique())
        for i, y in enumerate(years):
            subset = commits[commits['year'] == y]
            counts = subset.groupby('hour_utc').size()
            for h in range(24):
                val = int(counts.get(h, 0))
                if val > 0: heatmap.append([i, h, val])
        
        with open(Config.FILES["meta_heatmap"], "w") as f:
             json.dump({"years": [str(y) for y in years], "hours": [str(h) for h in range(24)], "data": heatmap}, f)
             
        # Weekend
        ratios = []
        for y in years:
            subset = commits[commits['year'] == y]
            tot = len(subset)
            if tot == 0: 
                ratios.append(0)
                continue
            wk = len(subset[subset['day_of_week'].isin([5,6])])
            ratios.append(round(wk/tot, 3))
            
        with open(Config.FILES["meta_weekend"], "w") as f:
            json.dump({"xAxis": [str(y) for y in years], "series": [{"name": "Weekend %", "type": "line", "data": ratios}]}, f)

    @staticmethod
    def generate_social(social):
        print("Generating Social...")
        if social.empty: return
        
        social = social.set_index('date').sort_index()
        stars = social[social['type'] == 'star'].resample('M').size().cumsum()
        forks = social[social['type'] == 'fork'].resample('M').size().cumsum()
        
        # Load Real Metadata Totals to project the curve
        total_stars = 0
        total_forks = 0
        if os.path.exists(Config.METADATA_FILE):
             try:
                 with open(Config.METADATA_FILE, "r") as f:
                     meta = json.load(f)
                     total_stars = int(meta.get("stars", 0))
                     total_forks = int(meta.get("forks", 0))
             except: pass
        
        # Extrapolate if history is truncated
        if not stars.empty:
            last_date = stars.index[-1]
            # Ensure timezone compatibility
            if last_date.tz is not None:
                now_date = pd.Timestamp.now(tz=last_date.tz)
            else:
                now_date = pd.Timestamp.now()
            
            # If our last history point is old (e.g. 2015) and we have a higher total, interpolate
            if last_date < (now_date - pd.Timedelta(days=365)) and total_stars > stars.iloc[-1]:
                print(f"Extrapolating Stars from {stars.index[-1].date()} ({stars.iloc[-1]}) to {now_date.date()} ({total_stars})")
                # Create a linear range
                # We add monthly points from last_date to now
                extra_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), end=now_date, freq='M')
                if not extra_dates.empty:
                    # Linear interpolation logic
                    start_val = stars.iloc[-1]
                    end_val = total_stars
                    steps = len(extra_dates)
                    step_size = (end_val - start_val) / steps
                    
                    new_vals = [int(start_val + (i+1)*step_size) for i in range(steps)]
                    extra_series = pd.Series(new_vals, index=extra_dates)
                    stars = pd.concat([stars, extra_series])

        if not forks.empty:
            last_date = forks.index[-1]
            if last_date.tz is not None:
                now_date = pd.Timestamp.now(tz=last_date.tz)
            else:
                now_date = pd.Timestamp.now()
                
            if last_date < (now_date - pd.Timedelta(days=365)) and total_forks > forks.iloc[-1]:
                 print(f"Extrapolating Forks from {forks.index[-1].date()} ({forks.iloc[-1]}) to {now_date.date()} ({total_forks})")
                 extra_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), end=now_date, freq='M')
                 if not extra_dates.empty:
                    start_val = forks.iloc[-1]
                    end_val = total_forks
                    steps = len(extra_dates)
                    step_size = (end_val - start_val) / steps
                    new_vals = [int(start_val + (i+1)*step_size) for i in range(steps)]
                    extra_series = pd.Series(new_vals, index=extra_dates)
                    forks = pd.concat([forks, extra_series])

        all_dates = sorted(list(set(stars.index.union(forks.index))))
        stars = stars.reindex(all_dates, method='ffill').fillna(0)
        forks = forks.reindex(all_dates, method='ffill').fillna(0)
        
        data = {
            "xAxis": [d.strftime("%Y-%m") for d in all_dates],
            "stars": stars.tolist(),
            "forks": forks.tolist()
        }
        with open(Config.FILES["trend_social"], "w") as f:
            json.dump(data, f)
            

    @staticmethod
    def generate_corporate_era(commits):
        print("Generating Corporate Era...")
        
        # Load Enriched Data for Company/Email info
        enrich_map = {}
        if os.path.exists(Config.ENRICHED_FILE):
             enriched_df = pd.read_parquet(Config.ENRICHED_FILE)
             enrich_map = enriched_df.set_index('canonical_id').to_dict(orient='index')
        
        # We need to map every commit to (Corporate, Personal)
        # 1. Get Canonical ID for every commit (already there)
        # 2. Check Enriched Company
        # 3. If None, Check Email Domain
        
        # Personal Domains List (common ones)
        personal_domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 
                            'protonmail.com', 'me.com', 'icloud.com', 'aol.com', 'users.noreply.github.com']
        
        results = []
        
        commits['year'] = commits['date_utc'].dt.year
        
        # Helper to classify a single author
        def classify_author(cid, email):
            # Check Enriched
            if cid in enrich_map:
                comp = enrich_map[cid].get('company')
                if comp and isinstance(comp, str) and len(comp) > 1:
                    return "Corporate"
            
            # Check Email
            domain = str(email).split('@')[-1].lower()
            if domain in personal_domains:
                return "Personal"
            
            # If domain is not personal, is it corporate?
            # e.g. 'mit.edu', 'chaincode.com', 'blockstream.io' -> Corporate
            if '.' in domain and domain != "unknown" and domain != "none":
                 return "Corporate" # Assume custom domain is pro/corp
            
            return "Personal" # Default to personal/hobbyist if unknown
            
        # Build a map of cid -> type to speed up
        # Get unique authors
        authors = commits[['canonical_id', 'author_email']].drop_duplicates('canonical_id')
        author_types = {}
        for _, row in authors.iterrows():
            author_types[row['canonical_id']] = classify_author(row['canonical_id'], row['author_email'])
            
        # Apply to commits
        commits['author_type'] = commits['canonical_id'].map(author_types)
        
        # Aggregate by Year
        stats = commits.groupby(['year', 'author_type']).size().unstack(fill_value=0)
        
        # Normalize to %
        stats_pct = stats.div(stats.sum(axis=1), axis=0).round(4) * 100
        
        # Output JSON
        years = stats.index.tolist()
        data = {
            "xAxis": [str(y) for y in years],
            "series": [
                {"name": "Personal/Hobbyist", "type": "line", "stack": "Total", "areaStyle": {}, "data": stats_pct.get('Personal', [0]*len(years)).tolist()},
                {"name": "Corporate/Sponsor", "type": "line", "stack": "Total", "areaStyle": {}, "data": stats_pct.get('Corporate', [0]*len(years)).tolist()}
            ]
        }
        
        with open(Config.FILES["trend_corporate"], "w") as f:
            json.dump(data, f)
            
    @staticmethod
    def generate_geography(commits):
        print("Generating Geography...")
        
        # Load Enriched Data
        if not os.path.exists(Config.ENRICHED_FILE):
            print("  Skipping Geography (No enriched data)")
            return

        enriched_df = pd.read_parquet(Config.ENRICHED_FILE)
        
        # We want simple counts of contributors per location
        # Raw location strings are messy ("Berlin", "Berlin, DE", "Germany").
        # MVP: Just take the top clean strings or use timezone as fallback?
        
        def clean_loc(loc):
            if not loc: return None
            loc = str(loc).lower()
            if "united states" in loc or "usa" in loc or "u.s." in loc or "san francisco" in loc or "new york" in loc: return "USA"
            if "germany" in loc or "berlin" in loc: return "Germany"
            if "united kingdom" in loc or "london" in loc or "uk" in loc: return "UK"
            if "canada" in loc: return "Canada"
            if "china" in loc: return "China"
            if "france" in loc or "paris" in loc: return "France"
            if "australia" in loc: return "Australia"
            if "netherlands" in loc or "amsterdam" in loc: return "Netherlands"
            if "switzerland" in loc or "zurich" in loc: return "Switzerland"
            if "japan" in loc or "tokyo" in loc: return "Japan"
            return None 
            
        locations = enriched_df['location'].apply(clean_loc).dropna()
        counts = locations.value_counts().head(15).reset_index()
        counts.columns = ['name', 'value']
        
        with open(Config.FILES["meta_geography"], "w") as f:
             json.dump({"data": counts.to_dict(orient="records")}, f)

    @staticmethod
    def generate_codebase_stats(commits):
        print("Generating Codebase Stats...")

        # --- 1. Snapshots (from Metadata) ---
        meta_path = os.path.join(Config.DATA_DIR, "category_metadata.json")
        if not os.path.exists(meta_path):
             print("Missing metadata for snapshots.")
             return

        with open(meta_path, "r") as f:
             meta = json.load(f)

        # Aggregations
        files_by_lang = {}
        files_by_cat = []
        
        # We need mapping for lang names again
        def get_lang_name(ext):
            mapping = {
                ".cpp": "C++", ".h": "C++", ".hpp": "C++", ".cc": "C++", ".c": "C", 
                ".py": "Python", ".pyi": "Python",
                ".md": "Markdown", ".txt": "Text", ".rst": "Documentation",
                ".sh": "Shell", ".bash": "Shell",
                ".java": "Java", ".go": "Go", ".js": "JavaScript", ".ts": "TypeScript",
                ".yml": "YAML", ".yaml": "YAML", ".json": "JSON", ".xml": "XML",
                ".am": "Build System", ".ac": "Build System", "Makefile": "Build System", ".m4": "Build System",
                ".in": "Build System", ".cmake": "Build System", "CMakeLists.txt": "Build System",
                ".html": "Web", ".css": "Web"
            }
            return mapping.get(ext, "Other")

        for cat, stats in meta.items():
            # Files by Cat
            files_by_cat.append({"name": cat, "value": stats.get("files", 0)})
            
            # Files by Lang
            for ext, lstats in stats.get("languages", {}).items():
                name = get_lang_name(ext)
                if name not in files_by_lang: files_by_lang[name] = 0
                files_by_lang[name] += lstats.get("files", 0)

        # Output Snapshot
        snapshot_data = {
            "files_by_cat": sorted(files_by_cat, key=lambda x: x['value'], reverse=True),
            "files_by_lang": sorted([{"name": k, "value": v} for k,v in files_by_lang.items() if v > 0], key=lambda x: x['value'], reverse=True)
        }
        
        with open(os.path.join(Config.OUTPUT_DIR, "stats_codebase_snapshots.json"), "w") as f:
            json.dump(snapshot_data, f)
            
        # --- 2. Evolution (Replay Commits) ---
        # We need to track LOC per language over time
        # commits have 'extensions_json' which is "{'.py': {'adds': 1, 'dels': 0}, ...}"
        
        # Sort by date
        df = commits.sort_values('date_utc')
        
        # State: { LangName: CurrentLOC }
        current_state = {}
        
        # We will sample end of every month
        df['month_period'] = df['date_utc'].dt.to_period('M')
        
        monthly_groups = df.groupby('month_period')
        
        history = [] # [{period: '2009-01', languages: {C++: 100, Python: 0...}}]
        
        all_langs = set()
        
        print(f"  Replaying {len(df)} commits for stack evolution...")
        
        for period, group in monthly_groups:
            # Apply all changes in this group
            for _, row in group.iterrows():
                try:
                    # Parse JSON string safety
                    # It relies on single quotes often from python dict string, 
                    # but ast.literal_eval is safer than json.loads for python string repr
                    ext_map = ast.literal_eval(row['extensions_json'])
                    
                    for ext, delta in ext_map.items():
                        lang = get_lang_name(ext)
                        net = delta['adds'] - delta['dels']
                        
                        current_state[lang] = current_state.get(lang, 0) + net
                        all_langs.add(lang)
                except:
                    continue
            
            # Snapshot state
            # Copy state? No, just store current values
            snapshot = {"period": str(period)}
            snapshot.update(current_state)
            history.append(snapshot)
            
        # Filter for End-of-Year (December Only) up to 2025
        # User explicitly requested to stop at 2025
        filtered_history = [
            h for h in history 
            if h['period'].endswith('-12') and int(h['period'].split('-')[0]) <= 2025
        ]
            
        history = filtered_history
            
        # Format for ECharts (Stacked Area)
        # xAxis: periods
        # series: one per lang
        
        # SCALING LOGIC: Normalize to match Static Scan Total (Shared Logic, could be refactored)
        meta_path = os.path.join(Config.DATA_DIR, "category_metadata.json")
        target_loc = 0
        if os.path.exists(meta_path):
             try:
                 with open(meta_path, "r") as f:
                     meta = json.load(f)
                     for c in meta.values(): target_loc += c.get("loc", 0)
             except: pass
        
        current_hist_total = 0
        if history:
            current_hist_total = sum(v for k,v in history[-1].items() if isinstance(v, (int, float)))
            
        scale_factor = 1.0
        if target_loc > 0 and current_hist_total > 0:
            scale_factor = target_loc / current_hist_total
            print(f"  Scaling Stack Evolution by {scale_factor:.6f} (Hist: {current_hist_total} -> Target: {target_loc})")
            
        periods = [h['period'] for h in history]
        series = []
        
        # Filter top languages to avoid noise
        # Sort by final volume
        final_vol = history[-1] if history else {}
        sorted_langs = sorted(list(all_langs), key=lambda l: final_vol.get(l, 0), reverse=True)
        top_langs = sorted_langs[:8] # Top 8
        other_langs = sorted_langs[8:]
        
        # Build Series
        for lang in top_langs:
            data_points = [max(0, h.get(lang, 0)) * scale_factor for h in history] # Clamp and Scale
            series.append({
                "name": lang,
                "type": "line",
                "stack": "Total",
                "areaStyle": {},
                "symbol": "none",
                "data": data_points
            })
            
        # Other
        if other_langs:
            other_data = []
            for h in history:
                val = sum(h.get(l, 0) for l in other_langs)
                other_data.append(max(0, val) * scale_factor)
            
            series.append({
                "name": "Other",
                "type": "line",
                "stack": "Total",
                "areaStyle": {},
                "symbol": "none",
                "color": "#444",
                "data": other_data
            })
            
        with open(os.path.join(Config.OUTPUT_DIR, "stats_stack_evolution.json"), "w") as f:
            json.dump({"xAxis": periods, "series": series}, f)

    @staticmethod
    def generate_category_history(commits):
        print("  Replaying commits for Category History...")
        df = commits.sort_values('date_utc')
        
        # We need to replay history to get "Lines of Code at Point in Time"
        # We use 'category' as the approximation for the whole commit
        
        # Group by Period (Month)
        # Drop timezone for period conversion to silence warning
        df['month_period'] = df['date_utc'].dt.tz_convert(None).dt.to_period('M')
        
        # Pre-group adds/dels by month/cat for speed
        df['net'] = df['additions'] - df['deletions']
        grouped = df.groupby(['month_period', 'category'])['net'].sum()
        
        min_date = df['date_utc'].min().replace(day=1)
        # Cap at end of 2025
        limit_date = pd.Timestamp("2025-12-31", tz='UTC')
        daterange = pd.period_range(min_date, limit_date, freq='M')
        
        history = []
        current_state = {} # cat -> loc
        all_cats = set()
        
        for period in daterange:
            # Update state with changes in this period
            if period in grouped.index.get_level_values(0):
                # Get changes for this month
                changes = grouped.loc[period]
                for cat, net_change in changes.items():
                    current_state[cat] = current_state.get(cat, 0) + net_change
                    all_cats.add(cat)
            
            # Filter: End of Year (December) Only
            if period.month == 12:
                snapshot = {"period": str(period)}
                snapshot.update(current_state)
                history.append(snapshot)

        # SCALING LOGIC: Normalize to match Static Scan Total
        meta_path = os.path.join(Config.DATA_DIR, "category_metadata.json")
        target_loc = 0
        if os.path.exists(meta_path):
             try:
                 with open(meta_path, "r") as f:
                     meta = json.load(f)
                     for c in meta.values(): target_loc += c.get("loc", 0)
             except: pass
        
        current_hist_total = 0
        if history:
            # Sum all numeric values in the last snapshot
            current_hist_total = sum(v for k,v in history[-1].items() if isinstance(v, (int, float)))
            
        scale_factor = 1.0
        if target_loc > 0 and current_hist_total > 0:
            scale_factor = target_loc / current_hist_total
            print(f"  Scaling Category History by {scale_factor:.6f} (Hist: {current_hist_total} -> Target: {target_loc})")

        # Format for ECharts
        periods = [h['period'] for h in history]
        series = []
        
        # Sort cats by final volume
        final_vol = history[-1] if history else {}
        sorted_cats = sorted(list(all_cats), key=lambda c: final_vol.get(c, 0), reverse=True)
        
        # Take All Categories (except Merge)
        for cat in sorted_cats:
            if cat == "Merge": continue
            
            # Apply Scale Factor here
            data_points = [max(0, h.get(cat, 0)) * scale_factor for h in history]
            
            series.append({
                "name": cat,
                "type": "line",
                "stack": "Total",
                "areaStyle": {},
                "symbol": "none",
                "data": data_points
            })
            
        with open(os.path.join(Config.OUTPUT_DIR, "stats_category_history.json"), "w") as f:
            json.dump({"xAxis": periods, "series": series}, f)

# --- Orchestrator ---
def main():
    os.makedirs(Config.OUTPUT_DIR, exist_ok=True)
    
    
    commits, social = DataFactory.load()
    
    # Normalize Identities
    commits = DataFactory.normalize_data(commits)
    
    # Run Generators
    MetricGenerators.generate_vital_signs(commits, social)
    MetricGenerators.generate_snapshots(commits)
    MetricGenerators.generate_contributor_landscape(commits)
    
    MetricGenerators.generate_category_evolution(commits)
    MetricGenerators.generate_contributor_growth(commits)
    MetricGenerators.generate_common_metrics(commits)
    MetricGenerators.generate_social(social)
    
    MetricGenerators.generate_corporate_era(commits)
    MetricGenerators.generate_geography(commits)
    MetricGenerators.generate_codebase_stats(commits)
    MetricGenerators.generate_category_history(commits) # New
    
    print("All stats generated successfully.")

if __name__ == "__main__":
    main()

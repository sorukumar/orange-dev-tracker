import pandas as pd
import os
import json
import time
import requests
import clean
from process import DataFactory, Config

class EnrichmentCache:
    CACHE_FILE = "data/enrichment_cache.json"
    
    @staticmethod
    def load():
        if os.path.exists(EnrichmentCache.CACHE_FILE):
            try:
                with open(EnrichmentCache.CACHE_FILE, "r") as f:
                    return json.load(f)
            except:
                return {}
        return {}
        
    @staticmethod
    def save(cache):
        with open(EnrichmentCache.CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)

class GitHubAPI:
    TOKEN = os.environ.get("GITHUB_TOKEN")
    HEADERS = {"Authorization": f"token {TOKEN}"} if TOKEN else {}
    
    @staticmethod
    def search_user(query, key_type="email"):
        if not GitHubAPI.TOKEN:
            if Config.DATA_DIR == "data": # Only warn once or if specifically relevant
                 pass 
            return None
            
        print(f"  API Call: Searching {key_type}='{query}'...")
        url = f"https://api.github.com/search/users?q={query} in:{key_type}&per_page=1"
        
        try:
            resp = requests.get(url, headers=GitHubAPI.HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                if data['total_count'] > 0:
                    item = data['items'][0]
                    # Get full details for company/location/followers
                    return GitHubAPI.get_user_details(item['login'])
            elif resp.status_code == 403:
                print("  API Rate Limit Hit. Skipping further calls.")
                return "RATE_LIMIT"
        except Exception as e:
            print(f"  API Error: {e}")
            
        time.sleep(1) # Polite delay
        return None

    @staticmethod
    def get_user_details(username):
        url = f"https://api.github.com/users/{username}"
        try:
            resp = requests.get(url, headers=GitHubAPI.HEADERS)
            if resp.status_code == 200:
                return resp.json()
        except:
            pass
        return None

class Enricher:
    LEGACY_FILE = "data/bitcoin_contributors_data.parquet"
    OUTPUT_FILE = "data/contributors_enriched.parquet"

    @staticmethod
    def load_legacy():
        if not os.path.exists(Enricher.LEGACY_FILE):
            print(f"Warning: Legacy file {Enricher.LEGACY_FILE} not found. Skipping enrichment.")
            return None
        return pd.read_parquet(Enricher.LEGACY_FILE)

    @staticmethod
    def enrich(commits):
        print("Starting enrichment...")
        legacy_df = Enricher.load_legacy()
        cache = EnrichmentCache.load()
        
        if legacy_df is None:
            return None

        # 1. Build Lookup Maps (Normalization is key)
        email_map = {}
        name_map = {}
        
        for idx, row in legacy_df.iterrows():
            if pd.notna(row.get('Email')):
                emails = [e.strip().lower() for e in str(row['Email']).split(',')]
                for e in emails:
                    if e: email_map[e] = row
            if pd.notna(row.get('Name')):
                names = [n.strip().lower() for n in str(row['Name']).split(',')]
                for n in names:
                    if n: name_map[n] = row
                    
        print(f"Legacy Index: {len(email_map)} emails, {len(name_map)} names.")

        # 2. Iterate Canonical Groups
        contributors = []
        grouped = commits.groupby('canonical_id')
        
        api_calls_made = 0
        MAX_API_CALLS = 50 # safety limit per run
        rate_limit_hit = False

        count_mapped = 0
        
        for cid, group in grouped:
            c_emails = set(group['author_email'].str.lower().dropna())
            c_names = set(group['author_name'].str.lower().dropna())
            canonical_name = group.iloc[0]['canonical_name']
            
            # --- STRATEGY 1: LEGACY DATA ---
            match_row = None
            for e in c_emails:
                if e in email_map:
                    match_row = email_map[e]
                    break
            if match_row is None:
                for n in c_names:
                    if n in name_map:
                        match_row = name_map[n]
                        break
                        
            # Base Data Object
            entry = {
                "canonical_id": cid,
                "name": canonical_name,
                "login": None,
                "location": None,
                "company": None,
                "followers": 0,
                "is_enriched": False
            }
            
            if match_row is not None:
                entry["login"] = match_row.get("Login")
                entry["location"] = match_row.get("Location")
                entry["company"] = match_row.get("Company")
                entry["followers"] = int(match_row.get("Followers", 0)) if pd.notna(match_row.get("Followers")) else 0
                entry["is_enriched"] = True
                
            # --- STRATEGY 2: MANUAL OVERRIDES ---
            MANUAL_OVERRIDES = {
                "MacrabFalke": {"login": "MarcoFalke", "name": "MarcoFalke"},
                "MarcoFalke": {"login": "MarcoFalke", "name": "MarcoFalke"},
                "Marco Falke": {"login": "MarcoFalke", "name": "MarcoFalke"}
            }
            if canonical_name in MANUAL_OVERRIDES:
                ov = MANUAL_OVERRIDES[canonical_name]
                entry["login"] = ov.get("login", entry["login"])
                entry["name"] = ov.get("name", entry["name"])
                entry["is_enriched"] = True

            # --- STRATEGY 3: API FALLBACK ---
            # Condition: Login is missing OR "Anonymous"
            needs_api = (entry["login"] is None or str(entry["login"]).lower() == "anonymous")
            
            if needs_api and not rate_limit_hit:
                # Check Cache First
                cached_data = None
                cache_key = None
                
                # Try finding a cache key match
                for e in c_emails:
                    if e in cache:
                        cached_data = cache[e]
                        cache_key = e
                        break
                
                if cached_data:
                    # Use Cache
                    entry["login"] = cached_data.get("login")
                    entry["location"] = cached_data.get("location")
                    entry["company"] = cached_data.get("company")
                    entry["followers"] = cached_data.get("followers", 0)
                    entry["is_enriched"] = True
                else:
                    # CALL API (If token exists)
                    if GitHubAPI.TOKEN and api_calls_made < MAX_API_CALLS:
                        print(f"Fetching missing data for {canonical_name}...")
                        result = None
                        
                        # Try Email
                        for e in c_emails:
                            if "users.noreply" in e: continue
                            result = GitHubAPI.search_user(e, "email")
                            if result == "RATE_LIMIT": 
                                rate_limit_hit = True
                                break
                            if result: break
                            
                        # Try Name (if no email match)
                        if not result and not rate_limit_hit:
                             result = GitHubAPI.search_user(canonical_name, "user") # 'user' param logic in search_user varies, using fullname as q
                             if result == "RATE_LIMIT":
                                 rate_limit_hit = True
                        
                        if result and result != "RATE_LIMIT":
                            # Save to Entry
                            entry["login"] = result.get("login")
                            entry["location"] = result.get("location")
                            entry["company"] = result.get("company")
                            entry["followers"] = result.get("followers", 0)
                            entry["is_enriched"] = True
                            
                            # Cache It (Store by first email to allow future lookup)
                            if c_emails:
                                first_email = list(c_emails)[0]
                                cache[first_email] = {
                                    "login": result.get("login"),
                                    "location": result.get("location"),
                                    "company": result.get("company"),
                                    "followers": result.get("followers", 0)
                                }
                                api_calls_made += 1
                    
            if entry["is_enriched"]:
                count_mapped += 1
                
            contributors.append(entry)
            
        print(f"Enriched {count_mapped} out of {len(contributors)} contributors.")
        if api_calls_made > 0:
            print(f"Made {api_calls_made} API calls. Updating cache.")
            EnrichmentCache.save(cache)
        
        # 3. Create DataFrame
        enriched_df = pd.DataFrame(contributors)
        enriched_df.to_parquet(Enricher.OUTPUT_FILE, index=False)
        print(f"Saved enriched data to {Enricher.OUTPUT_FILE}")
        
        return enriched_df

def main():
    commits, _ = DataFactory.load()
    commits = clean.Consolidator.normalize(commits)
    Enricher.enrich(commits)

if __name__ == "__main__":
    main()

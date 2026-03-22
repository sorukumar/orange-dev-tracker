import requests
import pandas as pd
import json
import os
from datetime import datetime
import time

# --- Configuration ---
DELVING_URL = "https://delvingbitcoin.org"
OUTPUT_PARQUET = "data/governance/social_delving.parquet"
ALIASES_PATH = "data/aliases_lookup.json"

def load_aliases():
    if not os.path.exists(ALIASES_PATH):
        return {}
    with open(ALIASES_PATH, 'r') as f:
        data = json.load(f)
    lookup = {}
    for entry in data.get("aliases", []):
        canonical = entry["canonical_name"]
        lookup[canonical.lower()] = canonical
        for alias in entry.get("aliases", []):
            lookup[alias.lower()] = canonical
        for email in entry.get("emails", []):
            lookup[email.lower()] = canonical
    return lookup

def map_author(name, username, lookup):
    # Try name first, then username
    if name and name.lower() in lookup:
        return lookup[name.lower()]
    if username and username.lower() in lookup:
        return lookup[username.lower()]
    return name or username

def fetch_latest_topics(limit=100):
    print(f"Fetching latest topics from {DELVING_URL}...")
    url = f"{DELVING_URL}/latest.json"
    records = []
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        topics = data.get("topic_list", {}).get("topics", [])
        users_list = data.get("users", [])
        user_map = {u["id"]: u for u in users_list}
        
        lookup = load_aliases()
        
        for t in topics:
            topic_id = t["id"]
            title = t["title"]
            created_at = t["created_at"]
            
            # Get posters
            posters = t.get("posters", [])
            primary_poster_id = posters[0]["user_id"] if posters else None
            user_data = user_map.get(primary_poster_id, {})
            
            author_name = user_data.get("name") or user_data.get("username")
            author_username = user_data.get("username")
            
            canonical_id = map_author(author_name, author_username, lookup)
            
            records.append({
                "source": "delving",
                "message_id": f"topic_{topic_id}",
                "date": pd.to_datetime(created_at),
                "author_name": author_name,
                "author_email": None,
                "canonical_id": canonical_id,
                "subject": title,
                "body_snippet": None, # Could fetch first post body if needed
                "thread_id": f"topic_{topic_id}",
                "reply_to": None,
                "link": f"{DELVING_URL}/t/{t['slug']}/{topic_id}"
            })
            
            # Note: For a "WOW" dashboard, we might want to fetch INDIVIDUAL posts 
            # within topics to track detailed discussion. But for now, let's start with topics.
            
    except Exception as e:
        print(f"Error fetching Delving topics: {e}")
        
    return records

def main():
    records = fetch_latest_topics()
    if records:
        df = pd.DataFrame(records)
        os.makedirs(os.path.dirname(OUTPUT_PARQUET), exist_ok=True)
        df.to_parquet(OUTPUT_PARQUET, index=False)
        print(f"Saved {len(df)} Delving topics to {OUTPUT_PARQUET}")
    else:
        print("No Delving records found.")

if __name__ == "__main__":
    main()

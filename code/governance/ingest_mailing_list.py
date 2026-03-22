import os
import subprocess
import pandas as pd
import email
from email.utils import parseaddr, parsedate_to_datetime
import re
import json
from datetime import datetime

# --- Configuration ---
MAILING_LIST_PATH = "code/governance/mailing_list_sample" # Using sample for initial dev
OUTPUT_PARQUET = "data/governance/social_mailing_list.parquet"
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
        for email_addr in entry.get("emails", []):
            lookup[email_addr.lower()] = canonical
    return lookup

def map_author(name, email_addr, lookup):
    if email_addr and email_addr.lower() in lookup:
        return lookup[email_addr.lower()]
    if name and name.lower() in lookup:
        return lookup[name.lower()]
    return name or email_addr

def parse_email_file(path):
    try:
        with open(path, 'rb') as f:
            msg = email.message_from_binary_file(f)
            
        subject = msg.get('Subject')
        from_hdr = msg.get('From')
        date_hdr = msg.get('Date')
        msg_id = msg.get('Message-ID')
        in_reply_to = msg.get('In-Reply-To')
        
        name, addr = parseaddr(from_hdr)
        
        try:
            dt = parsedate_to_datetime(date_hdr)
        except:
            dt = None
            
        # Extract a small snippet of the body
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='replace')
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='replace')
            
        snippet = body[:200].replace('\n', ' ').strip()
        
        return {
            "source": "mailing_list",
            "message_id": msg_id,
            "date": dt,
            "author_name": name,
            "author_email": addr,
            "subject": subject,
            "body_snippet": snippet,
            "thread_id": in_reply_to or msg_id, # Simplified threading
            "reply_to": in_reply_to
        }
    except Exception as e:
        # print(f"Error parsing {path}: {e}")
        return None

def main():
    print(f"Ingesting mailing list from {MAILING_LIST_PATH}...")
    lookup = load_aliases()
    records = []
    
    count = 0
    # Process files in 00-ff directories
    for root, dirs, files in os.walk(MAILING_LIST_PATH):
        if ".git" in root: continue
        
        for f in files:
            path = os.path.join(root, f)
            # Skip git files
            if f in ['config', 'description', 'HEAD'] or '/hooks/' in path:
                continue
                
            res = parse_email_file(path)
            if res:
                res["canonical_id"] = map_author(res["author_name"], res["author_email"], lookup)
                records.append(res)
                count += 1
                if count % 1000 == 0:
                    print(f"  Processed {count} emails...")
                    
    if records:
        df = pd.DataFrame(records)
        # Ensure dates are localized/timezone aware if needed
        os.makedirs(os.path.dirname(OUTPUT_PARQUET), exist_ok=True)
        df.to_parquet(OUTPUT_PARQUET, index=False)
        print(f"Saved {len(df)} emails to {OUTPUT_PARQUET}")
    else:
        print("No emails found.")

if __name__ == "__main__":
    main()

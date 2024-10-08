import subprocess
import pandas as pd
import re
from datetime import datetime, timezone, timedelta
import os
import sys
import json

# --- Configuration ---
REPO_PATH = "code/bitcoin"
OUTPUT_PATH = "data/commits.parquet"

# --- Categorization Logic ---
CATEGORY_RULES = {
    # Domain Logic (The "Truth")
    "Consensus (Domain Logic)": [
        r"src/consensus/", r"src/kernel/", r"src/script/", r"src/primitives/",
        r"src/chain", r"src/coins", r"src/pow", r"src/validation\.", r"src/policy/"
    ],

    # Application & Interface Layer (The "Software")
    "Node & RPC (App/Interface)": [
        r"src/node/", r"src/rpc/", r"src/index/", r"src/zmq/",
        r"src/init\.", r"src/bitcoind\.", r"src/bitcoin-cli\.", r"src/txmempool\."
    ],

    # Infrastructure Layer (Networking)
    "P2P Network (Infrastructure)": [r"src/net", r"src/protocol", r"src/addrman"],

    # Client Layer
    "Wallet (Client App)": [r"src/wallet/", r"src/interfaces/"],

    # Presentation Layer
    "GUI (Presentation Layer)": [r"src/qt/", r"src/forms/"],

    # Persistence Layer
    "Database (Persistence)": [r"src/leveldb/", r"src/crc32c/", r"src/dbwrapper\."],

    # Cryptographic Primitives
    "Cryptography (Primitives)": [r"src/crypto/", r"src/secp256k1/", r"src/minisketch/"],

    # Cross-Cutting Concerns & Utilities
    "Utilities (Shared Libs)": [
        r"src/util/", r"src/support/", r"src/common/",
        r"src/univalue/", r"src/compat/", r"src/ipc/"
    ],

    "Tests (QA)": [r"src/test/", r"test/", r"src/bench/"],

    "Build & CI (DevOps)": [
        r"Makefile", r"ci/", r"\.github/", r"build_msvc", r"configure\.ac",
        r"CMakeLists\.txt", r"depends/", r"share/"
    ],

    "Documentation": [r"doc/", r".*\.md$"]
}

def get_git_log(repo_path):
    """
    Extracts raw git log with specific formatting.
    Format: %H (hash) | %at (author_ts) | %an (author_name) | %ae (author_email) | %cn (committer_name) | %ce (committer_email) | %ct (commiter_ts) | %P (parents) | %s (subject)
    Followed by numstat.
    """

    cmd = [
        "git",
        "-C", repo_path,
        "log",
        "--all",
        "--format=COMMIT_Start^|^%H^|^%at^|^%an^|^%ae^|^%cn^|^%ce^|^%ct^|^%P^|^%ai^|^%s",
        # "--numstat", # Temporarily disable numstat to isolate the issue? No, keep it.
        "--numstat",
        "-m" 
    ]
    
    # Increase buffer size and ensure text mode
    print(f"Running command: {' '.join(cmd)}")
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors='replace', bufsize=10*1024*1024)
    
    # We yield stdout line by line, but if it finishes, we check stderr
    return process

def parse_log(process):
    stream = process.stdout
    commits = []
    seen_hashes = set()
    
    # Current Commit Buffer
    curr_meta = None
    curr_stats = []
    
    for line in stream:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("COMMIT_Start^|^"):
            # If previous commit exists, save it
            if curr_meta:
                # Deduplication check
                if curr_meta["hash"] not in seen_hashes:
                    process_commit(curr_meta, curr_stats, commits)
                    seen_hashes.add(curr_meta["hash"])
            
            # Start new commit
            parts = line.split("^|^")
            curr_meta = {
                "hash": parts[1],
                "author_ts": int(parts[2]),
                "author_name": parts[3],
                "author_email": parts[4],
                "committer_name": parts[5],
                "committer_email": parts[6],
                "committer_ts": int(parts[7]),
                "parents": parts[8],
                "timezone": parts[9],
                "subject": parts[10] if len(parts) > 10 else ""
            }
            curr_stats = []
        else:
            # Parse numstat line: "added  deleted  filepath"
            # Git numstat can return '-' for binary files
            stat_parts = line.split(maxsplit=2)
            if len(stat_parts) == 3:
                adds = stat_parts[0]
                dels = stat_parts[1]
                path = stat_parts[2]
                
                # Handle binary files ('-')
                if adds == '-': adds = 0
                if dels == '-': dels = 0
                
                curr_stats.append({
                    "adds": int(adds),
                    "dels": int(dels),
                    "path": path
                })
    
    # Process last commit
    if curr_meta and curr_meta["hash"] not in seen_hashes:
        process_commit(curr_meta, curr_stats, commits)
        
    # Check for errors
    stderr = process.stderr.read()
    if process.wait() != 0:
        print(f"Git command failed: {stderr}")
    elif stderr:
        # Git log writes to stderr sometimes even on success (e.g. warnings)
        print(f"Git log stderr (warning): {stderr[:200]}...")
        
    return commits

def categorize_file(path):
    for category, regexes in CATEGORY_RULES.items():
        for pattern in regexes:
            if re.search(pattern, path, re.IGNORECASE):
                return category
    return "Core Libs"

def process_commit(meta, stats, commits_list):
    # Base Stats (Total for the commit)
    total_adds = sum(x["adds"] for x in stats)
    total_dels = sum(x["dels"] for x in stats)
    files_count = len(stats)
    
    # Categorization Stats
    cat_deltas = {}
    
    # Extension Stats
    ext_deltas = {}

    for s in stats:
        # Category
        cat = categorize_file(s["path"])
        if cat not in cat_deltas:
            cat_deltas[cat] = {"adds": 0, "dels": 0}
        cat_deltas[cat]["adds"] += s["adds"]
        cat_deltas[cat]["dels"] += s["dels"]
        
        # Extension
        _, ext = os.path.splitext(s["path"])
        ext = ext.lower()
        if not ext:
            ext = "(no_ext)"
        
        if ext not in ext_deltas:
            ext_deltas[ext] = {"adds": 0, "dels": 0}
        ext_deltas[ext]["adds"] += s["adds"]
        ext_deltas[ext]["dels"] += s["dels"]

    # If no stats (Merge or empty), assign "Merge" category
    if not stats:
        # Logic: If it has parents > 1, it's a merge
         if len(meta["parents"].split()) > 1:
             cat_deltas["Merge"] = {"adds": 0, "dels": 0}
         else:
             # Weird empty commit? Assign Core Libs default or Ignore?
             # Let's assign Core Libs with 0 stats
             cat_deltas["Core Libs"] = {"adds": 0, "dels": 0}

    dt_utc = datetime.fromtimestamp(meta["author_ts"], timezone.utc)
    
    # Extract timezone from %ai string...
    tz_str = meta["timezone"] 
    tz_offset_minutes = 0
    try:
        if tz_str:
            offset_token = tz_str.split()[-1]
            if len(offset_token) == 5 and (offset_token.startswith('+') or offset_token.startswith('-')):
                sign = 1 if offset_token[0] == '+' else -1
                hours = int(offset_token[1:3])
                minutes = int(offset_token[3:5])
                tz_offset_minutes = sign * (hours * 60 + minutes)
    except:
        pass

    # Author Domain
    domain = meta["author_email"].split("@")[-1].lower() if "@" in meta["author_email"] else "unknown"

    # Explode by Category
    # If a commit touches multiple categories, we create multiple rows.
    # Each row shares the same hash, date, author info.
    # But 'category' differs, and 'additions/deletions' refer to THAT category's churn.
    # We ALSO keep 'total_additions' for the whole commit, for context? 
    # Or should 'additions' be the category-specific additions? 
    # Yes, for detailed analysis, additions should be specific.
    # But 'files_count'? Specific or total? Specific makes sense.
    
    # Actually, let's keep it simple: 
    # 'category' is the specific category.
    # 'additions' is the specific additions for that category.
    
    for category, metrics in cat_deltas.items():
        record = {
            "hash": meta["hash"],
            "date_utc": dt_utc,
            "year": dt_utc.year,
            "month": dt_utc.month,
            "day_of_week": dt_utc.weekday(), 
            "hour_utc": dt_utc.hour,
            "timezone_offset_minutes": tz_offset_minutes,
            
            "author_name": meta["author_name"],
            "author_email": meta["author_email"].lower(),
            "author_domain": domain,
            
            "committer_name": meta["committer_name"],
            "committer_email": meta["committer_email"].lower(),
            
            "is_merge": len(meta["parents"].split()) > 1,
            
            # Specific to this category-slice
            "additions": metrics["adds"],
            "deletions": metrics["dels"],
            
            # Total context (useful for weighting?)
            "commit_total_adds": total_adds,
            "commit_total_dels": total_dels,
            
            "category": category, # RENAMED from primary_category
            
            "extensions_json": str(ext_deltas) 
        }
        commits_list.append(record)

def main():
    if not os.path.exists(REPO_PATH):
        print(f"Error: Repo not found at {REPO_PATH}")
        return

    print("Reading git log...")
    # NOTE: Modified command to get timezone offset if I were to re-write get_git_log. 
    # For this script, I'm sticking to the defined function to ensure it runs, 
    # but I acknowledge the timezone limitation (will default to UTC).
    
    # Actual run
    process = get_git_log(REPO_PATH)
    commits = parse_log(process)
    
    print(f"Parsed {len(commits)} commits.")
    
    df = pd.DataFrame(commits)
    


    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_parquet(OUTPUT_PATH, index=False)
    print(f"Saved to {OUTPUT_PATH}")
    
    # --- New: Static Analysis ---
    scan_repository(REPO_PATH)

def scan_repository(repo_path):
    """
    Scans the current HEAD of the repo to count files, lines, and languages per category.
    Saves to data/category_metadata.json
    """
    print("Scanning repository structure...")
    
    stats = {} 
    # Structure: { Category: { files: 0, loc: 0, languages: { ext: { files: 0, loc: 0 } } } }
    
    total_files = 0
    total_loc = 0
    
    for root, _, files in os.walk(repo_path):
        if ".git" in root: continue
        
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path)
            
            # Categorize
            cat = categorize_file(rel_path)
            
            # Extension
            _, ext = os.path.splitext(file)
            ext = ext.lower()
            if not ext: ext = "(no_ext)"
            
            # Lines of Code (simple line count, ignore errors for binary)
            loc = 0
            try:
                # 'rb' allows us to count newlines without decoding issues
                with open(full_path, 'rb') as f:
                    for _ in f: loc += 1
            except:
                pass
                
            # Aggregate
            if cat not in stats:
                stats[cat] = {"files": 0, "loc": 0, "languages": {}}
            
            stats[cat]["files"] += 1
            stats[cat]["loc"] += loc
            
            if ext not in stats[cat]["languages"]:
                stats[cat]["languages"][ext] = {"files": 0, "loc": 0}
            
            stats[cat]["languages"][ext]["files"] += 1
            stats[cat]["languages"][ext]["loc"] += loc
            
            total_files += 1
            total_loc += 1
            
    print(f"Scanned {total_files} files, {total_loc} lines.")
    
    # Save Artifact
    meta_path = os.path.join(os.path.dirname(OUTPUT_PATH), "category_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"Saved Metadata to {meta_path}")

if __name__ == "__main__":
    main()


import os
import time
import requests
import subprocess
import json
from datetime import datetime

class RateLimitManager:
    @staticmethod
    def get_status():
        token = os.environ.get("GITHUB_TOKEN")
        if not token:
            return None, 0
        
        url = "https://api.github.com/rate_limit"
        headers = {"Authorization": f"token {token}"}
        try:
            resp = requests.get(url, headers=headers)
            if resp.status_code == 200:
                core = resp.json().get("resources", {}).get("core", {})
                remaining = core.get("remaining", 0)
                reset_time = core.get("reset", 0)
                return remaining, reset_time
        except:
            pass
        return None, 0

def run_rebuild():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚙️  Running rebuild cycle...")
    subprocess.run(["python", "code/rebuild.py"])

def main():
    print("🕵️  Bitcoin Dev Tracker Background Enricher Started")
    
    # Load env for rebuild.py to use (though we also load it here for logic)
    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value

    while True:
        remaining, reset_time = RateLimitManager.get_status()
        
        if remaining is None:
            print("⚠️  No GITHUB_TOKEN found or API error. Sleeping for 1 hour...")
            time.sleep(3600)
            continue
            
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 📊 API Status: {remaining} calls remaining.")
        
        if remaining > 100:
            # We have plenty of room, run a rebuild
            run_rebuild()
            # After a rebuild, wait a bit to avoid hammering
            print("😴 Cycle complete. Waiting 15 minutes...")
            time.sleep(900)
        else:
            # We are low, wait for reset
            now = time.time()
            wait_time = max(reset_time - now + 60, 60) # reset + 1 min buffer
            print(f"🛑 Low rate limit. Sleeping for {int(wait_time/60)} minutes until reset...")
            time.sleep(wait_time)

if __name__ == "__main__":
    main()

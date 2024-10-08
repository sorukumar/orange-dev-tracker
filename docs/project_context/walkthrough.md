# Bitcoin Repository Forensics: Walkthrough

We have successfully audited the existing work, re-architected the data pipeline, and built a premium dashboard to visualize 15 years of Bitcoin development history.

## Key Artifacts

### 1. The Dashboard
Open **[docs/index.html](file:///Users/saurabhkumar/Desktop/Work/github/orange-dev-tracker/docs/index.html)** in your browser.

It features:
- **Global Heartbeat:** A heatmap showing how development shifted timezones over 15 years.
- **Architecture Evolution:** Area chart of code activity by component (Consensus, Wallet, Net).
- **The Keepers:** A line chart tracking the number of active maintainers (committers) over time.

### 2. The Data Pipeline (`code/`)
We moved from fragile Notebooks to a robust ETL pipeline:

1.  **Ingest (`ingest.py`)**: 
    -   Parses `git log` directly (O(N) speed).
    -   Extracts **Timezone Offsets** from commit signatures.
    -   Categorizes files into logical components.
    -   Saves to `data/commits.parquet`.

2.  **Social (`social.py`)**:
    -   Fetches **Star** and **Fork** history from GitHub API.
    -   Generates a hybrid timeline (Annual historic, Monthly recent).
    -   Saves to `data/social_history.parquet`.

3.  **Process (`process.py`)**:
    -   Aggregates raw parquet data into optimized JSONs for the UI.
    -   Generates: `slide1_category.json`, `story_heatmap.json`, etc.

## Verification Results
- **Schema**: Verified `commits.parquet` contains `timezone_offset_minutes`, `author_domain`, and `committer_email`.
- **Performance**: Ingested 66k+ commits in <2 minutes.
- **Visualization**: `index.html` successfully loads generated JSONs.

## Next Steps
To automate this weekly:
1.  Commit the `code/` folder.
2.  Set up a GitHub Action to run `python code/ingest.py && python code/social.py && python code/process.py`.
3.  Deploy `docs/` to GitHub Pages.

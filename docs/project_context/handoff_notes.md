# Handoff Notes: Bitcoin Dashboard V1

## Current State
- **Dashboard:** V1 is live at `index.html`. Served via `python -m http.server`.
- **Data Pipeline:**
  - `code/ingest.py`: Parses `git log` -> `data/commits.parquet`.
  - `code/social.py`: Fetches GitHub Stars/Forks -> `data/social_history.parquet`.
  - `code/process.py`: Aggregates Parquet -> `data/*.json`.
- **Frontend:**
  - `index.html`: Main entry point (Root).
  - `js/app.js`: ECharts logic.
  - `style.css`: Styles.
  - `data/`: JSON data files used by the frontend.

## User Feedback & Next Steps
- **Status:** "At least we got something." (MVP is working).
- **Next Session Goal:**
  - Review current charts (User will provide specific feedback).
  - Implement **new charts** (User has ideas for more insights).
  - Refine aesthetics or data granularity based on review.

## Context Files
- `implementation_plan.md`: Detailed architecture and schema.
- `walkthrough.md`: Summary of V1 features and file structure.
- `task.md`: Checklist of completed items.

## Development Environment

**Python Environment:**
The project uses an Anaconda environment.
*   **Python Executable:** Use `python` (which points to `/opt/anaconda3/bin/python` or similar), NOT `python3`.
*   **Dependencies:** Libraries like `pandas`, `pyarrow`, `fastparquet` are installed in the Anaconda environment.

## Usage
Run scripts using:
```bash
python code/process.py
```
DO NOT use `python3` or `pip install` without checking the active environment.

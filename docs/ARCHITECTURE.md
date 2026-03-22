# Project Architecture: "The Factory & The Sandbox"

This document outlines the directory structure and development philosophy of the Orange Dev Tracker. To ensure stability during rapid iteration, the project follows a **"Core vs. Lab"** (Sandbox-to-Production) lifecycle.

## 🏗 Directory Structure

### 1. `code/` (The Factory)
This is where the logic lives. It is partitioned by stability:
*   **`code/core/`**: Production-ready data pipelines. Scripts here are expected to be stable and are used to rebuild the main dashboard.
*   **`code/governance/`**: Logic for high-complexity domain data (BIPs, Mailing Lists). This is "Infrastructure" that supports both core and lab features.
*   **`code/lib/`**: Shared Python utilities, constants, and logging handlers.

### 2. `data/` (The Warehouse)
All data artifacts are partitioned to prevent experimental data from polluting production:
*   **`data/core/`**: Final `.json` and `.parquet` files used by the root dashboard.
*   **`data/governance/`**: Intermediate and final governance artifacts.
*   **`data/lab/`**: Data generated specifically for experimental pages.
*   **`data/cache/`**: API caches, lookup files (aliases, sponsors), and persistent metadata.

### 3. `lab/` (The Sandbox)
This is the area for rapid UI and functional prototyping. Each sub-folder is a "Feature Bundle":
*   **`lab/gloria/`**: Experimental Maintainer Spotlight. Contains its own `index.html` and `prep.py`.
*   **`lab/bips/`**: Early-stage Governance Dashboard.

### 4. `analysis/` (The Scratchpad)
One-off research scripts, debug tools, and insight generators that are not part of the monthly production cron job.

### 5. Root Directory (The Showroom)
Only stable, deployment-ready HTML files live in the root (e.g., `index.html`, `dashboard.html`).

---

## 🛠 Development Workflow: "Graduation"

New features should follow this lifecycle to ensure the repository remains clean and the main dashboard stays functional:

1.  **Exploration**: Create a script in `analysis/` to test a hypothesis or extract a new dataset.
2.  **Sandbox (The Lab)**:
    *   Create a folder in `lab/feature_name/`.
    *   Develop the UI (`index.html`) and local data prep logic (`prep.py`) there.
    *   Write experimental data to `data/lab/`.
3.  **Refinement**: Iterate until the feature is stable and visually polished.
4.  **Graduation (Production)**:
    *   Move the HTML from `lab/.../index.html` to root (e.g., `feature.html`).
    *   Move logic from `lab/.../prep.py` to `code/core/`.
    *   Update data outputs to write to `data/core/`.
    *   Integrate the graduated script into the main `rebuild.py`.

---

## 💡 Guidelines for LLMs & Collaborators

*   **Respect the Prefix**: Frontend JS must use `DATA_PATH_PREFIX` (defined in `js/utils.js`) for all `fetch` calls to ensure they work at any directory depth.
*   **No Root Pollution**: Do not add new `.html` files to the root until they have been validated in the `lab/`.
*   **Data Isolation**: Never write experimental data directly to `data/core/`. Use `data/lab/` or specialized subdirectories.

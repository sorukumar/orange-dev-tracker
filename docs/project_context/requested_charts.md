# Dashboard Visualization Plan (V2)

This document groups charts by their target page and section in the new dashboard layout.

## Page 1: `index.html` (The Project Story)
**Goal:** Instant context, growth trends, and project health.

### 1.1 Project Vital Signs (Header)
*High-level "Stats at a Glance" cards + Snapshot composition.*
*   **KPI Cards (End of 2025/Now):**
    *   *Status:* **Implemented** `data/dashboard_vital_signs.json`
    1.  **Unique Contributors:** Total distinct authors.
    2.  **Unique Maintainers:** Total distinct maintainers.
    3.  **Total Commits:** Total commit count.
    4.  **Total Stars & Forks:** Latest count for stars and forks.
    5.  **Current Codebase Size:** Net Lines (Sum Adds - Sum Dels).
*   **Snapshot Charts (Current State):**
    1.  **Work Distribution:** Commits by Category (**Donut Chart**).
        *   *Status:* **Implemented** `data/stats_work_distribution.json`
    2.  **Code Volume:** Net Lines by Category (**Pie Chart**).
        *   *Status:* **Implemented** `data/stats_code_volume.json`
    3.  **Tech Stack:** Net Lines by Language (**Horizontal Bar Chart**).
        *   *Status:* **Implemented** `data/stats_tech_stack.json`

### 1.2 The Growth Story (Trends)
*How has the project evolved?*
*   **Social Proof:** "Is the world watching?" (Stars & Forks history).
    *   *Status:* **Implemented** `data/stats_social_proof.json`
*   **Contributor Army:** "Is the community growing?" (Newcomers vs Veterans).
    *   *Status:* **Implemented** `data/stats_contributor_growth.json`
*   **Architecture Evolution:** "What is being built?" (Consensus vs Wallet vs P2P).
    *   *Status:* **Implemented** `data/stats_category_evolution.json`

---

## Page 2: `contributors.html` (The Explorer)
**Goal:** Deep dive into the people behind the code.

### 2.1 The Contributor Landscape (Hero Section)
*   **Concept:** "Whales vs Minnows" - Detailed interactive explorer.
*   **Viz:** Interactive Scatter Plot (Bubble Chart).
*   **Axes:**
    *   **X (Cohort):** Year of First Commit.
    *   **Y (Volume):** Total Lifetime Commits.
    *   **Size (Impact):** Total Lines Added.
    *   **Color (Focus):** Last Active Year (Warm = Recent, Cold = Retired).
*   **Tooltip / Hover Data:**
    *   **Identity:** Name, Login, Badge.
    *   **Span:** Start Year - End Year (Tenure).
    *   **Stats:** Commits, Share %, Percentile.
    *   **Focus Areas:** Top categories.
*   **Data Requirement:** **Implemented** `data/contributors_rich.json`
*   **Logic:** `js/app.js` -> `loadContributorLandscape()`

---

## Page 3: `codebase.html` (Codebase DNA)
**Goal:** Deep dive into the code structure and evolution (Repository Forensics).

### 3.1 Codebase Vital Signs (KPIs)
*   **Total Volume:** Lines of Code (LOC).
    *   *Status:* **Implemented** `data/dashboard_vital_signs.json`
*   **File Count:** Total Source Files.
    *   *Status:* **Implemented** `data/stats_codebase_snapshots.json`
*   **Tech Stack:** Active Languages Count.
    *   *Status:* **Implemented** `data/stats_codebase_snapshots.json`

### 3.2 Category Analysis
*   **Functional Footprint:** File Count by Category (Bar Chart).
    *   *Status:* **Implemented** `data/stats_codebase_snapshots.json`
*   **Code Volume:** Lines of Code by Category (Pie Chart - Reused).
    *   *Status:* **Implemented** `data/stats_code_volume.json`

### 3.3 Language Analysis
*   **Polyglot Composition:** File Count by Language (Bar Chart).
    *   *Status:* **Implemented** `data/stats_codebase_snapshots.json`
*   **Tech Stack Dominance:** Lines of Code by Language (Pie Chart - Reused).
    *   *Status:* **Implemented** `data/stats_tech_stack.json`

### 3.4 Evolutionary Trends
*   **Longitudinal Tech Evolution:** Lines of Code by Language 2009-2025 (Stacked Area).
    *   *Status:* **Implemented** `data/stats_stack_evolution.json`
*   **Longitudinal Category Evolution:** Lines of Code by Category 2009-2025 (Stacked Area).
    *   *Status:* **Implemented** `data/stats_category_history.json`

---

## Page 4: `health.html` (Health & Culture)
**Goal:** Understanding the "human" side of the project.

### 4.1 Maintainers & Governance
*   **The Keepers:** "The Bus Factor" (Active Maintainers).
    *   *Status:* **Implemented** `data/stats_maintainers.json`

### 4.2 Global Activity
*   **Global Heartbeat:** "Does Bitcoin sleep?" (Timezone Heatmap).
    *   *Status:* **Implemented** `data/stats_heatmap.json`
*   **Geography:** "Where are they?" (Top Locations).
    *   *Status:* **Implemented** `data/stats_geography.json`
*   **Weekend Warriors:** "Hobby vs Job" (Weekend Activity Ratio).
    *   *Status:* **Implemented** `data/stats_weekend.json`

### 4.3 The Corporate Era
*   **Concept:** Shift from hobbyists to corporate sponsorship.
*   **Viz:** Stacked Area (100%).
*   **Metric:** Ratio of `gmail/hotmail` vs `blockstream/chaincode/mit.edu` domains.
*   **Status:** **Implemented** `data/stats_corporate.json`

---

## 5. Future Backlog
*Approved ideas not yet scheduled for V2.*

*(Empty - all planned charts are implemented)*

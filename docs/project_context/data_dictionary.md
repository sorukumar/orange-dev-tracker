# Data Dictionary

This document describes the data structure of the **"No Re-Run"** architecture. 
The parquet files located in `data/` contain sufficient granularity to answer most questions about contributor behavior, origins, and code evolution without re-ingesting the git log.

## 1. `data/commits.parquet`
**Source:** Processed from `git log`. 
**Granularity:** One row per commit. 
**Key Fact:** This is the atomic unit of the dashboard.

| Column | Type | Description | Example | "Chartable" Insights |
| :--- | :--- | :--- | :--- | :--- |
| `canonical_id` | string | **[NEW]** Unified ID grouping aliases. | `3a1f...` | Use this for all people-counting. |
| `canonical_name` | string | **[NEW]** Display name for the group. | `Matt Corallo` | Human-readable labels. |
| `hash` | string | Full SHA-1 hash. | `4d7d5f...` | Link to GitHub commit. |
| `date_utc` | datetime | UTC timestamp of the commit. | `2024-01-09 14:00:00` | Time series analysis. |
| `year` | int | Year (UTC). | `2024` | Annual aggregation. |
| `month` | int | Month (1-12). | `1` | Monthly seasonality. |
| `day_of_week` | int | 0=Monday, 6=Sunday. | `5` (Saturday) | **Weekend Warriors:** Plot ratio of 5/6 vs 0-4 to show "Hobby vs Job". |
| `hour_utc` | int | Hour (0-23). | `14` | **Heatmap:** Combined with timezone, shows global work hours. |
| `timezone_offset_minutes` | int | Offset from UTC in minutes. | `330` (+05:30) | **Global/Geo:** Infers region (India, Europe, US) without handling PII/IPs. |
| `author_name` | string | Name in git config. | `Satoshi Nakamoto` | Author grouping (requires alias cleaning). |
| `author_email` | string | Email in git config. | `satoshin@gmx.com` | Unique identifier for contributors. |
| `author_domain` | string | Domain part of email. | `gmx.com` | **Corporate Era:** Plot `gmail.com` vs `chaincode.com` to show professionalization. |
| `committer_email` | string | Email of the person who merged/applied the commit. | `wladimir@...` | **The Keepers:** Distinct count of this field = Active Maintainers. |
| `is_merge` | bool | True if commit has >1 parent. | `True` | Filter for "Merge Commits" to see true project history vs noise. |
| `additions` | int | Lines added. | `150` | Code churn analysis. |
| `deletions` | int | Lines removed. | `20` | Refactoring ratio (Dels / Adds). |
| `primary_category` | string | Inferred component (Regex). | `Consensus` | **Architecture:** Stacked area chart of work by component. |

## 2. `data/social_history.parquet`
**Source:** GitHub API (Stargazers & Forks).
**Granularity:** One row per event.

| Column | Type | Description | Example | "Chartable" Insights |
| :--- | :--- | :--- | :--- | :--- |
| `date` | datetime | Timestamp of the Star or Fork. | `2011-04-01...` | **Social Proof:** Cumulative sum over time shows viral growth. |
| `type` | string | "star" or "fork". | `star` | distinguishing interest (Stars) vs activity potential (Forks). |

## 3. `data/contributors_enriched.parquet` (Phase 3)
**Source:** Fusion of `canonical_id` with Legacy Data (2024 Snapshot).
**Granularity:** One row per `canonical_id`.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `canonical_id` | string | Foreign Key to `commits.parquet`. | `3a1f...` |
| `login` | string | GitHub Username. | `TheBlueMatt` |
| `location` | string | Self-reported location (raw). | `Berlin, DE` |
| `company` | string | Corporate affiliation. | `Chaincode Labs` |
| `followers` | int | GitHub followers count. | `542` |
| `is_enriched` | bool | True if match found in legacy. | `True` |

## 4. Derived Artifacts (JSON)
These files drive the Frontend (`app.js`).

| File | Content | Chart |
| :--- | :--- | :--- |
| `dashboard_vital_signs.json` | Single values (Contributors, KPIs). | KPI Cards |
| `stats_work_distribution.json` | Commit % by Day of Week. | Pie Chart |
| `stats_code_volume.json` | Additions vs Deletions. | Pie Chart |
| `stats_tech_stack.json` | Language usage stats. | Bar Chart |
| `stats_category_evolution.json` | Commits by Area over time. | Stacked Area (Architecture) |
| `stats_contributor_growth.json` | New vs Active count over time. | Bar Chart (Army) |
| `stats_social_proof.json` | Stars/Forks over time. | Line Chart |
| `stats_maintainers.json` | Active Maintainer count. | Line Chart (Keepers) |
| `stats_heatmap.json` | Commits by Hour/Year. | Heatmap (Heartbeat) |
| `stats_weekend.json` | Weekend Ratio over time. | Line Chart (Heartbeat) |
| `stats_corporate.json` | Corporate vs Personal domain %. | Stacked Area (Corporate Era) |
| `stats_geography.json` | Top contributor locations. | Bar Chart (Geography) |
| `contributors_rich.json` | Full list of contributors + stats. | Bubble Chart (Contributors) |

## 5. Transformations (in `process.py`)
These derived metrics are calculated on the fly from the parquet headers above:
*   **Active Maintainers:** Rolling count of unique `committer_email`.
*   **Newcomer vs Veteran:** Comparison of `author_email`'s first `year` vs current commit `year`.
*   **Cohort Retention:** (Backlog) % of authors from Year X who are still active in Year X+1.

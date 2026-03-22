# Data Dictionary (Feb 2026 Update)

This document describes the data structure of the **"No Re-Run"** architecture. 
The parquet files located in `data/` contain sufficient granularity to answer most questions about contributor behavior, origins, and code evolution without re-ingesting the git log.

## 1. `data/commits.parquet`
**Source:** Processed from `git log`. 
**Granularity:** One row per commit. 

| Column | Type | Description |
| :--- | :--- | :--- |
| `canonical_id` | string | Unified ID grouping aliases (e.g. sipa and Pieter Wuille share one ID). |
| `canonical_name` | string | Normalized display name for the individual. |
| `hash` | string | Full SHA-1 commit hash. |
| `is_merge` | bool | True if commit is a merge. Used for "Maintainer" filtering and "Authored Work" toggles. |
| `primary_category` | string | Functional area (Consensus, Wallet, etc.) using priority rules. |
| `risk_weight` | int | Multiplier (1-50) based on category criticality. |
| `standardized_work` | float | `(1 / N) * risk_weight` where N is the number of files touched. |

## 2. `data/maintainers_lookup.json`
**Source:** Manual lookup + `trusted-keys` whitelist.
**Granularity:** Key=canonical_id, Value=metadata.

| Field | Description |
| :--- | :--- |
| `is_maintainer` | Boolean flag for authorized project maintainers. |
| `era` | "Satoshi", "Gavin", "Wladimir", or "Modern" transition era. |

## 3. `data/identified_locations.json`
**Source:** GitHub API + manual verification.
**Granularity:** Key=canonical_id, Value=Location Data.

| Field | Description |
| :--- | :--- |
| `location` | Raw string from profile. |
| `country_code` | Normalized ISO alpha-2 code for mapping. |
| `verified` | Boolean indicating manual check. |

## 4. Derived Artifacts (JSON)
These files drive the UI components.

| File | Content |
| :--- | :--- |
| `stats_maintainer_independence.json` | Corporate vs Independent ratio of merited maintainers. |
| `stats_regional_evolution.json` | Growth of contributor cohorts by continent/geography. |
| `stats_category_evolution.json` | Split into `authored` (author only) and `total` (including merges). |
| `stats_social_proof.json` | Interpolated Stars/Forks history. |
| `dashboard_vital_signs.json` | Global KPIs (Contributors, LLOC, Maintainers). |

---

## 📂 Data Preview (Raw Samples)

Below are representative records from the core data files to illustrate the schema and typical values.

### `data/core/commits.parquet` (Sample - Authored Work)
```json
[
  {
    "hash": "cbcca8ad6ee9a8bfa5f6174a79899144fae85df6",
    "date_utc": "2026-02-09T13:46:17+00:00",
    "author_name": "Pieter Wuille",
    "is_merge": false,
    "category": "Consensus",
    "additions": 45,
    "deletions": 2,
    "extensions_json": "{'.cpp': {'adds': 45, 'dels': 2}}"
  },
  {
    "hash": "848e10037e9652c77d0f983a42ca2c0989ef993e",
    "date_utc": "2026-01-05T13:08:14+00:00",
    "author_name": "Hao Xu",
    "category": "Tests (QA)",
    "is_merge": false,
    "additions": 31,
    "deletions": 13
  }
]
```

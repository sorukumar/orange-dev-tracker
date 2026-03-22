# Governance & BIP Integration: Workflow Documentation

This document provides a comprehensive technical overview of the **Orange Dev Tracker's** Governance layer. It outlines the data sources, processing logic, and transformation pipeline used to generate the "Governance Sandbox" (`bips.html`).

---

## 1. System Architecture
The governance layer operates as a **parallel pipeline**. It is designed to be "No Re-Run" (outputting static artifacts) and "Non-Intrusive" (lives entirely in `code/governance/` and `data/governance/`).

The master controller is `code/governance/process_governance.py`, which executes the following stages in sequence.

---

## 2. Phase 1: Ingestion (Fetching the Raw Truth)

### 2.1 BIPs Repository
*   **Source:** [bitcoin/bips](https://github.com/bitcoin/bips) GitHub repository.
*   **Tool:** `code/governance/ingest_bips.py`
*   **Logic:**
    *   Performs a **full clone** (to include git log history).
    *   Parses **MediaWiki** (`.mediawiki`) and **Markdown** (`.md`) files.
    *   **Filters:** Only processes files starting with `bip-`.
    *   **Mapping:** Uses `data/aliases_lookup.json` to map raw author names/emails to their `canonical_id`.
    *   **Forensics:** Runs `git log --follow` for every file to extract `first_commit` (Birth), `last_commit` (Last Activity), and `revision_count` (Complexity proxy).
*   **Artifact:** `data/governance/bips.parquet` (Raw BIP metadata + Git history).

### 2.2 Mailing List History
*   **Source:** [gnusha.org/pi/bitcoindev](https://gnusha.org/pi/bitcoindev) (Public-Inbox).
*   **Tool:** `code/governance/ingest_mailing_list.py`
*   **Logic:**
    *   Parses raw email formats from the `public-inbox` directory structure.
    *   Extracts: `Message-ID`, `Date`, `From`, `Subject`, and `In-Reply-To`.
    *   Maps authors to `canonical_id`.
*   **Artifact:** `data/governance/social_mailing_list.parquet` (Flat list of emails).

### 2.3 Delving Bitcoin
*   **Source:** [delvingbitcoin.org](https://delvingbitcoin.org) (Discourse API).
*   **Tool:** `code/governance/ingest_delving.py`
*   **Logic:**
    *   Calls the `/latest.json` Discourse endpoint.
    *   Extracts latest research topics and maps researchers to IDs.
*   **Artifact:** `data/governance/social_delving.parquet`.

---

## 3. Phase 2: Processing & Merging

### 3.1 Social Unified View
*   **Tool:** `code/governance/process_social.py`
*   **Logic:**
    *   Merges Mailing List and Delving data into a single timeline.
    *   Standardizes the schema (Source, Date, Author, Subject, Link).
    *   **Filters:** Sorts by date descending.
*   **Artifact:** `data/governance/social.parquet` (Total "Human Activity" log).

---

## 4. Phase 3: Forensic Enrichment (Linking Layers)

### 4.1 Cross-Layer Linking & Scoring
*   **Tool:** `code/governance/enrich_governance.py`
*   **Logic:**
    *   **Thematic Taxonomy:** Categorizes records using regex patterns into themes: *Consensus, Privacy, Scaling, P2P, Wallet, Script, Mining*.
    *   **Social linking:** Scans all ~25,000 social subjects for references to each BIP (e.g., `BIP 141`, `BIP141`).
    *   **Code linking:** Scans `data/commit_messages.parquet` (Bitcoin Core history) for references to BIPs.
    *   **Maturity Score:** A calculated float `(0.0 - 1.0)`:
        *   `0.4 * normalized(revision_count)`
        *   `0.6 * normalized(social_mentions)`
*   **Artifact:** `data/governance/bips_enriched.parquet`.

### 4.2 Authority Mapping
*   **Tool:** `code/governance/map_expertise.py`
*   **Logic:**
    *   **Gatekeepers:** Ranks authors by volume of posts in technical forums.
    *   **Full-Stack Architects:** Performs an intersection of BIP authors and Code authors in `commits.parquet`.
*   **Artifact:** `data/governance/expertise.json`.

---

## 5. Phase 4: UI Generation (Dashboard Feed)

### 5.1 Artifact Export
*   **Tool:** `code/governance/generate_ui_artifacts.py`
*   **Logic:**
    *   Converts heavy Parquet datasets into lightweight, front-end friendly JSONs.
    *   Cleans up list data (e.g., formatting author lists as strings).
*   **Generated Artifacts:**
    *   `data/governance/stats_ui.json`: Global KPIs (Total BIPs, Social Proof count).
    *   `data/governance/themes_ui.json`: Pie chart data for R&D focus.
    *   `data/governance/funnel_ui.json`: Distribution of BIP statuses.
    *   `data/governance/bips_ui.json`: Sorted table data for the "Maturity Ledger".

---

## 6. Frontend: The Sandbox
*   **File:** `bips.html`
*   **Controller:** `js/governance.js`
*   **Visuals:** ECharts for themes/funnel and a dynamic HTML table for the ledger.
*   **Validation Access:** Currently lives as a standalone sandbox, accessible via the navigation sidebar if the user chooses.

---

## Summary of Code & Artifacts

| Task | Script | Primary Output |
| :--- | :--- | :--- |
| **Ingest BIPs** | `ingest_bips.py` | `bips.parquet` |
| **Ingest Emails** | `ingest_mailing_list.py` | `social_mailing_list.parquet` |
| **Ingest Discourse** | `ingest_delving.py` | `social_delving.parquet` |
| **Merge Social** | `process_social.py` | `social.parquet` |
| **Thematic Linking** | `enrich_governance.py` | `bips_enriched.parquet` |
| **Expertise/Rank** | `map_expertise.py` | `expertise.json` |
| **Export UI Data** | `generate_ui_artifacts.py` | `bips_ui.json`, `funnel_ui.json`, etc. |
| **Master Run** | `process_governance.py` | *(All of the above)* |

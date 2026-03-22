# BIP Integration Plan: Governance Meets Code (Feb 2026)

## 1. Overview
The goal is to expand the **Orange Dev Tracker** beyond code commits into the **Governance & Research Layer**. By integrating data from the [BIPs Repository](https://github.com/bitcoin/bips), the **Bitcoin-dev Mailing List**, and **Delving Bitcoin**, we will provide a "Full-Stack" view of the Bitcoin R&D lifecycle—from early ideation to merged code.

---

## 2. Data Strategy: The "Forensic" Pipeline
We will create a dedicated ingestion pipeline that treats governance repos and forums as structured data sources.

### 2.1 Multi-Layer Ingestion
*   **BIPs Repo:** Parse metadata headers and index (`bip-0002.mediawiki`). Track revision history via `git log` to measure BIP "Complexity."
*   **Mailing List:** Use `public-inbox` from `gnusha.org` to `git clone` the entire `bitcoin-dev` history for rapid, local regex parsing.
*   **Delving Bitcoin:** Use the Discourse API to ingest technical research threads, providing an "Early Warning System" for future BIPs.
*   **Artifacts:** `data/governance/bips.parquet`, `data/governance/social.parquet`.

---

## 3. High-Signal Metrics (The "Wow" Analysis)

### A. The "Consensus Funnel" & The Great Filter
*   **The Pipeline:** Visualization of BIPs moving from *Draft* -> *Proposed* -> *Final/Active*.
*   **The Graveyard:** Analysis of "Zombie BIPs" (stalled for 365+ days) and "Rejected" proposals, documenting the "Technical Friction" that prevented consensus.
*   **Aging analysis:** Heatmap of lead times per functional layer (e.g., Consensus vs. Wallet).

### B. Experience & Authority Mapping
*   **The Reviewer Pyramid:** Identifying "The Gatekeepers"—contributors who provide the most technical feedback and Concept ACKs on the mailing list.
*   **"Full-Stack Architects":** Identifying the elite 1% who shepherd a change from BIP authorship to a merged Bitcoin Core PR.
*   **Collaboration Network:** A node graph showing co-author clusters (e.g., Privacy researchers vs. Scaling engineers).

### C. Conceptual Evolution (Mega-Themes)
*   **The "Era of [Theme]" Chart:** A longitudinal view of Bitcoin R&D focus over 15 years (e.g., The shift from *Script* to *SegWit* to *Covenants*).
*   **Build-Time Taxonomy:** We will use LLM-assisted analysis at build-time to categorize 15 years of threads into high-level themes, saved as a static `themes.json`.

---

## 4. UI/UX: The "Governance Sandbox"
We will implement a new `bips.html` tab to surface these metrics without disrupting the main dashboard.

### 4.1 Visual Components
*   **The BIP Pulse Card:** 
    *   🟢 **Active**: Recent PR activity and positive social sentiment.
    *   🟡 **Controversial**: High discussion volume with high "NACK" ratio.
    *   🔴 **Stalled**: No commits or emails in 6+ months.
    *   🟣 **Research**: High activity on Delving Bitcoin, but no formal BIP yet.
*   **Inter-BIP Dependency DAG:** A graph showing how modern BIPs build on foundations like BIP 32 or BIP 341.
*   **Social Proof Sparklines:** "Shadow Activity" indicators showing mailing list spikes next to BIP entries.

---

## 5. Implementation Strategy
To maintain project stability, we will follow a "Parallel Pipeline" approach:
1.  **Isolation:** No changes will be made to the core `process.py`. All new logic resides in `code/governance/`.
2.  **Build-Time Intelligence:** Sophisticated analysis (sentiment, categorization) is performed during the build phase to ensure the dashboard remains a **fast, static site** on GitHub Pages.
3.  **Modular Artifacts:** Results are stored in `data/governance/` as lightweight JSONs.

---

## 6. Implementation Stages
1.  **Stage 1: BIP Ingestion** - Parsing the `bips` git repo for metadata, history, and dependency links.
2.  **Stage 2: Social Ingestion** - Cloning the mailing list and pulling Delving Bitcoin threads.
3.  **Stage 3: Forensic Enrichment** - LLM-assisted mapping of "Concept ↔ Email ↔ PR" and Theme taxonomy.
4.  **Stage 4: Sandbox UI** - Creating `bips.html` with its own specialized controllers and "Pulse" cards.
5.  **Stage 5: Final Review & Integration.**

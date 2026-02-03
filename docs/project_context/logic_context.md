# Logic Context & Data Assumptions

This document serves as the **Single Source of Truth** for the logic used to categorize commits and generate metrics in the Orange Dev Tracker dashboard.
Future iterations of the pipeline **MUST** respect these definitions to ensure data consistency.

## 1. Categorization Logic (The "Ontology")
Commits are categorized based on the file paths they touch. A commit is assigned a single **Primary Category** based on which category has the highest number of changed lines (`additions + deletions`).

### Regex Rules (Priority Order)
The Rules are defined in `code/ingest.py` and `code/process.py`. To ensure cross-cutting work like Testing and Documentation is correctly captured, we apply rules in a specific **priority order**.

| Category | Regex Pattern(s) | Explanation |
| :--- | :--- | :--- |
| **Tests (QA)** | `/test/`, `/fuzz/`, `*/test/*.cpp` | **High Priority.** Safety & validation logic. Includes subsystem tests (e.g., `src/wallet/test/`). |
| **Consensus** | `src/consensus/`, `src/script/`, `src/kernel/`, `src/validation`, `src/primitives/` | The core rules of Bitcoin. Changes here are existential. |
| **Cryptography** | `src/crypto/`, `src/secp256k1/` | Mathematical primitives. |
| **P2P Net** | `src/net/`, `src/protocol`, `src/addrman` | Networking code, peer discovery. |
| **Wallet** | `src/wallet/`, `src/interfaces` | Internal wallet logic and key management. |
| **Database** | `src/leveldb/`, `src/dbwrapper/` | Persistence and indexing. |
| **GUI** | `src/qt/`, `src/forms/` | Visual presentation (Bitcoin-Qt). |
| **Utilities** | `src/util/`, `src/support/`, `src/common/` | Shared helpers and low-level support. |
| **Documentation** | `doc/`, `.*\.md$` | Education, guides, and markdown. |
| **Build/CI** | `Makefile`, `ci/`, `\.github/`, `depends/` | Build system and DevOps. |

## 2. Contributor Unification (`code/clean.py`)
Because Git allows users to commit with different names/emails, we use a **Graph Clustering** approach to calculate a `canonical_id`.

### The Graph
1.  **Nodes**: Every unique `author_name` and `author_email` is a node.
2.  **Edges**:
    *   **Commit Edge**: If a commit has Name="Satoshi" and Email="satoshin@gmx.com", we draw an edge between them.
    *   **Manual Edge**: We fuse known aliases (e.g., "sipa" <-> "Pieter Wuille") via `data/aliases_lookup.json`.
3.  **Components**: Connected components represent a single human identity.
4.  **Canonical Name**: The name associated with the most commits in the group is chosen as the display label.

## 3. Maintainer Tracking
Maintainer authority is no longer inferred solely from Git `committer_email`. We now use a more robust "Trusted Circle" heuristic.

*   **Historical**: Manual lookup for early project phases (pre-2012).
*   **Modern**: Match `committer_email` on merge commits against the `trusted-keys` whitelist from the Bitcoin Core repository.
*   **Source**: `data/maintainers_lookup.json`.

## 4. Enrichment Workflow (`code/enrich.py`)
To add GEographic and Corporate metadata, we use a cached enrichment model with a "negative cache" to respect rate limits.

*   **Logic**:
    1.  Match identities against GitHub profiles.
    2.  Cache "Verified Empty" results (e.g., Location: Undisclosed) to prevent redundant API calls.
    3.  Periodic refresh (30-day stale policy).
*   **Source**: `data/identified_locations.json`, `data/sponsors_lookup.json`.

## 5. Metric Definitions

### Vital Signs
*   **Unique Contributors**: Unified human identities with ≥1 commit.
*   **Current Codebase Size**: Determined by a **static analysis scan** of the repository HEAD (LLOC - Logic Lines of Code).
*   **Historical Churn**: `Additions - Deletions` replayed over time, scaled to match the static scan.

### Risk-Weighted Impact Model
We apply weighting multipliers to categories to reflect technical criticality:
*   **50x**: Consensus, Cryptography, Core Libs.
*   **30x-40x**: P2P Network (40x), Database (30x).
*   **10x-20x**: Wallet (20x), Node/RPC (10x), GUI (10x).
*   **1x-5x**: Tests (5x), Build/CI (5x), Documentation (1x).

### Formula
`Impact Score = Σ (Commit × Weight × 1/N)` where N is the number of categories touched by a commit.

# Logic Context & Data Assumptions

This document serves as the **Single Source of Truth** for the logic used to categorize commits and generate metrics in the Orange Dev Tracker dashboard.
Future iterations of the pipeline **MUST** respect these definitions to ensure data consistency.

## 1. Categorization Logic (The "Ontology")
Commits are categorized based on the file paths they touch. A commit is assigned a single **Primary Category** based on which category has the highest number of changed lines (`additions + deletions`).

### Regex Rules (Priority Order)
The Rules are defined in `code/ingest.py`.

| Category | Regex Pattern(s) | Explanation |
| :--- | :--- | :--- |
| **Consensus** | `src/consensus/`, `src/script/`, `src/primitives/`, `src/chain`, `src/coins`, `src/pow` | The core rules of Bitcoin. Changes here are critical. |
| **MemPool/Policy** | `src/policy/` | Fee estimation, RBF, and transaction relay logic. |
| **Net/P2P** | `src/net`, `src/protocol`, `src/addrman` | Networking code, peer discovery. |
| **Wallet** | `src/wallet/` | The internal wallet logic. |
| **UI/Qt** | `src/qt/`, `src/forms/` | The GUI (Bitcoin-Qt). |
| **Crypto** | `src/crypto/`, `src/secp256k1/` | Cryptographic primitives and the secp256k1 library. |
| **Utils** | `src/util/`, `src/support/`, `src/common/` | Shared utilities, logging, low-level support. |
| **Tests** | `src/test/`, `test/` | Functional tests, unit tests, benchmarks. |
| **Docs** | `doc/`, `.*\.md$` | Documentation and markdown files. |
| **Build/CI** | `Makefile`, `ci/`, `\.github/`, `build_msvc`, `configure\.ac` | Build system and Continuous Integration configs. |
| **Core Libs** | *(Fallback)* | Anything not matching above (often root files or new directories). |

### Merge Handling
*   If a commit has >1 parent, it is flagged as `is_merge=True`.
*   Pure Merge Commits (empty diff) are categorized as **"Merge"**.
*   **Maintainer Identification**: Mergers are identified by the `committer_email` field.

## 2. Contributor Unification (`code/clean.py`)
Because Git allows users to commit with different names/emails, we use a **Graph Clustering** approach to calculate a `canonical_id`.

### The Graph
1.  **Nodes**: Every unique `author_name` and `author_email` is a node.
2.  **Edges**:
    *   **Commit Edge**: If a commit has Name="Satoshi" and Email="satoshin@gmx.com", we draw an edge between them.
    *   **Manual Edge**: We intentionally fuse known aliases (e.g., "Matt Corallo" <-> "TheBlueMatt") via a manual list based on deep research.
3.  **Components**: Connected components in this graph represent a single human identity.
4.  **Canonical Name**: The name associated with the most commits in the group is chosen as the display label.

## 3. Enrichment (`code/enrich.py`)
To add metadata (Location, GitHub Login, Company) without excessive API calls, we fuse our data with a snapshot.

*   **Logic**:
    1.  Flatten the legacy snapshot into `Email -> Profile` and `Name -> Profile` maps.
    2.  For each `canonical_id`, check all associated aliases against the map.
    3.  If a match is found, assign the Profile (Login, Location, Company) to the ID.
*   **Result**: ~75% coverage of historical contributors with rich metadata.

## 4. Metric Definitions

### Vital Signs
*   **Unique Contributors:** Count of unique `author_email` in the entire history.
*   **Unique Maintainers:** Count of unique `committer_email` in the entire history. (Maintainers are those who merge/commit others' work).
*   **Current Codebase Size:** `Sum(Additions) - Sum(Deletions)` across all time. This is "Net Lines".

### Contributor Landscape
*   **Cohort Year:** The year of a contributor's **first** commit.
*   **Tenure (Active Years):** The count of *distinct years* in which the contributor made at least one commit. (e.g., Active in 2012 and 2015 = 2 Years Tenure).
*   **Impact:** Total Lines Added (`additions`) by the author. Use `additions` rather than `net lines` for impact to avoid penalizing refactors/deletions.

### Health & Culture
*   **Corporate Era**:
    *   **Corporate**: Author has a non-empty `company` field OR uses a known corporate email domain (e.g. `@blockstream`).
    *   **Personal**: Author uses a generic domain (`@gmail`, `@yahoo`) and has no `company` field.
*   **Geography**:
    *   Derived from `location` string.
    *   Normalized using simple string matching (e.g. "Berlin" -> "Germany").

## 3. Tech Stack (Languages)
Language is inferred from file extensions logged in `commits.parquet`.
*   `.cpp`, `.h` -> **C++**
*   `.py` -> **Python**
*   `.c` -> **C**
*   `.md` -> **Markdown**
*   `.sh` -> **Shell**

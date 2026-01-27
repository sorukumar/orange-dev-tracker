# Orange Dev Tracker: Metric Logic & Data Architecture Review

> **Document Purpose:** Comprehensive review of all data flows, metric definitions, and architectural decisions.  
> **Target Audience:** Senior Engineers, Data Architects, LLM Context, Dashboard Users.  
> **Last Updated:** January 2026  
> **Reviewer Perspective:** Senior Engineer with Bitcoin Core development context.

---

## Executive Summary

The Orange Dev Tracker is a data visualization dashboard analyzing 15+ years of Bitcoin Core development history. This document provides:

1. **Metric Definitions** — Precise definitions for every metric displayed
2. **Logic Review** — Analysis of what's correct vs. problematic
3. **Data Flow Architecture** — How data moves from git log to visualization
4. **Recommendations** — Improvements for accuracy and storytelling

### Quick Assessment

| Area | Status | Notes |
|------|--------|-------|
| **Contributor Identity** | ⚠️ Good with caveats | Graph clustering is solid; manual aliases incomplete |
| **LOC Metrics** | ⚠️ Needs context | Net churn ≠ actual codebase; static scan is better |
| **Category Ontology** | ✅ Strong | Aligns with Bitcoin Core's actual architecture |
| **Maintainer Definition** | ⚠️ Overstated | Committer ≠ Maintainer in Bitcoin's governance |
| **Corporate Classification** | ⚠️ Heuristic | Domain-based detection has false positives/negatives |
| **Time Series Accuracy** | ✅ Strong | Proper deduplication, timezone handling |

---

## Part 1: Data Pipeline Architecture

### 1.1 Pipeline Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Log       │───▶│   ingest.py     │───▶│ commits.parquet │
│   (Raw)         │    │   (Parse/Cat)   │    │   (Atomic)      │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐             │
│  GitHub API     │───▶│   social.py     │─────────────┼──▶ social_history.parquet
│  (Stars/Forks)  │    │                 │             │
└─────────────────┘    └─────────────────┘             │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Legacy Data    │───▶│   enrich.py     │───▶│ contributors_   │
│  (2024 Snapshot)│    │   (Fusion)      │    │ enriched.parquet│
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                       ┌─────────────────┐             │
                       │   clean.py      │◀────────────┘
                       │ (Identity Graph)│
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │   process.py    │───▶ JSON Artifacts (20+ files)
                       │  (Aggregation)  │
                       └─────────────────┘
```

### 1.2 Key Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Parquet as intermediate** | Columnar, fast aggregation | Requires pandas ecosystem |
| **One row per (hash, category)** | Enables category-level analysis | Inflates row count vs. unique commits |
| **Graph-based identity resolution** | Handles aliases elegantly | Requires manual override list |
| **Static scan for LOC** | Accurate current state | Doesn't show historical LOC accurately |
| **No re-run architecture** | Fast dashboard refresh | Stale if repo not re-ingested |

---

## Part 2: Metric Definitions & Logic Review

### 2.1 Contributor Metrics

#### **Unique Contributors**
```
Definition: Count of distinct canonical_id values across all commits
Source: commits.parquet → canonical_id (after clean.py normalization)
Current Value: 1,157
```

**Logic Review:**
- ✅ **CORRECT**: Uses graph clustering to unify aliases (e.g., "Satoshi Nakamoto" + "satoshin@gmx.com" = 1 person)
- ✅ **CORRECT**: Excludes bot accounts via IGNORE_EMAILS/IGNORE_NAMES lists
- ⚠️ **INCOMPLETE**: Manual alias list has only ~15 entries; likely missing dozens of known aliases
- ⚠️ **EDGE CASE**: Some contributors use corporate emails for a period, then personal — these may not be unified

**Bitcoin Context:**
In Bitcoin Core, contributor identity is complex. Many developers:
- Use pseudonyms (e.g., "sipa" = Pieter Wuille)
- Switch emails when changing employers
- Use `users.noreply.github.com` emails

**Recommendation:** Expand manual alias list using:
1. Bitcoin Core's historical ACK/NACK records
2. GitHub profile linking
3. Known pseudonym mappings from mailing list archives

---

#### **Contributor Cohort (First Commit Year)**
```
Definition: The year of a contributor's first commit to the repository
Derived: MIN(year) grouped by canonical_id
Use: Distinguishes "Veterans" from "Newcomers"
```

**Logic Review:**
- ✅ **CORRECT**: Uses canonical_id, so aliases are properly grouped
- ✅ **CORRECT**: Enables cohort analysis (retention, churn)
- ⚠️ **NUANCE**: A developer's "first commit" to Bitcoin Core may not reflect their actual start if they contributed via:
  - Pull request reviews (no commit)
  - Concept ACKs
  - Testing without authorship

**Bitcoin Context:**
Many valuable contributors never author commits. The review process in Bitcoin Core means reviewers (who ACK/NACK) are as important as authors. This metric undervalues reviewers.

---

#### **Tenure (Active Years)**
```
Definition: Count of distinct years in which the contributor made ≥1 commit
Derived: NUNIQUE(year) grouped by canonical_id
Example: Active in 2012 and 2024 = 2 years tenure (NOT 12 years span)
```

**Logic Review:**
- ✅ **CORRECT**: Measures actual activity, not just span
- ✅ **INSIGHTFUL**: Distinguishes "one-time" contributors from sustained contributors
- ⚠️ **ALTERNATIVE**: Some dashboards use "span" (last_year - first_year) which overstates engagement

---

#### **Contributor Tiers (Rank Labels)**
```
Definition: Segmentation based on percentile of total commits
Tiers:
  - 👑 The Core (Top 1%): ~12 people, drive ~80% of commits
  - ⭐ The Regulars (Top 10%): Consistent contributors
  - ⚒️ The Sustainers (Top 25%): Periodic contributors  
  - 🔭 The Explorers (Top 50%): Occasional contributors
  - 🧱 The Scouts (Bottom 50%): One-time or rare contributors
```

**Logic Review:**
- ✅ **EXCELLENT**: Reflects reality of open-source contribution distribution (Pareto principle)
- ✅ **STORYTELLING**: Tier names are evocative and accurate
- ⚠️ **CONSIDERATION**: Commit count ≠ impact. A single consensus change can be more critical than 1000 doc fixes.

**Bitcoin Context:**
The "Core" tier aligns with reality. Bitcoin Core has historically had 5-10 developers responsible for most critical changes. The current data showing ~5 active maintainers and a small core group is accurate.

---

### 2.2 Maintainer Metrics

#### **Unique Maintainers (Total)**
```
Definition: Count of distinct committer_email where is_merge = True
Current Value: 36 (all time)
```

#### **Active Maintainers**
```
Definition: Count of distinct committer_email in last 12 months where is_merge = True
Current Value: 5
```

**Logic Review:**
- ⚠️ **PROBLEMATIC DEFINITION**: In Git, `committer_email` identifies who applied a commit, not who has merge authority. This conflates:
  1. **True Maintainers**: Those with GitHub merge permissions (historically: Wladimir, Marco, fanquake, etc.)
  2. **Rebasing Authors**: Contributors who rebase their own work (committer = author)
  3. **Historical Artifacts**: Early commits where Satoshi was both author and committer

**Bitcoin Context:**
Bitcoin Core has a formal maintainer structure documented in `MAINTAINERS.md`. The actual number of people with commit access is much smaller than 36. The "5 active maintainers" is closer to reality but still may include self-committers.

**Recommendation:** 
- Use a whitelist of known maintainer emails for accurate "Maintainer" counts
- Alternatively, filter to only `is_merge=True AND committer_email != author_email`

---

### 2.3 Codebase Size Metrics

#### **Current Codebase Size (LOC)**
```
Definition: Total lines of code in logic files (C++, Python, Shell, etc.)
Source: Static scan of repository HEAD (category_metadata.json)
Current Value: 479,068 lines
Filter: Excludes translations, assets, config files
```

**Logic Review:**
- ✅ **CORRECT APPROACH**: Static scan is accurate for "current state"
- ✅ **GOOD FILTERING**: Excludes non-logic files (Qt translations, images, etc.)
- ⚠️ **HISTORICAL ISSUE**: The evolution charts use `SUM(additions) - SUM(deletions)` which diverges from static scan

**Why Churn ≠ Static Scan:**
1. **File moves**: Git records as delete + add (inflates both)
2. **Reformatting**: Changing whitespace is churn but not new code
3. **Generated files**: May be committed but shouldn't count
4. **Branch merges**: Same code counted multiple times in `--all` log

**Bitcoin Context:**
The 479k LOC is reasonable. Bitcoin Core is a mature codebase. For reference:
- Linux kernel: ~30M LOC
- Firefox: ~20M LOC
- Bitcoin Core at 500k LOC is deliberately lean for a financial system

**Recommendation:**
- Add footnote explaining the difference between "current LOC" and "historical churn"
- The scaling factor applied in `generate_codebase_stats()` is a good workaround but should be documented

---

#### **Lines of Code Evolution**
```
Definition: Cumulative net lines (adds - dels) replayed month by month
Source: Commits sorted by date, delta applied incrementally
Output: stats_stack_evolution.json, stats_category_history.json
```

**Logic Review:**
- ✅ **METHODOLOGY SOUND**: Replay approach is correct
- ✅ **GOOD SCALING**: Applies correction factor to match static scan
- ⚠️ **NEGATIVE VALUES POSSIBLE**: Some categories go negative (deletes > adds historically)
- ⚠️ **PERFORMANCE**: Iterating 50k+ commits is slow; consider caching

---

### 2.4 Category/Architecture Metrics

#### **Categorization Ontology**
```
Definition: Each file path is matched against regex patterns to assign a functional category
Categories (11 total):
  - Consensus (Domain Logic): src/consensus/, src/script/, src/validation
  - Node & RPC (App/Interface): src/node/, src/rpc/
  - P2P Network (Infrastructure): src/net, src/addrman
  - Wallet (Client App): src/wallet/
  - GUI (Presentation Layer): src/qt/
  - Database (Persistence): src/leveldb/, src/dbwrapper
  - Cryptography (Primitives): src/crypto/, src/secp256k1/
  - Utilities (Shared Libs): src/util/, src/support/
  - Tests (QA): src/test/, test/
  - Build & CI (DevOps): ci/, Makefile, CMakeLists
  - Documentation: doc/, *.md
```

**Logic Review:**
- ✅ **EXCELLENT ONTOLOGY**: Aligns with Bitcoin Core's actual module structure
- ✅ **PRIORITY ORDER**: Most specific patterns first prevents misclassification
- ✅ **CONSENSUS PROMINENCE**: Correctly treats consensus code as distinct (most critical)
- ⚠️ **OVERLAP**: Some files touch multiple categories; current logic uses "highest churn" to pick one

**Bitcoin Context:**
This categorization reflects how Bitcoin Core developers think about the codebase:
- **Consensus** is the "source of truth" — changes here require extreme scrutiny
- **Wallet** is being modularized (ongoing libbitcoinkernel work)
- **Tests** have grown significantly as the project matured

**Recommendation:** Consider showing "multi-category" commits as weighted across categories rather than winner-take-all.

---

### 2.5 Time-Based Metrics

#### **Heatmap (Commits by Hour × Year)**
```
Definition: Count of commits binned by hour_utc and year
Insight: Shows timezone shift as project globalized
```

**Logic Review:**
- ✅ **CORRECT**: Uses UTC hour, not local time (avoids DST issues)
- ✅ **INSIGHTFUL**: Clearly shows early US-centric development → global distribution
- ⚠️ **DENSITY**: Some cells have very high values; may need log scale

---

#### **Weekend Ratio**
```
Definition: (Commits on Saturday + Sunday) / Total Commits per year
Insight: Higher ratio = more hobbyist/passion project; Lower = more professional
Current Trend: ~20-25% historically, declining slightly
```

**Logic Review:**
- ✅ **INTERESTING METRIC**: Unique insight into project professionalization
- ⚠️ **TIMEZONE CAVEAT**: "Weekend" is defined in UTC; a Saturday in UTC is Friday night in US West Coast
- ⚠️ **CULTURAL BIAS**: Assumes Western work week; some cultures work Sunday

---

### 2.6 Corporate/Sponsorship Metrics

#### **Corporate Era Classification**
```
Definition: Each contributor is classified as "Corporate" or "Personal" based on:
  1. Enriched company field (from GitHub profile)
  2. Email domain (gmail/hotmail = Personal; chaincode/blockstream = Corporate)
```

**Logic Review:**
- ⚠️ **HEURISTIC APPROACH**: Many false positives/negatives:
  - **False Corporate**: Using `mit.edu` email doesn't mean MIT sponsors Bitcoin work
  - **False Personal**: Many Chaincode/Spiral devs use personal Gmail
- ⚠️ **STALE DATA**: Company affiliation changes; a 2020 snapshot may not reflect 2024 reality
- ✅ **TREND DIRECTION CORRECT**: The overall narrative (hobbyist → sponsored) is accurate

**Bitcoin Context:**
The shift to corporate sponsorship is real and documented. Major sponsors include:
- Chaincode Labs, Spiral (Block/Square), Blockstream, MIT DCI, Brink, Human Rights Foundation

**Recommendation:**
- Add manual override map for known sponsored developers
- Consider "Unknown" category for ambiguous cases
- Add transparency note: "Classification is approximate based on email domains and GitHub profiles"

---

### 2.7 Social Metrics

#### **Stars & Forks History**
```
Definition: Cumulative count of GitHub stars and forks over time
Source: GitHub API (paginated, capped at 5k/2k for speed)
Extrapolation: Linear interpolation from last data point to current totals
```

**Logic Review:**
- ✅ **CREATIVE SOLUTION**: Extrapolation handles API pagination limits
- ⚠️ **INTERPOLATION ASSUMPTION**: Assumes linear growth, but viral moments cause spikes
- ⚠️ **API LIMITATION**: Only 5k stars fetched means early growth is accurate, recent is estimated

**Current Values:**
- Stars: 87,652
- Forks: 38,704
- Watchers: 4,061

---

## Part 3: Identified Issues & Recommendations

### 3.1 Critical Issues

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| **Maintainer overcounting** | High | Filter to known maintainer emails only |
| **Corporate classification inaccuracy** | Medium | Add manual sponsor list |
| **LOC churn vs static divergence** | Medium | Document the methodology difference |

### 3.2 Data Quality Gaps

| Gap | Impact | Solution |
|-----|--------|----------|
| **Incomplete alias list** | Undercounts unique contributors | Expand from mailing list archives |
| **Missing reviewer data** | Undervalues non-authoring contributors | Integrate GitHub PR review data |
| **Stale enrichment data** | Wrong company affiliations | Periodic re-enrichment via API |

### 3.3 Storytelling Improvements

| Current | Suggested Enhancement |
|---------|----------------------|
| "X Contributors" | "X Contributors (Y currently active)" |
| "X Maintainers" | "X people have merged code (N with ongoing commit access)" |
| "480k LOC" | "480k lines of logic code (excluding tests, docs, translations)" |

---

## Part 4: Metric Definitions for Dashboard Users

*This section is designed to appear on a public "Methodology" page.*

### Contributors

| Metric | Definition |
|--------|------------|
| **Unique Contributors** | Total number of distinct individuals who have authored at least one commit to Bitcoin Core. Aliases (same person using different names/emails) are unified using graph analysis. |
| **Cohort Year** | The year a contributor made their first commit. |
| **Tenure** | Number of distinct years with at least one commit (not calendar span). |
| **Contribution Tier** | Percentile-based ranking (Core = top 1%, Regulars = top 10%, etc.) |

### Maintainers

| Metric | Definition |
|--------|------------|
| **Total Maintainers** | Individuals who have merged commits into the repository. Note: This is broader than those with current write access. |
| **Active Maintainers** | Maintainers with merge activity in the last 12 months. |

### Codebase

| Metric | Definition |
|--------|------------|
| **Lines of Code** | Total lines in source files (C++, Python, Shell, etc.) excluding translations, assets, and generated files. Measured from current repository state. |
| **Category** | Functional area of the codebase (Consensus, Wallet, P2P, etc.) determined by file path patterns. |
| **Tech Stack** | Programming language breakdown based on file extensions. |

### Activity

| Metric | Definition |
|--------|------------|
| **Commits** | Unique git commits. Merge commits are included but flagged separately. |
| **Weekend Ratio** | Percentage of commits made on Saturday or Sunday (UTC). |
| **Heatmap** | Commit activity by hour (UTC) and year, showing global development patterns. |

### Social

| Metric | Definition |
|--------|------------|
| **Stars** | GitHub stars, indicating community interest. |
| **Forks** | GitHub forks, indicating derivative work or contribution intent. |
| **Corporate %** | Approximate percentage of commits from developers with corporate affiliations (based on email domain and GitHub profile). |

---

## Part 5: Technical Appendix

### 5.1 File-to-Category Regex Rules

```python
CATEGORY_RULES = {
    "Consensus (Domain Logic)": [
        r"src/consensus/", r"src/kernel/", r"src/script/", 
        r"src/primitives/", r"src/chain", r"src/coins", 
        r"src/pow", r"src/validation\.", r"src/policy/"
    ],
    "Node & RPC (App/Interface)": [
        r"src/node/", r"src/rpc/", r"src/index/", r"src/zmq/",
        r"src/init\.", r"src/bitcoind\.", r"src/bitcoin-cli\."
    ],
    "P2P Network (Infrastructure)": [
        r"src/net", r"src/protocol", r"src/addrman"
    ],
    "Wallet (Client App)": [
        r"src/wallet/", r"src/interfaces/"
    ],
    "GUI (Presentation Layer)": [
        r"src/qt/", r"src/forms/"
    ],
    "Database (Persistence)": [
        r"src/leveldb/", r"src/crc32c/", r"src/dbwrapper\."
    ],
    "Cryptography (Primitives)": [
        r"src/crypto/", r"src/secp256k1/", r"src/minisketch/"
    ],
    "Utilities (Shared Libs)": [
        r"src/util/", r"src/support/", r"src/common/",
        r"src/univalue/", r"src/compat/", r"src/ipc/"
    ],
    "Tests (QA)": [
        r"src/test/", r"test/", r"src/bench/"
    ],
    "Build & CI (DevOps)": [
        r"Makefile", r"ci/", r"\.github/", r"build_msvc",
        r"configure\.ac", r"CMakeLists\.txt", r"depends/", r"share/"
    ],
    "Documentation": [
        r"doc/", r".*\.md$"
    ]
}
```

### 5.2 Identity Resolution Algorithm

```
1. Create undirected graph G
2. For each commit:
   - Add node for NAME:{author_name}
   - Add node for EMAIL:{author_email}
   - Add edge between them
3. Apply manual alias overrides (known pseudonyms)
4. Find connected components in G
5. Each component = one canonical identity
6. Display name = longest name in component
```

### 5.3 Language Classification

```python
LOGIC_LANGUAGES = {
    "C++": [".cpp", ".h", ".hpp", ".cc"],
    "Python": [".py", ".pyi"],
    "C": [".c"],
    "Shell": [".sh", ".bash"],
    "JavaScript": [".js"],
    # ... etc
}

EXCLUDED_FROM_LOC = [
    "Qt Translation", "Qt UI", "Data", "Build System",
    "Config", "Assets"
]
```

---

## Part 6: Changelog & Data Freshness

| Date | Event |
|------|-------|
| 2026-01-24 | Last data generation |
| 2025-12-XX | Repository snapshot (end of 2025) |
| 2024-XX-XX | Legacy enrichment snapshot date |

**Recommended Refresh Cadence:** Monthly for commits, quarterly for enrichment.

---

## Conclusion

The Orange Dev Tracker provides a **solid foundation** for understanding Bitcoin Core development. The key strengths are:

1. **Proper identity resolution** via graph clustering
2. **Accurate categorization** aligned with Bitcoin Core's architecture
3. **Good storytelling** through cohort and tier analysis

Areas for improvement:

1. **Maintainer definition** needs tightening
2. **Corporate classification** needs manual curation
3. **Documentation transparency** — users should understand methodology

This document should be referenced when:
- Answering questions about metric definitions
- Debugging data discrepancies
- Planning dashboard enhancements
- Providing context to LLMs for analysis

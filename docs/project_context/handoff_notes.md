# Handoff Notes: Orange Dev Tracker (Feb 2026 Update)

## Current State
- **Dashboard:** Multi-tab application live at `dashboard.html`.
- **Pages**:
  - `dashboard.html`: High-level vital signs and 2026 roadmap.
  - `contributors.html`: Deep dive into human identities and cohorts.
  - `codebase.html`: Category evolution and tech stack metrics.
  - `engineering.html`: PR Lead time and work-in-progress metrics.
  - `health.html`: Geographical trends, retention, and social proof.
  - `methodology.html`: Stripe-inspired documentation of logic and risk models.
- **Data Pipeline:**
  - `code/ingest.py`: Git log forensics -> Parquet.
  - `code/clean.py`: Identity resolution graph clustering.
  - `code/process.py`: Aggregates and applies Risk-Weighted Impact Model -> JSON Artifacts.

## Key Methodology Shifts
1. **Maintainer Validation**: Uses `data/maintainers_lookup.json` whitelist.
2. **Prioritized Logic**: Subsystem tests (e.g., `/test/`) prioritized over feature components.
3. **Risk Weighting**: Critical consensus code weighted 50x to reflect actual impact.
4. **Transparency**: Methodology page now links directly to raw JSON source assets.

## Context Files
- `logic_context.md`: The "Ontology" and classification rules.
- `metric_logic_review.md`: Qualitative review of metric accuracy and trade-offs.
- `implementation_plan.md`: Historical architecture notes.

## Usage
- **Update Data**: Run the full pipeline via ingestion scripts.
- **Frontend**: Local development via `python -m http.server`.
- **Git Hygiene**: Intermediate parquets and heavy caches are ignored via `.gitignore`.

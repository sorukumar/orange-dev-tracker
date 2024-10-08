# Dashboard Refinement: Contributor Army Section

## Goal
Revamp the "Contributor Army" slide in `index.html` to tell a clearer two-part story:
1.  **Engagement Structure**: How the workload is distributed (The Pareto 80/20 rule).
2.  **Growth Velocity**: The rate at which we are attracting new blood.

## User Review Required
> [!IMPORTANT]
> **Decision on Tiers**: I propose **4 Tiers** based on the "80/20 Rule" (Pareto Principle).
> This provides more granularity than 3 groups (too broad) but is simpler than 5 (too cognitive load).

## Proposed Charts

### Chart 1 (Left): "The Engagement Pyramid"
**Concept**: Show the imbalance of effort (Most commits come from few people).
**Visualization**: **Horizontal Stacked Bar (or Dual Pie)** comparing "Population %" vs "Commit Impact %".

**The 4 Tiers (Proposed Naming):**
1.  **The Core (Top 1%)**: The Architects. (*Typically account for ~30-40% of code*)
2.  **The Regulars (Next 4%)**: The Maintainers/Sustainers. (Top 5% total)
3.  **The Community (Next 15%)**: Occasional Regulars. (Top 20% total)
4.  **The Explorers (Bottom 80%)**: One-time or drive-by contributors.

**Why 4 groups?**
it perfectly maps to standard open-source metrics:
*   The "Bus Factor" lives in Group 1.
*   The "Reviewers" live in Group 2.
*   The "Monthly Active" live in Group 3.
*   The "Long Tail" is Group 4.

### Chart 2 (Right): "Recruitment Velocity"
**Concept**: Focus purely on the *arrival* of new energy.
**Visualization**: **Smooth Area Chart (Gradient Orange)**.
**Metric**: "New Contributors per Year".
**Why?** The previous stacked chart mixed "Veterans" and "Newcomers", making it hard to see if recruitment is accelerating or stalling. Isolating "Newcomers" makes the trend obvious.

## Implementation Details

### Data Sources
*   **Engagement**: Calculate dynamically in `js/app.js` using `data/contributors_rich.json` (using the `percentile` and `total_commits` fields). No new Python needed.
*   **Velocity**: Extract "New Contributors" series from `data/stats_contributor_growth.json`.

### Layout
*   Split the "Contributor Army" card into a 2-column layout (1/3 Left, 2/3 Right) similar to the Work Distribution row.
*   **Left**: Engagement Tiers (Pyramid/Table/Bar).
*   **Right**: Recruitment Velocity (Area Chart).

---

## Verification Plan
1.  Check `contributors_rich.json` to ensure percentile data allows for 1/5/20/80 cuts.
2.  Verify `stats_contributor_growth.json` has the raw counts for "New Contributors".
3.  Preview `index.html` to ensure the layout fits the dashboard aesthetic.

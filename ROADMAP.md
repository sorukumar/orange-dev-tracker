# Orange Dev Tracker: Community Roadmap & Mental Model

This roadmap outlines the upcoming features and data integrations for both the **Orange Dev Tracker** and **Orange Dev Network** dashboards, as well as the underlying data engine (`orange-dev-data`). 

## 🧠 The Mental Model
To keep the architecture clean, we strictly divide the ecosystem into the "What" and the "Who":

- **The "What" (`orange-dev-tracker`):** Focuses on macroeconomic trends, repository health, and the heartbeat of the project. Pages include `health.html`, `pulse.html`, `engineering.html`, etc.
- **The "Who" (`orange-dev-network`):** Focuses on individuals, trust relationships, and organizations. Pages include `contributors.html`, `maintainers.html`, `network.html`, and `directory.html`.

---

## 🏗️ 1. Data Pipeline (`orange-dev-data`)
*The backend is mostly ready, but we are refining the exports to power new frontend visualizations.*

- [ ] **Verify JSON Exports:** Ensure that `stats_reviewers.json` cleanly exports both volume and type of reviews.
- [ ] **Export Reciprocity Data:** Expose "Review Reciprocity" and "Avg Approval Latency".

---

## 🕸️ 2. Influence Map & Directory (`orange-dev-network` - The "Who")

- [ ] **Maintainers (`maintainers.html`):** Continue refining the profiles of developers with merge access.
- [ ] **Profile Pages (`profile.html`):** Upgrade the binary "Reviewer" badge to display the actual Review Weight/Volume (e.g., "500+ ACKs").
- [ ] **Network Graph (`network.html`):** 
    - Adjust node sizing so high-volume reviewers appear more prominent.
    - Visualize reciprocity data as edge weights.
- [ ] **Sponsors Directory (`sponsors.html`):** A dedicated page listing all historical & current orgs that have funded Bitcoin Core, their footprint, and links to their sites.

---

## 📊 3. Core Dashboard (`orange-dev-tracker` - The "What")

- [ ] **Pulse (`pulse.html`):** Add a toggle or section for "Top Reviewers / Gatekeepers" utilizing the 30-day reviewer dataset.
- [ ] **Engineering Health (`health.html`):** Integrate macro reviewer metrics, such as the ratio of "Reviewers vs Code Authors" over time.
- [ ] **Contributor Galaxy:** Add a visual filter to highlight the "Gatekeepers" versus the broader reviewer community.

### 🔄 Health & Culture Revamp (In Progress)
We are actively revamping `health.html` to focus on executive-level vital signs and project resilience.

- **Phase 1 (Complete):** "Institutionalization & Independence" layout, timelines, and Maintainer Matrix. Historical Blockstream/MIT DCI data verified and updated.
- [ ] **Phase 2: Health Scorecard & Bus Factor**
    - **Health Scorecard KPI row:** Add a clean, horizontal row of KPI cards at the very top of `health.html`.
        - *Bus Factor:* e.g., "7 Developers" (number of people accounting for 50% of recent commits).
        - *Workforce Retention:* e.g., "3.2 Years" (average tenure).
        - *New Talent Inflow:* e.g., "142" (new contributors merged in the last 12 months).
    - **Bus Factor Chart:** Add a dedicated visual (area chart) showing the Bus Factor growing over time (resilience indicator).
- [ ] **Phase 3: Sponsorship Concentration & Governance**
    - Add Sponsorship Concentration (HHI) trend.
    - Add Cross-site governance links.
- [ ] **Phase 4: Review Depth & PR Pipelines**
    - Add Review Depth metrics & PR Acceptance Rate pipelines.

---

## 💬 Share Your Feedback
Have thoughts on this roadmap or ideas for new features? 
👉 **[Discuss this Roadmap or Propose a Feature](https://github.com/sorukumar/orange-dev-tracker/issues)**

# Orange Dev Tracker: Community Roadmap

This roadmap outlines the upcoming features and data integrations for both the **Orange Dev Tracker** and **Orange Dev Network** dashboards, as well as the underlying data engine (`orange-dev-data`). 

We maintain this list publicly so the community knows what is being actively built and can provide focused feedback.

---

## 🏗️ 1. Data Pipeline (`orange-dev-data`)
*The backend is mostly ready, but we are refining the exports to power new frontend visualizations.*

- [ ] **Verify JSON Exports:** Ensure that `stats_reviewers.json` and ecosystem summaries cleanly export both the *volume* of reviews (ACK counts) and the *type* of reviews (e.g., `Tested ACK` vs `Concept ACK`).
- [ ] **Export Reciprocity Data:** Expose "Review Reciprocity" (who reviews whom) and "Avg Approval Latency" in a structure that the network graph can parse as edge weights.

---

## 🕸️ 2. Influence Map & Directory (`orange-dev-network`)
*Focus: Deep dive on individual contributors and their trust relationships.*

- [ ] **Profile Pages (`profile.html`):** Upgrade the binary "Reviewer" badge to display the actual Review Weight/Volume (e.g., "500+ ACKs").
- [ ] **Directory (`directory.html`):** Unhide the `Review Reciprocity` and `Avg Approval Latency` metrics. Refine their UI presentation so the community can see how fast PRs are processed.
- [ ] **Network Graph (`network.html`):** 
    - Adjust node sizing so high-volume reviewers appear more prominent.
    - Visualize reciprocity data as edge weights (thicker lines between devs who frequently review each other).
- [ ] **Pulse/Landing (`pulse.html`):** Add a toggle or section for "Top Reviewers / Gatekeepers" utilizing the 30-day reviewer dataset.

---

## 📊 3. Core Dashboard (`orange-dev-tracker`)
*Focus: High-level repository health and macroeconomic trends.*

- [ ] **Engineering Health (`health.html`):** Integrate macro reviewer metrics, such as the ratio of "Reviewers vs Code Authors" over time.
- [ ] **Contributor Galaxy:** Add a visual filter to highlight the "Gatekeepers" (the top maintainers) versus the broader reviewer community.

---

## 💬 Share Your Feedback
Have thoughts on this roadmap or ideas for new features? 

👉 **[Discuss this Roadmap or Propose a Feature](https://github.com/sorukumar/orange-dev-tracker/issues)**

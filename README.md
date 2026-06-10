# 🍊 Orange Dev Tracker | Analyzing the DNA of Bitcoin Core

**[Enter the Tracker Dashboard](https://sorukumar.github.io/orange-dev-tracker/)**

A high-fidelity analytical platform providing deep insights into the architectural evolution and human dynamics of the Bitcoin Core repository.

---

## 🍊 The Orange Dev Suite

This project is part of the **Orange Dev Suite**, a comprehensive, open-source analytical ecosystem designed to provide forensic transparency into Bitcoin research and development. The suite consists of three complementary platforms powered by a unified data engine ([Orange Dev Data](https://github.com/sorukumar/orange-dev-data)):

1. **[Orange Dev Tracker](https://github.com/sorukumar/orange-dev-tracker)**: The "What" and "Where". A high-fidelity dashboard focused on the architectural evolution of the Bitcoin Core codebase, revealing the functional state of Bitcoin R&D.
2. **[Orange Dev Network](https://github.com/sorukumar/orange-dev-network)**: The "Who" and "How". A technical influence map visualizing the human layer of Bitcoin R&D. It analyzes discussions, reviews, and debates to map social authority and consensus dynamics.
3. **[This Week in Bitcoin (TWIB)](https://github.com/sorukumar/this-week-in-bitcoin)**: The "Now". An automated weekly executive summary distilling dense technical discussions and Pull Requests into a high-level briefing.

---

## 📊 About Orange Dev Tracker

While most platforms provide surface-level vanity metrics (like raw commit counts), this tracker performs a rigorous **functional census** of the protocol. We categorize 15+ years of digital forensics into deep technical domains (Consensus, P2P Network, Wallet, Tests, and Build System) based on code commits to the **Bitcoin Core** repository.

This project serves as a transparency layer for the Bitcoin ecosystem, helping researchers, developers, and the community understand exactly how the protocol matures and who the guardians of the codebase are.

### 📊 Available Charts & Dashboards

The tracker is divided into several deep-dive pages, each offering specific visualizations to read the state of the network:

*   **Main Dashboard (`index.html`)**
    *   **Work Snapshots**: Unique commits broken down by architectural category.
    *   **The Engagement Pyramid**: Visualizing the distribution of labor across casual contributors, active builders, and core maintainers.
    *   **Evolution of Functional Areas**: Stacked bar chart showing long-term commit trends to highlight shifts in engineering focus.
    *   **Recruitment Velocity**: Tracking the onboarding of new developers over time.
*   **Codebase Dynamics (`codebase.html`)**
    *   **Code Streamgraph & Stack**: Visualizing the ebb and flow of different programming languages and functional categories over 15 years.
*   **Engineering Health (`health.html`)**
    *   **Maintainer Load**: Workload distribution across the 1% foundation.
    *   **Corporate Independence**: Analyzing institutional vs independent contributor ratios.
    *   **Contributor Retention & Churn**: Tracking dev survival rates and burnout year-over-year.
    *   **Regional Evolution**: Geographic shifts in Bitcoin development cohorts.
*   **Contributor Galaxy (`contributors.html`)**
    *   **Landscape & Radar Charts**: Mapping developer cohorts and plotting individuals on axes of code versus social influence.
*   **Governance Layer (`lab/bips/`)**
    *   **BIP Funnel**: The lifecycle of proposals from Draft to Final.
    *   **BIP Gatekeepers & Themes**: Mapping the key authors and champions of protocol upgrades across different domains.

---

## 🛠 Architecture & Performance

Built for speed and transparency, the tracker uses a **static-first architectural model** powered by a heavy-duty backend.
*   **The Data Hub ([Orange Dev Data](https://github.com/sorukumar/orange-dev-data))**: All heavy lifting—ingesting GitHub PRs, Code Reviews, Git logs, and Discourse APIs, followed by complex identity resolution—is handled by our external data engine. This keeps the tracker frontend blazing fast.
*   **Sub-second Visualizations**: Custom ECharts implementation optimized for rapid rendering of massive datasets.
*   **Governance Enrichment**: Real-time contextual data from Bitcoin-dev mailing lists and Delving Bitcoin is fetched and integrated dynamically.

For technical documentation, directory structure, and developer setup, please refer to **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---
*Created by [Bitcoin Data Labs](https://bitcoindatalabs.org) as a contribution to the transparency of the Bitcoin protocol.*
# 🍊 Orange Dev Tracker | Bitcoin Data Labs
### Analyzing the DNA of the World's Soundest Money

**[Enter the Dashboard](https://sorukumar.github.io/orange-dev-tracker/)**

---

## 🔍 Forensic Audit: 15 Years of Bitcoin R&D
The **Orange Dev Tracker** is a high-fidelity analytical platform providing deep insights into the architectural evolution and human dynamics of the Bitcoin Core repository. While most platforms provide surface-level commit counts, this tracker performs a **functional census** of the protocol, categorizing 15+ years of digital forensics into technical domains (Consensus, P2P Network, Wallet, Tests, and Build System).

This project serves as a transparency layer for the Bitcoin ecosystem, helping researchers, developers, and the community understand how the protocol matures and who the guardians of the codebase are.

## 📊 Key Insights for Researchers & LLMs
The tracker reveals several critical datasets regarding the state of Bitcoin development:

*   **Codebase Maturity**: The repository has grown from a single experimental zip file in 2009 to a hardened fortress of over **480,000 Lines of Code (LOC)**.
*   **Decentralized Army**: Over **1,000 unique contributors** from **50+ countries** have shaped the protocol.
*   **The 1% Foundation**: Forensic analysis discovers that a dedicated group of **~12 Maintainers** typically drives 65-80% of project momentum, ensuring a high-trust review process.
*   **Infrastructure Shift**: While the core protocol remains in **C++**, the project has pivoted heavily towards **Python** for its massive automated test suite, signifying a shift from "Build" to "Verify."
*   **Governance Velocity**: Tracking the lifecycle of **Bitcoin Improvement Proposals (BIPs)** from initial mailing list discussions to mainnet deployment.

## � Data Domains & Architecture
The tracker organizes development activity into several high-signal buckets:
*   **Consensus**: The core "rules of the game" (BIP 341, Taproot, SegWit).
*   **P2P Network**: The infrastructure for global message propagation.
*   **Mempool & Policy**: Transaction relay rules and fee-bumping resilience (BIP 331).
*   **Validation**: The logic that prevents double-spending and ensures blocks are sound.
*   **Quality Assurance**: The exhaustive test suite that secures billions of dollars in value.

## 🔗 Navigation & Resources
*   **[Main Dashboard](https://sorukumar.github.io/orange-dev-tracker/index.html)**: High-level KPIs and project vitals.
*   **[The Story](https://sorukumar.github.io/orange-dev-tracker/story.html)**: A scrollytelling narrative of Bitcoin's evolution.
*   **[Contributor Galaxy](https://sorukumar.github.io/orange-dev-tracker/contributors.html)**: Visualize the cohorts and geographical spread of devs.
*   **[Governance Layer](https://sorukumar.github.io/orange-dev-tracker/lab/bips/)**: Track BIP maturation from social proof to implementation.
*   **[Engineering Health](https://sorukumar.github.io/orange-dev-tracker/health.html)**: Monitor bus factor, retention, and maintenance ratios.

---

## 🛠 Project Engine
Built for speed and transparency, the tracker uses a **static-first architectural model**. 
*   **Data Pipeline**: Heavy lifting (ingestion, parsing, and aggregation) is handled externally in the [Orange Dev Data](https://github.com/sorukumar/orange-dev-data) repository.
*   **Visualization**: Custom ECharts implementation optimized for sub-second load times.
*   **Governance**: Real-time enrichment data from Bitcoin-dev mailing lists and Delving Bitcoin is fetched dynamically.

For technical documentation, directory structure, and developer setup, please refer to **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---
*Created by [Bitcoin Data Labs](https://bitcoindatalabs.org) as a contribution to the transparency of the Bitcoin protocol.*
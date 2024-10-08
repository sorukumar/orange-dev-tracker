# 🍊 Orange Dev Tracker
### 15 Years of Bitcoin Source Code Forensics

A high-fidelity, interactive dashboard exploring the architectural evolution and contributor landscape of the Bitcoin Core repository from 2009 to 2025.

![License](https://img.shields.io/badge/license-MIT-orange)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![ECharts](https://img.shields.io/badge/viz-ECharts-red)

## 📊 Live Dashboard
**[View the Live Tracker](https://saurabhkumar.github.io/orange-dev-tracker/)** *(Replace with your final URL)*

## 🔍 Project Overview
This project performs a deep "forensic audit" of the Bitcoin source code history. Instead of simple commit counts, it categorizes every change into architectural areas (Consensus, P2P, Wallet, Scripts, etc.) to visualize how the "Orange" codebase has matured.

### Key Features
*   **Architectural Evolution:** Track Lines of Code (LOC) and activity by functional category.
*   **Contributor Tiers:** Identify the Core, Regulars, and Sustainers driving the project.
*   **Global Distribution:** Analyze the timezone and geographical spread of development.
*   **Health Metrics:** Monitor maintainer activity and "weekend coding" ratios.

## 🛠 Tech Stack
*   **Frontend:** Vanilla JS + ECharts for high-performance, interactive visualizations.
*   **Data Pipeline:** Python (Pandas/Requests) for ingestion and enrichment.
*   **Automation:** Planned GitHub Actions for monthly data refreshes.

## 🚀 Running Locally
1. Clone the repository: `git clone https://github.com/your-username/orange-dev-tracker.git`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the pipeline: `python code/process.py`
4. Open `index.html` in any browser.

---
*Created as a forensic study of the most important codebase in the world.*
# 🩺 Defib — Autonomous Quorum Rescue Agent for DAOs

> Autonomous governance health coordinator. Defib monitors proposal statuses, evaluates quorum risks on-chain, triggers targeted voting incentives, and records auditable *Proof of Reasoning* receipts to rescue critical DAO votes before time runs out.

---

## 💡 The Problem

In DAO governance, **proposals frequently fail not because of active opposition, but due to apathy and coordination failure near the deadline**. 

Quorum thresholds are crucial for security (preventing hostile takeovers), but they become a bottleneck when voter participation collapses due to:
* High gas costs during periods of high congestion.
* Lack of real-time voter awareness.
* Apathy from large, passive token holders.

When a proposal is at 16% participation with 1 hour left and requires 20% to pass, manual intervention is too slow. The proposal is doomed to expire, wasting weeks of contributor design and debate.

---

## ⚡ The Solution

**Defib** is an autonomous quorum rescue agent. It bridges the gap between AI agentic reasoning and on-chain governance execution.

1. **Continuous Monitoring**: The agent polls governance contracts.
2. **On-Chain Risk Evaluation**: Defib evaluates proposals against an algorithmic risk formula.
3. **Targeted Incentives (Bounties & Gas)**: If a proposal is critically at risk of failing quorum, Defib deposits reward tokens into a secure distribution vault to subsidize voter gas and award participation.
4. **On-Chain Proof of Reasoning**: When Defib triggers a rescue, it emits an immutable receipt log containing full telemetry (proposal ID, current quorum, time remaining, calculated risk score, action taken, and reasoning hash). This allows the DAO to audit why the agent acted and prevent rogue agent behavior.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │  TypeScript Agent / CLI │
                    └────────────┬────────────┘
                                 │ Evaluates
                                 ▼
                     ┌───────────────────────┐
                     │   DefibCore.sol       │ 
                     │                       │
                     │  - Evaluates Risk     ├───────┐
                     │  - Emits Proof Receipt│       │
                     └───────┬───────────┬───┘       │ Signals
                             │           │           │ Incentive
                             │ Funds     │ Registers │ Active
                             ▼           ▼           ▼
                      ┌─────────────┐  ┌───────────────┐
                      │ MockToken   │  │ BountyVault   │
                      │ (DFIB ERC20)│  │               │
                      └─────────────┘  │ - Holds Funds │
                                       │ - Voter Claims│
                                       └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │ Voters (Claim)│
                                       └───────────────┘
```

### Smart Contract Components

* **`MockToken.sol` (`DFIB`)**: The native incentive token used to distribute voting bounties and gas subsidies.
* **`MockDAO.sol`**: Simulates a standard governance contract. Features proposal creation, deadline configurations, participation tracking, and vote simulation.
* **`BountyVault.sol`**: The distribution vault. Holds the reward tokens locked for specific endangered proposals and manages fair claims from eligible voters.
* **`DefibCore.sol`**: The orchestration brain. Runs the risk assessment math. If `Time Remaining <= 1 Hour` AND `Quorum is Unreached` AND `Current Participation < 90% of Quorum`, it locks the bounty and records the Proof of Reasoning.

---

## ⚡ Why Somnia?

Defib is designed specifically to leverage the unique advantages of the **Somnia Network**:

1. **Ultra-Low Gas Fees**: Voting incentives only work if gas fees don't eat up the bounty. Somnia’s sub-cent transaction costs make micro-incentives (like $0.50 gas subsidies) highly effective for mass voter activation.
2. **Massive Throughput**: Governance surges near deadlines can congest legacy networks. Somnia’s high transaction speeds ensure voting sweeps and bounty claims clear instantly without bidding up gas fees.
3. **Real-time AI Integration**: Autonomous agents need sub-second finality to monitor state and inject capital before proposals expire. Somnia’s performance makes real-time agentic governance possible.

---

## 🛠️ Tech Stack & Setup

* **Solidity**: Smart contract development.
* **Hardhat**: Development environment, local EVM node, and testing framework.
* **TypeScript & Ethers.js**: Scripting, agent execution, and assertions.

### Installation

1. Clone or download the repository.
2. Install the dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

---

## 🖥️ Interactive Demo Web App

For hackathon presentations and judges, Defib features a gorgeous **interactive single-page web application** under `/frontend` designed with Web3 dark mode and glassmorphism. It allows you to simulate the entire autonomous rescue campaign, watch real-time log outputs in a developer terminal, and review on-chain Proof of Reasoning receipts.

### Key Features:
* **Interactive Governance Board**: Shows Proposal #42 with live participation status and glowing critical indicators.
* **Autonomous Controller**: Click "Run Defib Rescue" to watch the agent analyze risk, lock in the reward tokens, log reasoning hashes, and simulate voter updates.
* **Proof of Reasoning Receipt**: Displays verified cryptographic receipt telemetry (risk scores, hashes, and dynamic timestamps) when the rescue completes.
* **Technical Architecture Map**: Provides a live visual flowchart highlighting active contracts during the execution process.

### How to Run:
You can run it instantly on your local computer by opening the HTML file in any browser:
* Double-click [index.html](file:///Users/efi/Music/Kris%202/Defib/frontend/index.html) or run in your shell:
  ```bash
  open frontend/index.html
  ```

---

## 🚀 Running the Demo

Defib includes a fully automated end-to-end simulation script that showcases:
1. Smart contract deployment.
2. Initialization of an endangered proposal (#42 at 16% participation, 20% required quorum, with 1 hour left).
3. The Defib Agent detecting the risk, calculating risk factors, deploying the `500 DFIB` bounty, and recording the Proof of Reasoning on-chain.
4. Voters detecting the incentive, casting votes (+5% participation), and claiming rewards.
5. Successful rescue of the proposal achieving quorum.

To run the demo:
```bash
npx hardhat run scripts/demo.ts
```

---

## 🧪 Running Unit Tests

A comprehensive test suite is included to verify the core risk math, permissions, event emissions, and claim logic.

To execute tests:
```bash
npx hardhat test
```

---

## 🗺️ Future Roadmap

1. **Advanced Sybil-Resistance**: Integrate with Gitcoin Passport or WorldID on Somnia to restrict incentive claims to verified human voters.
2. **Dynamic Risk-Sizing**: Adjust bounty pools dynamically based on proposal importance (e.g. Treasury vs. Parameter changes) and voter gap size.
3. **Multi-Token Support**: Allow DAOs to fund the `DefibCore` agent with external tokens (e.g. stablecoins, ETH, or native DAO tokens).
4. **Cross-Chain Governance**: Enable Defib on Somnia to monitor and trigger rescue campaigns for DAOs on Arbitrum, Optimism, or Ethereum Mainnet using cross-chain messaging bridges.

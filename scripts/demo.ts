import hre from "hardhat";

async function main() {
  console.log("\n======================================================================");
  console.log("                 DEFIB AUTONOMOUS QUORUM RESCUE DEMO                  ");
  console.log("======================================================================\n");

  const [deployer, voter1, voter2] = await hre.ethers.getSigners();

  // 1. Deploying Contracts
  console.log("[+] Deploying contracts on local test network...");
  
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log(`    ✔ MockToken deployed at:   \x1b[36m${tokenAddress}\x1b[0m`);

  const MockDAO = await hre.ethers.getContractFactory("MockDAO");
  const mockDAO = await MockDAO.deploy();
  await mockDAO.waitForDeployment();
  const daoAddress = await mockDAO.getAddress();
  console.log(`    ✔ MockDAO deployed at:     \x1b[36m${daoAddress}\x1b[0m`);

  const BountyVault = await hre.ethers.getContractFactory("BountyVault");
  const bountyVault = await BountyVault.deploy(tokenAddress);
  await bountyVault.waitForDeployment();
  const vaultAddress = await bountyVault.getAddress();
  console.log(`    ✔ BountyVault deployed at: \x1b[36m${vaultAddress}\x1b[0m`);

  const DefibCore = await hre.ethers.getContractFactory("DefibCore");
  const defibCore = await DefibCore.deploy(tokenAddress, daoAddress, vaultAddress);
  await defibCore.waitForDeployment();
  const coreAddress = await defibCore.getAddress();
  console.log(`    ✔ DefibCore deployed at:   \x1b[36m${coreAddress}\x1b[0m`);

  // 2. Establishing Permissions and Funding
  console.log("\n[+] Setting up contract permissions and pre-funding...");
  await mockDAO.setDefibCore(coreAddress);
  await bountyVault.setDefibCore(coreAddress);
  
  const fundAmount = hre.ethers.parseUnits("10000", 18);
  await mockToken.transfer(coreAddress, fundAmount);
  console.log(`    ✔ Bounty pool funded with \x1b[32m10,000 DFIB\x1b[0m tokens.`);

  // 3. Creating at-risk proposal
  console.log("\n[+] Creating Proposal #42 on MockDAO...");
  const proposalId = 42;
  const description = "Upgrade Treasury Allocation to AI Autonomous Liquidity Pools";
  const requiredQuorum = 20; // 20%
  const initialParticipation = 16; // 16%
  const duration = 3600; // 1 hour (3600 seconds)

  await mockDAO.createProposal(proposalId, description, requiredQuorum, initialParticipation, duration);

  const propBefore = await mockDAO.getProposal(proposalId);
  const timeRemainingMinutes = Math.round(Number(propBefore.deadline - BigInt(Math.floor(Date.now() / 1000))) / 60);

  console.log("\n----------------------------------------------------------------------");
  console.log(`PROPOSAL #${proposalId} INITIAL STATE:`);
  console.log(`  Description:        ${description}`);
  console.log(`  Required Quorum:    \x1b[35m${requiredQuorum}%\x1b[0m`);
  console.log(`  Participation:      \x1b[31m${initialParticipation}%\x1b[0m`);
  console.log(`  Time Remaining:     \x1b[33m~${duration / 60} minutes\x1b[0m`);
  console.log(`  Incentive Status:   \x1b[31mINACTIVE\x1b[0m`);
  console.log(`  Quorum Status:      \x1b[31mAT RISK (Below 90% quorum threshold)\x1b[0m`);
  console.log("----------------------------------------------------------------------");

  // 4. Running the Defib Agent Evaluation
  console.log("\n[!] RUNNING DEFIB AUTONOMOUS EVALUATION AGENT...");
  console.log("    Defib evaluating proposal...");

  // Send Tx to evaluate Proposal
  const tx = await defibCore.evaluateProposal(proposalId);
  const receipt = await tx.wait();
  console.log(`    ✔ Evaluation Transaction sent: \x1b[32m${tx.hash}\x1b[0m`);

  // Parse logs to extract Proof of Reasoning
  const event = receipt.logs
    .map((log: any) => {
      try {
        return defibCore.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsedLog: any) => parsedLog && parsedLog.name === "ProofOfReasoning");

  if (event) {
    const args = event.args;
    console.log("\n🚨 CRITICAL RISK DETECTED!");
    console.log(`    - Missing participation gap: \x1b[31m${Number(args.requiredQuorum) - Number(args.currentParticipation)}%\x1b[0m`);
    console.log(`    - Time remaining is critically low (\x1b[33m${Math.round(Number(args.timeRemaining) / 60)} minutes <= 60m threshold\x1b[0m)`);
    console.log(`    - Participation (\x1b[31m${args.currentParticipation}%\x1b[0m) is below 90% of quorum (\x1b[33m18%\x1b[0m)`);

    console.log("\n🤖 ON-CHAIN DECISION MAKER:");
    console.log(`    Action selected: \x1b[32m${args.actionTaken}\x1b[0m`);
    console.log(`    Bounty reward:   \x1b[32m${hre.ethers.formatUnits(args.bountyAmount, 18)} DFIB\x1b[0m tokens allocated`);
    console.log(`    Risk Score:      \x1b[31m${args.riskScore} / 100\x1b[0m`);
    console.log(`    Reasoning Hash:  \x1b[36m${args.reasoningHash}\x1b[0m`);
    console.log("    Proof of Reasoning successfully recorded on-chain.");
  } else {
    console.log("\n[x] Agent evaluated proposal, but no risk actions were triggered.");
  }

  // 5. Simulating Rescue Effects (Voters casting votes & claiming bounties)
  console.log("\n----------------------------------------------------------------------");
  console.log("                 SIMULATING COMMUNITY ACTION (RESCUE EFFECT)          ");
  console.log("----------------------------------------------------------------------");
  console.log("[+] Voters detect active bounty and cast quorum-rescuing votes...");

  // Voter 1 casts 3% vote and claims bounty
  console.log(`\n[+] Voter 1 (${voter1.address.slice(0, 8)}...) voting...`);
  await mockDAO.simulateVotes(proposalId, 3);
  console.log("    ✔ Cast vote representing \x1b[32m+3% participation\x1b[0m");
  
  console.log(`    Claiming bounty for Voter 1...`);
  const balanceBefore1 = await mockToken.balanceOf(voter1.address);
  await bountyVault.connect(voter1).claimBounty(proposalId);
  const balanceAfter1 = await mockToken.balanceOf(voter1.address);
  console.log(`    ✔ Bounty claimed successfully! Balance: \x1b[32m${hre.ethers.formatUnits(balanceAfter1 - balanceBefore1, 18)} DFIB\x1b[0m`);

  // Voter 2 casts 2% vote and claims bounty
  console.log(`\n[+] Voter 2 (${voter2.address.slice(0, 8)}...) voting...`);
  await mockDAO.simulateVotes(proposalId, 2);
  console.log("    ✔ Cast vote representing \x1b[32m+2% participation\x1b[0m");

  console.log(`    Claiming bounty for Voter 2...`);
  const balanceBefore2 = await mockToken.balanceOf(voter2.address);
  await bountyVault.connect(voter2).claimBounty(proposalId);
  const balanceAfter2 = await mockToken.balanceOf(voter2.address);
  console.log(`    ✔ Bounty claimed successfully! Balance: \x1b[32m${hre.ethers.formatUnits(balanceAfter2 - balanceBefore2, 18)} DFIB\x1b[0m`);

  // 6. Final State Review
  const propAfter = await mockDAO.getProposal(proposalId);
  const quorumReached = await mockDAO.isQuorumReached(proposalId);
  const remainingBounty = await bountyVault.getRemainingBounty(proposalId);

  console.log("\n----------------------------------------------------------------------");
  console.log(`PROPOSAL #${proposalId} POST-RESCUE STATE:`);
  console.log(`  Required Quorum:    ${propAfter.requiredQuorum}%`);
  console.log(`  Current Quorum:     \x1b[32m${propAfter.currentParticipation}%\x1b[0m`);
  console.log(`  Incentive Status:   \x1b[32mACTIVE\x1b[0m`);
  console.log(`  Remaining Bounty:   \x1b[33m${hre.ethers.formatUnits(remainingBounty, 18)} DFIB\x1b[0m`);
  console.log(`  Quorum Reached:     \x1b[32m${quorumReached ? "YES" : "NO"}\x1b[0m`);
  console.log("----------------------------------------------------------------------");

  if (quorumReached) {
    console.log("\n======================================================================");
    console.log("🎉 SUCCESS: Proposal #42 has achieved quorum before the deadline!");
    console.log("            Autonomous Defib Agent successfully completed the rescue. ");
    console.log("======================================================================\n");
  } else {
    console.log("\n======================================================================");
    console.log("❌ FAILURE: Proposal failed to achieve quorum.");
    console.log("======================================================================\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

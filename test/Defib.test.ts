import hre from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Defib Autonomous Quorum Rescue MVP", function () {
  let mockToken: any;
  let mockDAO: any;
  let bountyVault: any;
  let defibCore: any;
  let deployer: any;
  let voter1: any;
  let voter2: any;

  beforeEach(async function () {
    // Get signers
    [deployer, voter1, voter2] = await hre.ethers.getSigners();

    // Deploy MockToken
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy MockDAO
    const MockDAO = await hre.ethers.getContractFactory("MockDAO");
    mockDAO = await MockDAO.deploy();
    await mockDAO.waitForDeployment();

    // Deploy BountyVault
    const BountyVault = await hre.ethers.getContractFactory("BountyVault");
    bountyVault = await BountyVault.deploy(await mockToken.getAddress());
    await bountyVault.waitForDeployment();

    // Deploy DefibCore
    const DefibCore = await hre.ethers.getContractFactory("DefibCore");
    defibCore = await DefibCore.deploy(
      await mockToken.getAddress(),
      await mockDAO.getAddress(),
      await bountyVault.getAddress()
    );
    await defibCore.waitForDeployment();

    // Setup permissions
    await mockDAO.setDefibCore(await defibCore.getAddress());
    await bountyVault.setDefibCore(await defibCore.getAddress());

    // Fund DefibCore with DFIB tokens for rescue operations (10,000 tokens)
    const fundAmount = hre.ethers.parseUnits("10000", 18);
    await mockToken.transfer(await defibCore.getAddress(), fundAmount);
  });

  describe("Proposal Risk Assessment & Rescue", function () {
    it("Should NOT trigger rescue if proposal is not at risk (deadline is too far)", async function () {
      const proposalId = 1;
      const duration = 2 * 3600; // 2 hours

      // Create proposal with 16% participation, 20% required quorum (below 90%, but too much time left)
      await mockDAO.createProposal(proposalId, "Proposal 1", 20, 16, duration);

      // Evaluate
      const tx = await defibCore.evaluateProposal(proposalId);
      const receipt = await tx.wait();

      // Ensure no rescue triggered (should not emit DefibTriggered event)
      const prop = await mockDAO.getProposal(proposalId);
      expect(prop.incentiveActive).to.be.false;

      // BountyVault should have 0 registered bounty
      const bounty = await bountyVault.proposalBounties(proposalId);
      expect(bounty).to.equal(0);
    });

    it("Should NOT trigger rescue if proposal is not at risk (participation is safe, >90% of quorum)", async function () {
      const proposalId = 2;
      const duration = 1800; // 30 minutes (within 1 hour)

      // Create proposal with 19% participation, 20% required quorum (which is 95% of quorum, not critical)
      await mockDAO.createProposal(proposalId, "Proposal 2", 20, 19, duration);

      // Evaluate
      await defibCore.evaluateProposal(proposalId);

      const prop = await mockDAO.getProposal(proposalId);
      expect(prop.incentiveActive).to.be.false;
    });

    it("Should NOT trigger rescue if proposal already reached quorum", async function () {
      const proposalId = 3;
      const duration = 1800; // 30 minutes

      // Create proposal with 21% participation, 20% required quorum
      await mockDAO.createProposal(proposalId, "Proposal 3", 20, 21, duration);

      // Evaluate
      await defibCore.evaluateProposal(proposalId);

      const prop = await mockDAO.getProposal(proposalId);
      expect(prop.incentiveActive).to.be.false;
    });

    it("Should trigger rescue if proposal is critically at risk", async function () {
      const proposalId = 42;
      const duration = 3600; // 1 hour (exactly at threshold)

      // Create proposal: 20% quorum, 16% participation (which is 80% of quorum, < 90%)
      await mockDAO.createProposal(proposalId, "Rescue Proposal", 20, 16, duration);

      // Evaluate & check for events
      await expect(defibCore.evaluateProposal(proposalId))
        .to.emit(defibCore, "DefibTriggered")
        .withArgs(proposalId, hre.ethers.parseUnits("500", 18))
        .and.to.emit(defibCore, "ProofOfReasoning");

      // Verify state changes
      const prop = await mockDAO.getProposal(proposalId);
      expect(prop.incentiveActive).to.be.true;

      const bountyAmount = await bountyVault.proposalBounties(proposalId);
      expect(bountyAmount).to.equal(hre.ethers.parseUnits("500", 18));

      // BountyVault should have the funds
      const vaultBalance = await mockToken.balanceOf(await bountyVault.getAddress());
      expect(vaultBalance).to.equal(hre.ethers.parseUnits("500", 18));
    });
  });

  describe("Proof of Reasoning receipt logs", function () {
    it("Should log correct parameters in ProofOfReasoning receipt", async function () {
      const proposalId = 100;
      const duration = 1800; // 30 minutes

      await mockDAO.createProposal(proposalId, "Proof Test Proposal", 20, 15, duration);

      const tx = await defibCore.evaluateProposal(proposalId);
      const receipt = await tx.wait();

      // Find ProofOfReasoning log
      const event = receipt.logs
        .map((log: any) => {
          try {
            return defibCore.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsedLog: any) => parsedLog && parsedLog.name === "ProofOfReasoning");

      expect(event).to.not.be.null;
      expect(event.args.proposalId).to.equal(proposalId);
      expect(event.args.currentParticipation).to.equal(15);
      expect(event.args.requiredQuorum).to.equal(20);
      expect(event.args.riskScore).to.be.greaterThan(0);
      expect(event.args.actionTaken).to.equal("Activate targeted voting incentive");
      expect(event.args.bountyAmount).to.equal(hre.ethers.parseUnits("500", 18));
      expect(event.args.reasoningHash).to.not.be.null;
    });
  });

  describe("Bounty Incentives & Quorum Success", function () {
    beforeEach(async function () {
      const proposalId = 42;
      const duration = 3600; // 1 hour
      await mockDAO.createProposal(proposalId, "Rescue Proposal", 20, 16, duration);
      await defibCore.evaluateProposal(proposalId);
    });

    it("Should allow voters to claim their share of the active bounty", async function () {
      const proposalId = 42;

      // Voter 1 claims
      const initialBalance1 = await mockToken.balanceOf(voter1.address);
      await bountyVault.connect(voter1).claimBounty(proposalId);
      const finalBalance1 = await mockToken.balanceOf(voter1.address);

      expect(finalBalance1 - initialBalance1).to.equal(hre.ethers.parseUnits("100", 18));

      // Voter 2 claims
      const initialBalance2 = await mockToken.balanceOf(voter2.address);
      await bountyVault.connect(voter2).claimBounty(proposalId);
      const finalBalance2 = await mockToken.balanceOf(voter2.address);

      expect(finalBalance2 - initialBalance2).to.equal(hre.ethers.parseUnits("100", 18));

      // Check remaining bounty
      const remainingBounty = await bountyVault.getRemainingBounty(proposalId);
      expect(remainingBounty).to.equal(hre.ethers.parseUnits("300", 18));
    });

    it("Should NOT allow voter to claim bounty twice", async function () {
      const proposalId = 42;

      await bountyVault.connect(voter1).claimBounty(proposalId);
      await expect(bountyVault.connect(voter1).claimBounty(proposalId)).to.be.revertedWith(
        "BountyVault: Bounty reward already claimed"
      );
    });

    it("Should achieve quorum after simulated voter participation", async function () {
      const proposalId = 42;

      // Verify quorum not reached initially
      expect(await mockDAO.isQuorumReached(proposalId)).to.be.false;

      // Simulate voters casting votes (adding 5% participation)
      await mockDAO.simulateVotes(proposalId, 5);

      // Verify quorum reached (16% + 5% = 21%, which is >= 20%)
      expect(await mockDAO.isQuorumReached(proposalId)).to.be.true;

      const prop = await mockDAO.getProposal(proposalId);
      expect(prop.currentParticipation).to.equal(21);
    });
  });
});

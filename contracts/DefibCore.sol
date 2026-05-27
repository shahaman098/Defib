// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockDAO.sol";
import "./BountyVault.sol";

/**
 * @title DefibCore
 * @dev Autonomous governance agent coordinator. Performs on-chain risk calculations,
 * triggers targeted voting incentives, and logs Proof of Reasoning audit receipts.
 */
contract DefibCore {
    IERC20 public immutable token;
    MockDAO public immutable mockDAO;
    BountyVault public immutable bountyVault;

    uint256 public constant BOUNTY_AMOUNT = 500 * 10 ** 18; // 500 DFIB tokens per rescue

    event DefibTriggered(uint256 indexed proposalId, uint256 bountyAmount);

    event ProofOfReasoning(
        uint256 indexed proposalId,
        uint256 currentParticipation,
        uint256 requiredQuorum,
        uint256 timeRemaining,
        uint256 riskScore,
        string actionTaken,
        uint256 bountyAmount,
        bytes32 reasoningHash,
        uint256 timestamp
    );

    constructor(
        IERC20 _token,
        MockDAO _mockDAO,
        BountyVault _bountyVault
    ) {
        require(address(_token) != address(0), "DefibCore: Token address cannot be zero");
        require(address(_mockDAO) != address(0), "DefibCore: MockDAO address cannot be zero");
        require(address(_bountyVault) != address(0), "DefibCore: BountyVault address cannot be zero");

        token = _token;
        mockDAO = _mockDAO;
        bountyVault = _bountyVault;
    }

    /**
     * @dev Core entry point for the autonomous agent. Inspects a proposal and, if critically at risk,
     * triggers on-chain incentives and records a Proof of Reasoning receipt.
     * @param proposalId The ID of the proposal to evaluate.
     * @return triggered True if the rescue mechanism was activated, false otherwise.
     */
    function evaluateProposal(uint256 proposalId) external returns (bool triggered) {
        // Read proposal directly from the MockDAO
        MockDAO.Proposal memory prop = mockDAO.getProposal(proposalId);

        // Ensure proposal is still open and incentives aren't already active
        if (block.timestamp >= prop.deadline || prop.incentiveActive) {
            return false;
        }

        // Calculate time remaining (safely preventing underflow)
        uint256 timeRemaining = 0;
        if (prop.deadline > block.timestamp) {
            timeRemaining = prop.deadline - block.timestamp;
        }

        // --- Risk Condition Checks ---
        // 1. Time remaining is <= 1 hour (3600 seconds)
        bool timeAtRisk = (timeRemaining <= 1 hours);

        // 2. Current participation is below the required quorum
        bool belowQuorum = (prop.currentParticipation < prop.requiredQuorum);

        // 3. Current participation is below 90% of the required quorum
        // We calculate (prop.currentParticipation * 100) < (prop.requiredQuorum * 90)
        bool belowCriticalThreshold = false;
        if (prop.requiredQuorum > 0) {
            belowCriticalThreshold = (prop.currentParticipation * 100) < (prop.requiredQuorum * 90);
        }

        // Trigger action ONLY if all three conditions are satisfied
        if (timeAtRisk && belowQuorum && belowCriticalThreshold) {
            // Calculate a granular risk score (0-100)
            // Starts with the percentage gap from quorum, and adds an urgency weight for shorter deadlines
            uint256 gap = prop.requiredQuorum - prop.currentParticipation;
            uint256 baseRisk = (gap * 100) / prop.requiredQuorum;
            uint256 timeUrgency = 0;

            if (timeRemaining <= 15 minutes) {
                timeUrgency = 30; // Maximum urgency
            } else if (timeRemaining <= 30 minutes) {
                timeUrgency = 15; // Moderate urgency
            } else {
                timeUrgency = 5;  // Standard risk
            }

            uint256 riskScore = baseRisk + timeUrgency;
            if (riskScore > 100) {
                riskScore = 100;
            }

            // Perform Rescue:
            // 1. Transfer reward tokens from DefibCore to the BountyVault
            require(
                token.transfer(address(bountyVault), BOUNTY_AMOUNT),
                "DefibCore: Incentive token funding failed"
            );

            // 2. Register the bounty pool in BountyVault
            bountyVault.registerBounty(proposalId, BOUNTY_AMOUNT);

            // 3. Signal to the DAO that active incentives are live
            mockDAO.setIncentiveActive(proposalId);

            // 4. Generate Proof of Reasoning
            string memory action = "Activate targeted voting incentive";
            bytes32 reasoningHash = keccak256(
                abi.encodePacked(
                    "Quorum risk is critical. Participation is ",
                    prop.currentParticipation,
                    "%, which is below 90% of required quorum of ",
                    prop.requiredQuorum,
                    "%. Time remaining: ",
                    timeRemaining,
                    " seconds."
                )
            );

            // Emit Proof of Reasoning receipt event
            emit ProofOfReasoning(
                proposalId,
                prop.currentParticipation,
                prop.requiredQuorum,
                timeRemaining,
                riskScore,
                action,
                BOUNTY_AMOUNT,
                reasoningHash,
                block.timestamp
            );

            // Emit DefibTriggered standard event
            emit DefibTriggered(proposalId, BOUNTY_AMOUNT);

            return true;
        }

        return false;
    }
}

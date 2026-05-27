// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDAO
 * @dev A lightweight, simple governance mock to store proposal metadata, simulate voting, and monitor quorum targets.
 */
contract MockDAO {
    struct Proposal {
        uint256 id;
        string description;
        uint256 requiredQuorum;       // Quorum percentage (e.g. 20 for 20%)
        uint256 currentParticipation;  // Current participation percentage (e.g. 16 for 16%)
        uint256 deadline;              // Unix timestamp deadline
        bool exists;
        bool incentiveActive;          // True if Defib has activated bounty incentives
        bool executed;
    }

    // Mapping from proposal ID to Proposal struct
    mapping(uint256 => Proposal) public proposals;
    uint256[] public proposalIds;

    // Track authorized editors (like DefibCore)
    address public defibCore;

    event ProposalCreated(
        uint256 indexed id,
        string description,
        uint256 requiredQuorum,
        uint256 currentParticipation,
        uint256 deadline
    );

    event VotesSimulated(
        uint256 indexed id,
        uint256 addedParticipation,
        uint256 newParticipation
    );

    event IncentiveActivated(uint256 indexed id);

    modifier onlyDefibCore() {
        require(msg.sender == defibCore, "MockDAO: Only DefibCore can update incentive status");
        _;
    }

    /**
     * @dev Setup contract. DefibCore will be set post-deployment.
     */
    function setDefibCore(address _defibCore) external {
        require(defibCore == address(0), "MockDAO: DefibCore already set");
        defibCore = _defibCore;
    }

    /**
     * @dev Creates a new mock governance proposal.
     * @param id Unique proposal ID.
     * @param description Brief text description.
     * @param requiredQuorum Percentage threshold required for quorum (e.g. 20 = 20%).
     * @param currentParticipation Initial participation percentage (e.g. 16 = 16%).
     * @param durationInSeconds Seconds from now until the deadline.
     */
    function createProposal(
        uint256 id,
        string calldata description,
        uint256 requiredQuorum,
        uint256 currentParticipation,
        uint256 durationInSeconds
    ) external {
        require(!proposals[id].exists, "MockDAO: Proposal already exists");
        require(requiredQuorum <= 100, "MockDAO: Quorum cannot exceed 100%");
        require(currentParticipation <= 100, "MockDAO: Participation cannot exceed 100%");

        proposals[id] = Proposal({
            id: id,
            description: description,
            requiredQuorum: requiredQuorum,
            currentParticipation: currentParticipation,
            deadline: block.timestamp + durationInSeconds,
            exists: true,
            incentiveActive: false,
            executed: false
        });

        proposalIds.push(id);

        emit ProposalCreated(
            id,
            description,
            requiredQuorum,
            currentParticipation,
            block.timestamp + durationInSeconds
        );
    }

    /**
     * @dev Simulates casting votes by increasing the current participation percentage.
     * @param id Unique proposal ID.
     * @param addedParticipation Percentage points to add to the participation (e.g., 5 = +5%).
     */
    function simulateVotes(uint256 id, uint256 addedParticipation) external {
        require(proposals[id].exists, "MockDAO: Proposal does not exist");
        Proposal storage prop = proposals[id];
        require(block.timestamp < prop.deadline, "MockDAO: Proposal deadline has passed");

        prop.currentParticipation += addedParticipation;
        if (prop.currentParticipation > 100) {
            prop.currentParticipation = 100;
        }

        emit VotesSimulated(id, addedParticipation, prop.currentParticipation);
    }

    /**
     * @dev Allows DefibCore to mark a proposal's incentive as active.
     */
    function setIncentiveActive(uint256 id) external onlyDefibCore {
        require(proposals[id].exists, "MockDAO: Proposal does not exist");
        proposals[id].incentiveActive = true;
        emit IncentiveActivated(id);
    }

    /**
     * @dev External view to read proposal details.
     */
    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(proposals[id].exists, "MockDAO: Proposal does not exist");
        return proposals[id];
    }

    /**
     * @dev Helper to quickly check if a proposal achieved quorum.
     */
    function isQuorumReached(uint256 id) external view returns (bool) {
        require(proposals[id].exists, "MockDAO: Proposal does not exist");
        return proposals[id].currentParticipation >= proposals[id].requiredQuorum;
    }
}

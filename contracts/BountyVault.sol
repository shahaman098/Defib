// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BountyVault
 * @dev Stores incentive reward tokens and manages distribution to voters who participate in rescued proposals.
 */
contract BountyVault {
    IERC20 public immutable token;
    address public defibCore;

    // proposalId => total bounty pool allocated
    mapping(uint256 => uint256) public proposalBounties;

    // proposalId => total bounty claimed so far
    mapping(uint256 => uint256) public proposalClaims;

    // proposalId => (voter => hasClaimed)
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // Standard reward amount per individual voter claim (e.g. 100 DFIB tokens)
    uint256 public constant REWARD_PER_VOTER = 100 * 10 ** 18;

    event BountyRegistered(uint256 indexed proposalId, uint256 amount);
    event BountyClaimed(uint256 indexed proposalId, address indexed voter, uint256 amount);

    modifier onlyDefibCore() {
        require(msg.sender == defibCore, "BountyVault: Only DefibCore can register bounties");
        _;
    }

    constructor(IERC20 _token) {
        require(address(_token) != address(0), "BountyVault: Token address cannot be zero");
        token = _token;
    }

    /**
     * @dev Configures the authorized DefibCore manager.
     */
    function setDefibCore(address _defibCore) external {
        require(defibCore == address(0), "BountyVault: DefibCore already configured");
        require(_defibCore != address(0), "BountyVault: DefibCore address cannot be zero");
        defibCore = _defibCore;
    }

    /**
     * @dev Registers a bounty pool for a proposal flagged with critical risk.
     * Called by DefibCore.
     * @param proposalId The ID of the proposal.
     * @param amount The total DFIB token amount allocated to the bounty pool.
     */
    function registerBounty(uint256 proposalId, uint256 amount) external onlyDefibCore {
        require(proposalBounties[proposalId] == 0, "BountyVault: Bounty pool already exists");
        require(amount >= REWARD_PER_VOTER, "BountyVault: Pool size must be at least REWARD_PER_VOTER");

        proposalBounties[proposalId] = amount;

        emit BountyRegistered(proposalId, amount);
    }

    /**
     * @dev Allows an eligible voter to claim their share of the incentive.
     * For demo purposes, eligibility is simple: any unique address can claim while the bounty pool is funded.
     * @param proposalId The ID of the proposal.
     */
    function claimBounty(uint256 proposalId) external {
        require(proposalBounties[proposalId] > 0, "BountyVault: No bounty active for this proposal");
        require(!hasClaimed[proposalId][msg.sender], "BountyVault: Bounty reward already claimed");
        require(
            proposalClaims[proposalId] + REWARD_PER_VOTER <= proposalBounties[proposalId],
            "BountyVault: All bounty allocation has been claimed"
        );

        hasClaimed[proposalId][msg.sender] = true;
        proposalClaims[proposalId] += REWARD_PER_VOTER;

        require(token.transfer(msg.sender, REWARD_PER_VOTER), "BountyVault: Incentive payout transfer failed");

        emit BountyClaimed(proposalId, msg.sender, REWARD_PER_VOTER);
    }

    /**
     * @dev Read helper to check remaining bounty allocation.
     */
    function getRemainingBounty(uint256 proposalId) external view returns (uint256) {
        if (proposalBounties[proposalId] == 0) return 0;
        return proposalBounties[proposalId] - proposalClaims[proposalId];
    }
}

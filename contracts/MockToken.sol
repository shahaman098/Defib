// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockToken
 * @dev A simple ERC20 token used for DAO participation incentives and gas rewards in the Defib demo.
 */
contract MockToken is ERC20 {
    constructor() ERC20("Defib Mock Token", "DFIB") {
        // Mint initial supply of 1,000,000 DFIB tokens to the deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @dev Mint function to allow easy acquisition of tokens for testing and demo purposes.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

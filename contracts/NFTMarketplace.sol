// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

/// @title NFT Marketplace
/// @author AboveZtars
/* /// @notice 
/// @dev */
contract NFTMarketplace is Initializable,OwnableUpgradeable  {

    function initialize() public initializer {
        __Ownable_init_unchained();
    }
    
}
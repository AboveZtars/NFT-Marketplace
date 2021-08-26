// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

/// @title NFT Marketplace
/// @author AboveZtars
/// @notice 
/// @dev NFT Marketplace is inheriting from OwnableUpgradeable and OwnableUpgradeable is inheriting from Initializable, then NFTMarketplace is Initializable
contract NFTMarketplace is OwnableUpgradeable  {
    uint public fee;
    address public recipient;

    /// @dev Set initial values for our contract
    function initialize(uint _fee, address _recipient) public initializer {
        __Ownable_init();
        fee = _fee;
        recipient=_recipient;
    }
    ///@notice Only the owner can set the fee
    ///@param _fee The fee to be set
    ///@dev Pass the fee from testing script
    function setFee(uint _fee) public onlyOwner {
        fee = _fee;
    }
    ///@notice Only the owner can set the recipient
    ///@param _recipient The recipient to be set
    ///@dev Pass the recipient from testing script
    function setRecipient(address _recipient) public onlyOwner {
        recipient = _recipient;
    }
    
    function sum() pure public returns(uint){
        uint a = 2;
        uint b = 2;
        uint c = SafeMathUpgradeable.add(a,b);
        return c;
    }
}
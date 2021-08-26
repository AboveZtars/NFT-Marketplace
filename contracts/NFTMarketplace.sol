// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/// @title NFT Marketplace
/// @author AboveZtars
/// @notice
/// @dev NFT Marketplace is inheriting from OwnableUpgradeable and OwnableUpgradeable is inheriting from Initializable, then NFTMarketplace is Initializable
contract NFTMarketplace is OwnableUpgradeable {
    uint256 public fee;
    address public recipient;

    /// @dev Set initial values for our contract
    function initialize(uint256 _fee, address _recipient) public initializer {
        __Ownable_init();
        fee = _fee;
        recipient = _recipient;
    }

    ///@notice Only the owner can set the fee
    ///@param _fee The fee to be set
    ///@dev Pass the fee from testing script
    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    ///@notice Only the owner can set the recipient
    ///@param _recipient The recipient to be set
    ///@dev Pass the recipient from testing script
    function setRecipient(address _recipient) public onlyOwner {
        recipient = _recipient;
    }

    function sum() public pure returns (uint256) {
        uint256 a = 2;
        uint256 b = 2;
        uint256 c = SafeMathUpgradeable.add(a, b);
        return c;
    }

    function getLatestPrice(address _pair) public view returns (int256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_pair);
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}

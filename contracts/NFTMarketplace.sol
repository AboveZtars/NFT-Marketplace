// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

/// @title NFT Marketplace
/// @author AboveZtars
/// @notice
/// @dev NFT Marketplace is inheriting from OwnableUpgradeable and OwnableUpgradeable is inheriting from Initializable, then NFTMarketplace is Initializable
contract NFTMarketplace is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    uint256 public fee;
    address public recipient;

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _offerIds; //Keep track of the offers in our market
    CountersUpgradeable.Counter private _offersEnded; // Keep track of the ended offers in our market

    ///VARIABLES
    ///@param offerId The Id of the offer in the marketplace
    ///@param nftContract The address of the nft token
    ///@param tokenId The Id of the nft token
    ///@param _amount The amount of nft token items to sell
    ///@param _deadline The limit date to complete the offer
    ///@param owner The owner of the nft token
    ///@param price The price of the offer
    ///@param offerExist Boolean parameter to know when the offer exist
    struct MarketOffer {
        uint offerId;
        address nftContract;
        uint256 tokenId;
        uint _amount; 
        uint _deadline; 
        address payable owner;
        uint256 price;
        bool offerExist;
    }

    mapping(uint256 => MarketOffer) private idToMarketOffer;

    ///EVENTS
    event ItemOfferCreated (
        uint indexed offerId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint _amount, 
        uint _deadline,
        address payable owner,
        uint256 price,
        bool offerExist
    );

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
            ,
            int256 price,
            ,
            ,
            
        ) = priceFeed.latestRoundData();
        return price;
    }

    /* Places an item for sale on the marketplace */
  function createMarketOffer(
    address _nftContract,
    uint _tokenId, 
    uint _amount, 
    uint _deadline, 
    uint _price
  ) public payable nonReentrant {
    require(_price > 0, "Price must be at least 1 wei");

    _offerIds.increment();
    uint256 offerId = _offerIds.current();

    ///@param offerId The Id of the offer in the marketplace
    ///@param nftContract The address of the nft token
    ///@param tokenId The Id of the nft token
    ///@param _amount The amount of nft token items to sell
    ///@param _deadline The limit date to complete the offer
    ///@param owner The owner of the nft token
    ///@param price The price of the offer
    ///@param offerExist Boolean parameter to know when the offer Exist
  
    idToMarketOffer[offerId] =  MarketOffer(
      offerId,
      _nftContract,
      _tokenId,
      _amount,
      _deadline,
      payable(msg.sender),
      _price,
      true
    );

    emit ItemOfferCreated(
      offerId,
      _nftContract,
      _tokenId,
      _amount,
      _deadline,
      payable(msg.sender),
      _price,
      true
    );
  }

}

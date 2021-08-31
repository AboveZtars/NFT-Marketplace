// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "hardhat/console.sol";

/// @title NFT Marketplace
/// @author AboveZtars
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
    ///@param offerBegin The amount of nft token items to sell
    ///@param _deadline The limit date to complete the offer
    ///@param owner The owner of the nft token
    ///@param price The price of the offer in USD
    ///@param offerExist Boolean parameter to know when the offer exist
    struct MarketOffer {
        uint256 offerId;
        address nftContract;
        uint256 tokenId;
        uint256 _amount;
        uint256 offerBegin;
        uint256 _deadline;
        address payable owner;
        uint256 price;
        bool offerExist;
    }
    ///@dev To track offers
    mapping(uint256 => MarketOffer) private idToMarketOffer;

    ///EVENTS
    event ItemOfferCreated(
        uint256 indexed offerId,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 _amount,
        uint256 offerBegin,
        uint256 _deadline,
        address payable owner,
        uint256 price
    );

    event OfferCanceled(
        bool offerExist
    );

    ///MODIFIERS
    modifier lessthanowned(
        address _nftContract,
        uint256 _tokenId,
        uint256 _amount
    ) {
        require(
            _amount <=
                ERC1155Upgradeable(_nftContract).balanceOf(
                    msg.sender,
                    _tokenId
                ),
            "Amount of tokens must be less or equal to the ones you own"
        );
        _;
    }

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

    ///@notice Latest price of the market 
    ///@param _pair The pair to calculate ETH, DAI or LINK tokens 
    ///@dev Uses Chainlink oracle AggregatorV3Interface to get the price
    function getLatestPrice(address _pair) public view returns (int256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_pair);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /* Places an item for sale on the marketplace */
    function createMarketOffer(
        address _nftContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _deadline,
        uint256 _price
    )
        public
        payable
        nonReentrant
        lessthanowned(_nftContract, _tokenId, _amount)
    {
        require(_price > 0, "Price must be at least 1 Dollar");
        _offerIds.increment();
        uint256 offerId = _offerIds.current();
        uint256 time = block.timestamp;
        uint256 deadlineTime = time + _deadline;

        ///@param offerId The Id of the offer in the marketplace
        ///@param _nftContract The address of the nft token
        ///@param _tokenId The Id of the nft token
        ///@param _amount The amount of nft token items to sell
        ///@param offerBegin The amount of nft token items to sell
        ///@param _deadline The limit date to complete the offer
        ///@param owner The owner of the nft token
        ///@param price The price of the offer in USD
        ///@param offerExist Boolean parameter to know when the offer exist 
        idToMarketOffer[offerId] = MarketOffer(
            offerId,
            _nftContract,
            _tokenId,
            _amount,
            block.timestamp,
            deadlineTime,
            payable(msg.sender),
            _price,
            true
        );
        
        emit ItemOfferCreated(
            idToMarketOffer[offerId].offerId,
            idToMarketOffer[offerId].nftContract,
            idToMarketOffer[offerId].tokenId,
            idToMarketOffer[offerId]._amount,
            idToMarketOffer[offerId].offerBegin,
            idToMarketOffer[offerId]._deadline,
            idToMarketOffer[offerId].owner,
            idToMarketOffer[offerId].price
        );
       
    }

    function cancelOffer(uint _offerId)public {
        require(idToMarketOffer[_offerId].owner == msg.sender,"The offer does not exist");
        require(idToMarketOffer[_offerId].offerExist,"The offer does not exist");

        idToMarketOffer[_offerId].offerExist = false;
        emit OfferCanceled(idToMarketOffer[_offerId].offerExist);
    }

    function acceptOffer(uint _offerId,address _pair) public {
        require(idToMarketOffer[_offerId].offerExist,"The offer does not exist");
        
        address _nftContract = idToMarketOffer[_offerId].nftContract;
        uint _tokenId = idToMarketOffer[_offerId].tokenId;
        uint balanceOfTokens = ERC1155Upgradeable(_nftContract).balanceOf(idToMarketOffer[_offerId].owner,_tokenId);
        uint amount = idToMarketOffer[_offerId]._amount;
        address payable owner = idToMarketOffer[_offerId].owner;
        
        if (balanceOfTokens < amount){
            idToMarketOffer[_offerId].offerExist = false;
            revert("The offer is not available anymore");
        }

        //DAI
        int offerPriceInDAI = getPriceInDAI(_offerId,_pair);
        bool sent = ERC20Upgradeable(0x6B175474E89094C44Da98b954EedeAC495271d0F).transferFrom(msg.sender, owner, uint(offerPriceInDAI));
        require(sent);
        ERC1155Upgradeable(_nftContract).safeTransferFrom(owner,msg.sender,_tokenId, amount,"");
        console.log("The transaction was:",sent);
        //ETHEREUM
        /* int offerPrice = int(idToMarketOffer[_offerId].price);
        int offerPriceInWei = getPriceInWei(offerPrice,_pair); */
        
    }
    //ganadora
    function getPriceInWei(int _offerPrice,address _pair) public view returns(int){
        int ETHPrice = getLatestPrice(_pair);
        int offerPriceInWei = (_offerPrice*10**18/(ETHPrice/10**18));
        return offerPriceInWei;
    }

    function getPriceInDAI(uint _offerId,address _pair) public view returns(int){
        int DAIPrice = getLatestPrice(_pair);
        int offerPriceInDAI =  int(idToMarketOffer[_offerId].price) * DAIPrice;
        return offerPriceInDAI;
    }

    function getOffer(uint256 _offerId)
        public
        view
        returns (MarketOffer memory)
    {
        return idToMarketOffer[_offerId];
    }
}

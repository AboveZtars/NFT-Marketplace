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
    ///@param _deadline The time that will last the offer
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

    event OfferCanceled(bool offerExist);

    event OfferAccepted(bool offerExist,bool sent);

    ///MODIFIERS
    ///@dev Ensure the seller owns NFT tokens
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

    ///@notice Latest price of the market
    ///@param _pair The pair to calculate ETH, DAI or LINK tokens
    ///@dev Uses Chainlink oracle AggregatorV3Interface to get the price
    function getLatestPrice(address _pair) public view returns (int256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_pair);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /* Places an item for sale on the marketplace */
    ///@notice Create an offer 
    ///@param _nftContract The address of the nft token
    ///@param _tokenId The Id of the nft token
    ///@param _amount The amount of nft token items to sell
    ///@param _deadline The time that will last the offer
    ///@param _price The price of the offer in USD
    ///@dev The price in USD is worked in DAI tokens 
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
    ///@notice Cancel an offer 
    ///@param _offerId The Id of the offer
    function cancelOffer(uint256 _offerId) public {
        require(
            idToMarketOffer[_offerId].owner == msg.sender,
            "The offer does not exist"
        );
        require(
            idToMarketOffer[_offerId].offerExist,
            "The offer does not exist"
        );

        idToMarketOffer[_offerId].offerExist = false;
        emit OfferCanceled(idToMarketOffer[_offerId].offerExist);
    }

    ///@notice Accept an offer and pay for it 
    ///@param _offerId The Id of the offer
    ///@param _token The token to pay 
    function acceptOffer(uint256 _offerId, string memory _token)
        public
        payable
        nonReentrant
    {
        //Initial requirements
        require(
            idToMarketOffer[_offerId].offerExist,
            "The offer does not exist"
        );

        address _nftContract = idToMarketOffer[_offerId].nftContract;
        uint256 _tokenId = idToMarketOffer[_offerId].tokenId;
        uint256 balanceOfTokens = ERC1155Upgradeable(_nftContract).balanceOf(
            idToMarketOffer[_offerId].owner,
            _tokenId
        );
        uint256 amount = idToMarketOffer[_offerId]._amount;
        address payable owner = idToMarketOffer[_offerId].owner;

        if (balanceOfTokens < amount || idToMarketOffer[_offerId]._deadline < block.timestamp) {
            idToMarketOffer[_offerId].offerExist = false;
            revert("The offer is not available anymore");
        }

        //DAI
        if (
            keccak256(abi.encodePacked((_token))) ==
            keccak256(abi.encodePacked(("DAI")))
        ) {
            uint256 offerPriceInDAI = getPriceInDAI(_offerId);
            //Implement fee
            uint256 price = offerPriceInDAI;
            uint256 feePrice = SafeMathUpgradeable.div(
                SafeMathUpgradeable.mul(offerPriceInDAI, fee),
                100
            );
            uint256 priceAfterFee = SafeMathUpgradeable.sub(price, feePrice);
            sendFeeDAI(feePrice);

            bool sent = ERC20Upgradeable(
                0x6B175474E89094C44Da98b954EedeAC495271d0F
            ).transferFrom(msg.sender, owner, priceAfterFee);
            require(sent);
            ERC1155Upgradeable(_nftContract).safeTransferFrom(
                owner,
                msg.sender,
                _tokenId,
                amount,
                ""
            );
            idToMarketOffer[_offerId].offerExist = false;
            emit OfferAccepted(idToMarketOffer[_offerId].offerExist, sent);
        }

        //ETHEREUM
        if (
            keccak256(abi.encodePacked((_token))) ==
            keccak256(abi.encodePacked(("ETH")))
        ) {
            uint256 offerPriceInETH = getPriceInETH(_offerId);
            //Implement fee
            uint256 price = offerPriceInETH;
            uint256 feePrice = SafeMathUpgradeable.div(
                SafeMathUpgradeable.mul(offerPriceInETH, fee),
                100
            );
            uint256 priceAfterFee = SafeMathUpgradeable.sub(price, feePrice);
            sendFeeETH(feePrice);

            (bool sent, ) = owner.call{value: priceAfterFee}("");
            require(sent);
            ERC1155Upgradeable(_nftContract).safeTransferFrom(
                owner,
                msg.sender,
                _tokenId,
                amount,
                ""
            );

            ///@dev Return leftovers of ETH 
            (bool success, ) = msg.sender.call{value: address(this).balance}(
                ""
            );
            require(success, "refund failed");
            idToMarketOffer[_offerId].offerExist = false;
            emit OfferAccepted(idToMarketOffer[_offerId].offerExist, sent);
        }

        //LINK
        if (
            keccak256(abi.encodePacked((_token))) ==
            keccak256(abi.encodePacked(("LINK")))
        ) {
            uint256 offerPriceInLINK = getPriceInLINK(_offerId);
            //Implement fee
            uint256 price = offerPriceInLINK;
            uint256 feePrice = SafeMathUpgradeable.div(
                SafeMathUpgradeable.mul(offerPriceInLINK, fee),
                100
            );
            uint256 priceAfterFee = SafeMathUpgradeable.sub(price, feePrice);
            sendFeeLINK(feePrice);

            bool sent = ERC20Upgradeable(
                0x514910771AF9Ca656af840dff83E8264EcF986CA
            ).transferFrom(msg.sender, owner, priceAfterFee);
            require(sent);
            ERC1155Upgradeable(_nftContract).safeTransferFrom(
                owner,
                msg.sender,
                _tokenId,
                amount,
                ""
            );
            idToMarketOffer[_offerId].offerExist = false;
            emit OfferAccepted(idToMarketOffer[_offerId].offerExist, sent);
        }
    }
    ///@notice Get price of the offer in DAI
    ///@dev Notice the units  
    function getPriceInDAI(uint256 _offerId) public view returns (uint256) {
        uint256 offerPriceInDAI = SafeMathUpgradeable.mul(
            uint256(idToMarketOffer[_offerId].price),
            1 * 10**18
        );
        return offerPriceInDAI;
    }
    ///@notice Get price of the offer in ETH
    ///@dev Notice the units  
    function getPriceInETH(uint256 _offerId) public view returns (uint256) {
        address DAIETH = 0x773616E4d11A78F511299002da57A0a94577F1f4;
        uint256 ETHPrice = uint256(getLatestPrice(DAIETH));
        uint256 offerPriceInETH = SafeMathUpgradeable.mul(
            idToMarketOffer[_offerId].price,
            ETHPrice
        );
        return offerPriceInETH;
    }
    ///@notice Get price of the offer in LINK
    ///@dev Notice the units  
    function getPriceInLINK(uint256 _offerId) public view returns (uint256) {
        address LINKETH = 0xDC530D9457755926550b59e8ECcdaE7624181557;
        uint256 LINKPrice = uint256(getLatestPrice(LINKETH));
        uint256 offerPriceInETH = getPriceInETH(_offerId);
        uint256 offerPriceInLINK = SafeMathUpgradeable.mul(
            SafeMathUpgradeable.div((offerPriceInETH), LINKPrice),
            1 * 10**18
        );
        return offerPriceInLINK;
    }
    ///@notice Using this function will send ETH to the recipient
    ///@param _fee The cost of the fee
    function sendFeeETH(uint256 _fee) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        // account[1] of Hardhat node

        (bool sent, ) = recipient.call{value: _fee}("");
        require(sent, "Fee transaction failed");
    }

    ///@notice Using this function will send DAI to the recipient
    function sendFeeDAI(uint256 _fee) public payable {
        bool sent = ERC20Upgradeable(0x6B175474E89094C44Da98b954EedeAC495271d0F)
            .transferFrom(msg.sender, recipient, _fee);
        require(sent, "Fee transaction failed");
    }

    ///@notice Using this function will send LINK to the recipient
    function sendFeeLINK(uint256 _fee) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        // account[1] of Hardhat node

        bool sent = ERC20Upgradeable(0x514910771AF9Ca656af840dff83E8264EcF986CA)
            .transferFrom(msg.sender, recipient, _fee);
        require(sent, "Fee transaction failed");
    }
    ///@dev To receive ETH
    receive() external payable {}
}
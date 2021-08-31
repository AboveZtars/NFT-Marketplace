// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "hardhat/console.sol";

contract NFT is ERC1155 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event idEvent(uint256 indexed newItemId);

    constructor() ERC1155("") {}

    function createToken(address _ownerOfNFT) public {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(_ownerOfNFT, newItemId, 100, "");
        emit idEvent(newItemId);
    }
}

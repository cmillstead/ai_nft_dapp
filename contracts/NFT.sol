// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public owner;
    uint256 public cost;

    mapping(address => uint256[]) private _ownedTokens;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
        cost = _cost;
    }

    function mint(string memory tokenURI) public payable {
        require(
            msg.value >= cost,
            "Insufficient funds"
        );

        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        _ownedTokens[msg.sender].push(newItemId);
    }

    function getTokensOfOwner(address ownerAddress) public view returns (uint256[] memory) {
        return _ownedTokens[ownerAddress];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function withdraw() public {
        require(
            msg.sender == owner,
            "Only owner can withdraw"
        );
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(
            success,
            "Withdrawal failed"
        );
    }
}

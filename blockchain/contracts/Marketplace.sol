// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IHCTokenRead {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isRetired(uint256 tokenId) external view returns (bool);
}

interface IRoleManagerRead {
    function isProducer(address account) external view returns (bool);
    function isBuyer(address account) external view returns (bool);
}

/**
 * @title Marketplace
 * @dev Simple fixed-price listing and purchase of credits
 */
contract Marketplace is AccessControl, ReentrancyGuard {
    bytes32 public constant MARKET_ADMIN_ROLE = keccak256("MARKET_ADMIN_ROLE");

    struct Listing {
        address seller;
        uint256 priceWei; // price per token in wei
        bool active;
    }

    IHCTokenRead public token;
    IRoleManagerRead public roles;

    mapping(uint256 => Listing) public listings; // tokenId -> listing

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event Unlisted(uint256 indexed tokenId, address indexed seller);
    event Purchased(uint256 indexed tokenId, address indexed from, address indexed to, uint256 priceWei);

    constructor(address admin, address tokenAddress, address roleManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ADMIN_ROLE, admin);
        token = IHCTokenRead(tokenAddress);
        roles = IRoleManagerRead(roleManager);
    }

    function list(uint256 tokenId, uint256 priceWei) external {
        require(roles.isProducer(msg.sender), "Only producers can list");
        require(token.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!token.isRetired(tokenId), "Token retired");
        require(priceWei > 0, "Invalid price");
        listings[tokenId] = Listing({ seller: msg.sender, priceWei: priceWei, active: true });
        emit Listed(tokenId, msg.sender, priceWei);
    }

    function unlist(uint256 tokenId) external {
        Listing storage l = listings[tokenId];
        require(l.active, "Not listed");
        require(l.seller == msg.sender, "Not seller");
        l.active = false;
        emit Unlisted(tokenId, msg.sender);
    }

    function purchase(uint256 tokenId) external payable nonReentrant {
        Listing storage l = listings[tokenId];
        require(l.active, "Not listed");
        require(roles.isBuyer(msg.sender), "Only buyers can purchase");
        require(msg.value == l.priceWei, "Incorrect value");
        address seller = l.seller;
        l.active = false;
        // Transfer ETH to seller
        (bool sent, ) = seller.call{value: msg.value}("");
        require(sent, "Payment failed");
        // Token transfer is expected to be performed off-contract by front-end via token.safeTransferFrom
        emit Purchased(tokenId, seller, msg.sender, l.priceWei);
    }
}


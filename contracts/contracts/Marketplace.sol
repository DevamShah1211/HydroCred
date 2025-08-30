// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IHydroCredToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IRoleManager2 {
    function PRODUCER_ROLE() external view returns (bytes32);
    function hasRole(bytes32 role, address account) external view returns (bool);
}

contract Marketplace is ReentrancyGuard {
    struct Listing {
        uint256 id;
        address seller;
        uint256 amount; // tokens available
        uint256 pricePerTokenWei; // in wei per token
        bool active;
    }

    IHydroCredToken public immutable token;
    IRoleManager2 public immutable roleManager;

    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address indexed seller, uint256 amount, uint256 pricePerTokenWei);
    event Purchased(uint256 indexed id, address indexed buyer, uint256 amount, uint256 value);
    event Delisted(uint256 indexed id);

    constructor(address tokenAddress, address roleManagerAddress) {
        token = IHydroCredToken(tokenAddress);
        roleManager = IRoleManager2(roleManagerAddress);
    }

    function createListing(uint256 amount, uint256 pricePerTokenWei) external nonReentrant {
        require(amount > 0, "Amount = 0");
        require(pricePerTokenWei > 0, "Price = 0");
        require(roleManager.hasRole(roleManager.PRODUCER_ROLE(), msg.sender), "Only producer");

        // Escrow the tokens in the marketplace
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "TransferFrom failed");

        uint256 id = nextListingId++;
        listings[id] = Listing({ id: id, seller: msg.sender, amount: amount, pricePerTokenWei: pricePerTokenWei, active: true });
        emit Listed(id, msg.sender, amount, pricePerTokenWei);
    }

    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive");
        require(amount > 0 && amount <= l.amount, "Invalid amount");

        uint256 totalPrice = amount * l.pricePerTokenWei;
        require(msg.value == totalPrice, "Incorrect ETH sent");

        l.amount -= amount;
        if (l.amount == 0) {
            l.active = false;
            emit Delisted(listingId);
        }

        // Payout seller
        (bool sent, ) = payable(l.seller).call{value: totalPrice}("");
        require(sent, "Payout failed");

        // Transfer tokens to buyer
        bool ok = token.transfer(msg.sender, amount);
        require(ok, "Token transfer failed");

        emit Purchased(listingId, msg.sender, amount, totalPrice);
    }

    function delist(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive");
        require(l.seller == msg.sender, "Not seller");

        l.active = false;
        uint256 remaining = l.amount;
        l.amount = 0;

        bool ok = token.transfer(msg.sender, remaining);
        require(ok, "Return transfer failed");

        emit Delisted(listingId);
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IHCToken {
    function grantMinter(address minter) external;
    function revokeMinter(address minter) external;
    function batchIssueFromRegistry(address to, uint256 amount) external;
}

interface IRoleManager {
    function isProducer(address account) external view returns (bool);
    function isCityAdmin(address account) external view returns (bool);
}

/**
 * @title CertificationRegistry
 * @dev Records producer requests and city admin certifications; mints via token
 */
contract CertificationRegistry is AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    struct ProductionRequest {
        address producer;
        bytes32 dataHash; // hash of production data/proof
        uint256 amount; // number of credits (kg)
        bool certified;
        address certifiedBy;
        uint256 certifiedAt;
    }

    mapping(bytes32 => ProductionRequest) public requests; // keyed by dataHash
    mapping(bytes32 => bool) public processed; // prevent double certification

    IHCToken public token;
    IRoleManager public roles;

    event RequestSubmitted(address indexed producer, bytes32 indexed dataHash, uint256 amount);
    event RequestCertified(address indexed producer, bytes32 indexed dataHash, uint256 amount, address indexed certifier);

    constructor(address admin, address tokenAddress, address roleManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        token = IHCToken(tokenAddress);
        roles = IRoleManager(roleManager);
    }

    function submitRequest(bytes32 dataHash, uint256 amount) external {
        require(roles.isProducer(msg.sender), "Only producers can submit");
        require(amount > 0 && amount <= 1000, "Invalid amount");
        require(requests[dataHash].producer == address(0), "Request exists");

        requests[dataHash] = ProductionRequest({
            producer: msg.sender,
            dataHash: dataHash,
            amount: amount,
            certified: false,
            certifiedBy: address(0),
            certifiedAt: 0
        });

        emit RequestSubmitted(msg.sender, dataHash, amount);
    }

    function certifyAndMint(bytes32 dataHash) external {
        require(roles.isCityAdmin(msg.sender), "Only city admin can certify");
        ProductionRequest storage req = requests[dataHash];
        require(req.producer != address(0), "Request not found");
        require(!req.certified, "Already certified");
        require(!processed[dataHash], "Already processed");

        req.certified = true;
        req.certifiedBy = msg.sender;
        req.certifiedAt = block.timestamp;
        processed[dataHash] = true;

        // Mint tokens to producer through the token contract with registry authority
        token.batchIssueFromRegistry(req.producer, req.amount);

        emit RequestCertified(req.producer, dataHash, req.amount, msg.sender);
    }
}


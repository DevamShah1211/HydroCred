// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IRoleManager {
    function CITY_ADMIN_ROLE() external view returns (bytes32);
    function PRODUCER_ROLE() external view returns (bytes32);
    function hasRole(bytes32 role, address account) external view returns (bool);
}

contract HydroCredToken is ERC20, ERC20Burnable, EIP712 {
    IRoleManager public immutable roleManager;

    // Prevent double minting using the same certification
    mapping(bytes32 => bool) public usedCertifications;

    event CertifiedMintClaimed(
        address indexed producer,
        address indexed certifier,
        uint256 requestId,
        uint256 amount
    );

    event CreditsRetired(address indexed account, uint256 amount, string reason);

    struct Certification {
        address producer;
        uint256 amount; // tokens to mint; 1 token = 1 kg
        uint256 requestId; // off-chain request identifier
        uint256 expiry; // unix timestamp
        address certifier; // city admin address
    }

    // keccak256("Certification(address producer,uint256 amount,uint256 requestId,uint256 expiry,address certifier)")
    bytes32 public constant CERTIFICATION_TYPEHASH = keccak256(
        "Certification(address producer,uint256 amount,uint256 requestId,uint256 expiry,address certifier)"
    );

    constructor(address _roleManager)
        ERC20("HydroCred", "H2")
        EIP712("HydroCred", "1")
    {
        roleManager = IRoleManager(_roleManager);
    }

    function _hashCertification(Certification memory c) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                CERTIFICATION_TYPEHASH,
                c.producer,
                c.amount,
                c.requestId,
                c.expiry,
                c.certifier
            )
        );
        return _hashTypedDataV4(structHash);
    }

    // Producer-only mint with City Admin certification signature
    function claimMint(Certification calldata c, bytes calldata signature) external {
        require(msg.sender == c.producer, "Only producer can claim");
        require(block.timestamp <= c.expiry, "Certification expired");

        bytes32 digest = _hashCertification(c);
        require(!usedCertifications[digest], "Certification already used");

        address signer = ECDSA.recover(digest, signature);
        require(signer == c.certifier, "Bad certifier signature");
        require(roleManager.hasRole(roleManager.CITY_ADMIN_ROLE(), signer), "Signer not city admin");
        require(roleManager.hasRole(roleManager.PRODUCER_ROLE(), c.producer), "Producer not approved");

        usedCertifications[digest] = true;
        _mint(c.producer, c.amount);
        emit CertifiedMintClaimed(c.producer, signer, c.requestId, c.amount);
    }

    // Burn credits for compliance; emits reason for auditors
    function retire(uint256 amount, string calldata reason) external {
        _burn(msg.sender, amount);
        emit CreditsRetired(msg.sender, amount, reason);
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract RoleManager is AccessControl {
    bytes32 public constant COUNTRY_ADMIN_ROLE = keccak256("COUNTRY_ADMIN");
    bytes32 public constant STATE_ADMIN_ROLE = keccak256("STATE_ADMIN");
    bytes32 public constant CITY_ADMIN_ROLE = keccak256("CITY_ADMIN");
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR");

    event RoleRequested(address indexed account, bytes32 indexed role);
    event RoleApproved(address indexed account, bytes32 indexed role, address indexed approver);

    constructor(address initialCountryAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialCountryAdmin);
        _grantRole(COUNTRY_ADMIN_ROLE, initialCountryAdmin);
    }

    // Requests are off-chain persisted; this event is for indexers/auditors
    function requestRole(bytes32 role) external {
        emit RoleRequested(msg.sender, role);
    }

    function approveStateAdmin(address account) external onlyRole(COUNTRY_ADMIN_ROLE) {
        _grantRole(STATE_ADMIN_ROLE, account);
        emit RoleApproved(account, STATE_ADMIN_ROLE, msg.sender);
    }

    function approveCityAdmin(address account) external {
        require(
            hasRole(STATE_ADMIN_ROLE, msg.sender) || hasRole(COUNTRY_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _grantRole(CITY_ADMIN_ROLE, account);
        emit RoleApproved(account, CITY_ADMIN_ROLE, msg.sender);
    }

    function approveProducer(address account) external onlyRole(CITY_ADMIN_ROLE) {
        _grantRole(PRODUCER_ROLE, account);
        emit RoleApproved(account, PRODUCER_ROLE, msg.sender);
    }

    function approveBuyer(address account) external {
        require(
            hasRole(CITY_ADMIN_ROLE, msg.sender) || hasRole(STATE_ADMIN_ROLE, msg.sender) || hasRole(COUNTRY_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _grantRole(BUYER_ROLE, account);
        emit RoleApproved(account, BUYER_ROLE, msg.sender);
    }

    function approveAuditor(address account) external onlyRole(COUNTRY_ADMIN_ROLE) {
        _grantRole(AUDITOR_ROLE, account);
        emit RoleApproved(account, AUDITOR_ROLE, msg.sender);
    }

    function isProducer(address account) external view returns (bool) {
        return hasRole(PRODUCER_ROLE, account);
    }

    function isCityAdmin(address account) external view returns (bool) {
        return hasRole(CITY_ADMIN_ROLE, account);
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(COUNTRY_ADMIN_ROLE, account) || hasRole(STATE_ADMIN_ROLE, account) || hasRole(CITY_ADMIN_ROLE, account);
    }
}


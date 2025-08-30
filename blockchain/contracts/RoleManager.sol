// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RoleManager
 * @dev Manages hierarchical roles for HydroCred
 */
contract RoleManager is AccessControl {
    bytes32 public constant COUNTRY_ADMIN_ROLE = keccak256("COUNTRY_ADMIN_ROLE");
    bytes32 public constant STATE_ADMIN_ROLE = keccak256("STATE_ADMIN_ROLE");
    bytes32 public constant CITY_ADMIN_ROLE = keccak256("CITY_ADMIN_ROLE");
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    event StateAdminAdded(address indexed account, address indexed by);
    event CityAdminAdded(address indexed account, address indexed by);
    event ProducerAdded(address indexed account, address indexed by);
    event BuyerAdded(address indexed account, address indexed by);
    event AuditorAdded(address indexed account, address indexed by);

    constructor(address countryAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, countryAdmin);
        _grantRole(COUNTRY_ADMIN_ROLE, countryAdmin);
    }

    // Country Admin -> State Admin
    function addStateAdmin(address account) external onlyRole(COUNTRY_ADMIN_ROLE) {
        _grantRole(STATE_ADMIN_ROLE, account);
        emit StateAdminAdded(account, msg.sender);
    }

    // State Admin -> City Admin
    function addCityAdmin(address account) external onlyRole(STATE_ADMIN_ROLE) {
        _grantRole(CITY_ADMIN_ROLE, account);
        emit CityAdminAdded(account, msg.sender);
    }

    // City Admin -> Producer
    function addProducer(address account) external onlyRole(CITY_ADMIN_ROLE) {
        _grantRole(PRODUCER_ROLE, account);
        emit ProducerAdded(account, msg.sender);
    }

    // City Admin -> Buyer (or allow self-register via UI + approval)
    function addBuyer(address account) external onlyRole(CITY_ADMIN_ROLE) {
        _grantRole(BUYER_ROLE, account);
        emit BuyerAdded(account, msg.sender);
    }

    // Country Admin -> Auditor
    function addAuditor(address account) external onlyRole(COUNTRY_ADMIN_ROLE) {
        _grantRole(AUDITOR_ROLE, account);
        emit AuditorAdded(account, msg.sender);
    }

    // Views
    function isProducer(address account) external view returns (bool) {
        return hasRole(PRODUCER_ROLE, account);
    }

    function isBuyer(address account) external view returns (bool) {
        return hasRole(BUYER_ROLE, account);
    }

    function isCityAdmin(address account) external view returns (bool) {
        return hasRole(CITY_ADMIN_ROLE, account);
    }

    function isStateAdmin(address account) external view returns (bool) {
        return hasRole(STATE_ADMIN_ROLE, account);
    }

    function isCountryAdmin(address account) external view returns (bool) {
        return hasRole(COUNTRY_ADMIN_ROLE, account);
    }
}


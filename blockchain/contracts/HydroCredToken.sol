// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HydroCredToken
 * @dev ERC721 token representing green hydrogen credits with hierarchical approval system
 * Each token represents 1 verified unit of green hydrogen production
 */
contract HydroCredToken is ERC721, ERC721Enumerable, AccessControl, Pausable {
    bytes32 public constant STATE_ADMIN_ROLE = keccak256("STATE_ADMIN_ROLE");
    
    uint256 private _nextTokenId = 1;
    uint256 private _nextRequestId = 1;
    
    // Main Admin (India-level) - only one wallet address
    address public mainAdmin;
    
    // Mappings for state-aware system
    mapping(address => string) public producerState;
    mapping(address => string) public producerCity;
    mapping(string => address) public stateAdmin;
    mapping(address => bool) public verifiedProducers;
    mapping(uint256 => TokenRequest) public tokenRequests;
    mapping(address => uint256[]) public producerRequests;
    
    // Struct for token requests
    struct TokenRequest {
        uint256 requestId;
        address producer;
        uint256 amount;
        string state;
        uint256 timestamp;
        bool approved;
        bool processed;
    }
    
    // Events
    event StateAdminAssigned(string indexed state, address indexed admin, address indexed assignedBy);
    event ProducerRegistered(address indexed producer, string state, string city);
    event TokenRequested(uint256 indexed requestId, address indexed producer, uint256 amount, string state);
    event RequestApproved(uint256 indexed requestId, address indexed producer, uint256 amount, string state);
    event TokensIssued(address indexed to, uint256 amount, uint256 fromId, uint256 toId);
    event TokenSold(address indexed from, address indexed to, uint256 indexed tokenId);
    event CreditRetired(address indexed owner, uint256 indexed tokenId, uint256 timestamp);
    
    // Modifiers
    modifier onlyMainAdmin() {
        require(msg.sender == mainAdmin, "Only Main Admin can call this function");
        _;
    }
    
    modifier onlyStateAdmin(string memory _state) {
        require(stateAdmin[_state] == msg.sender, "Only State Admin for this state can call this function");
        _;
    }
    
    modifier onlyVerifiedProducer() {
        require(verifiedProducers[msg.sender], "Only verified producers can call this function");
        _;
    }
    
    modifier producerRegistered() {
        require(bytes(producerState[msg.sender]).length > 0, "Producer must register state and city first");
        _;
    }

    constructor(address _mainAdmin) ERC721("HydroCred Token", "HCT") {
        require(_mainAdmin != address(0), "Main admin cannot be zero address");
        mainAdmin = _mainAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, _mainAdmin);
        _grantRole(STATE_ADMIN_ROLE, _mainAdmin);
    }

    /**
     * @dev Assign a State Admin for a specific state (only Main Admin)
     * @param _admin Address of the new state admin
     * @param _state State name
     */
    function assignStateAdmin(address _admin, string memory _state) 
        public 
        onlyMainAdmin 
        whenNotPaused 
    {
        require(_admin != address(0), "Cannot assign zero address as state admin");
        require(bytes(_state).length > 0, "State name cannot be empty");
        require(stateAdmin[_state] == address(0), "State admin already assigned for this state");
        
        stateAdmin[_state] = _admin;
        _grantRole(STATE_ADMIN_ROLE, _admin);
        
        emit StateAdminAssigned(_state, _admin, msg.sender);
    }

    /**
     * @dev Register a producer with state and city (after wallet connection)
     * @param _state State name
     * @param _city City name (optional but stored)
     */
    function registerProducer(string memory _state, string memory _city) 
        public 
        whenNotPaused 
    {
        require(bytes(_state).length > 0, "State name cannot be empty");
        require(bytes(producerState[msg.sender]).length == 0, "Producer already registered");
        require(stateAdmin[_state] != address(0), "No state admin assigned for this state");
        
        producerState[msg.sender] = _state;
        producerCity[msg.sender] = _city;
        
        emit ProducerRegistered(msg.sender, _state, _city);
    }

    /**
     * @dev Request tokens from State Admin (only registered producers)
     * @param _amount Number of tokens requested
     */
    function requestTokens(uint256 _amount) 
        public 
        producerRegistered 
        whenNotPaused 
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= 1000, "Cannot request more than 1000 tokens at once");
        
        string memory state = producerState[msg.sender];
        
        TokenRequest memory newRequest = TokenRequest({
            requestId: _nextRequestId,
            producer: msg.sender,
            amount: _amount,
            state: state,
            timestamp: block.timestamp,
            approved: false,
            processed: false
        });
        
        tokenRequests[_nextRequestId] = newRequest;
        producerRequests[msg.sender].push(_nextRequestId);
        
        emit TokenRequested(_nextRequestId, msg.sender, _amount, state);
        _nextRequestId++;
    }

    /**
     * @dev Approve a token request (only State Admin of that state)
     * @param _requestId ID of the request to approve
     */
    function approveRequest(uint256 _requestId) 
        public 
        whenNotPaused 
    {
        TokenRequest storage request = tokenRequests[_requestId];
        require(request.producer != address(0), "Request does not exist");
        require(!request.processed, "Request already processed");
        require(!request.approved, "Request already approved");
        
        // Check if caller is the State Admin for this request's state
        require(stateAdmin[request.state] == msg.sender, "Only State Admin for this state can approve");
        
        request.approved = true;
        request.processed = true;
        
        // Mark producer as verified
        verifiedProducers[request.producer] = true;
        
        // Issue tokens
        uint256 fromId = _nextTokenId;
        uint256 toId = _nextTokenId + request.amount - 1;
        
        for (uint256 i = 0; i < request.amount; i++) {
            _safeMint(request.producer, _nextTokenId);
            _nextTokenId++;
        }
        
        emit RequestApproved(_requestId, request.producer, request.amount, request.state);
        emit TokensIssued(request.producer, request.amount, fromId, toId);
    }

    /**
     * @dev Sell token to buyer (only verified producers)
     * @param _buyer Address of the buyer
     * @param _tokenId Token ID to sell
     */
    function sellToken(address _buyer, uint256 _tokenId) 
        public 
        onlyVerifiedProducer 
        whenNotPaused 
    {
        require(_buyer != address(0), "Cannot sell to zero address");
        require(_ownerOf(_tokenId) == msg.sender, "Only owner can sell token");
        require(!isRetired[_tokenId], "Cannot sell retired token");
        
        _transfer(msg.sender, _buyer, _tokenId);
        
        emit TokenSold(msg.sender, _buyer, _tokenId);
    }

    /**
     * @dev Check if an address is a verified producer
     * @param _producer Address to check
     * @return True if verified producer
     */
    function isVerifiedProducer(address _producer) public view returns (bool) {
        return verifiedProducers[_producer];
    }

    /**
     * @dev Get producer's state and city
     * @param _producer Address of the producer
     * @return state and city
     */
    function getProducerInfo(address _producer) public view returns (string memory state, string memory city) {
        return (producerState[_producer], producerCity[_producer]);
    }

    /**
     * @dev Get all requests for a producer
     * @param _producer Address of the producer
     * @return Array of request IDs
     */
    function getProducerRequests(address _producer) public view returns (uint256[] memory) {
        return producerRequests[_producer];
    }

    /**
     * @dev Get all pending requests for a state
     * @param _state State name
     * @return Array of request IDs
     */
    function getPendingRequestsForState(string memory _state) public view returns (uint256[] memory) {
        uint256[] memory pendingRequests = new uint256[](_nextRequestId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < _nextRequestId; i++) {
            TokenRequest memory request = tokenRequests[i];
            if (keccak256(bytes(request.state)) == keccak256(bytes(_state)) && 
                !request.processed) {
                pendingRequests[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingRequests[i];
        }
        
        return result;
    }

    /**
     * @dev Get request details
     * @param _requestId Request ID
     * @return producer Producer address
     * @return amount Token amount requested
     * @return state State name
     * @return timestamp Request timestamp
     * @return approved Approval status
     * @return processed Processing status
     */
    function getRequestDetails(uint256 _requestId) public view returns (
        address producer,
        uint256 amount,
        string memory state,
        uint256 timestamp,
        bool approved,
        bool processed
    ) {
        TokenRequest memory request = tokenRequests[_requestId];
        return (
            request.producer,
            request.amount,
            request.state,
            request.timestamp,
            request.approved,
            request.processed
        );
    }

    // Legacy functions for backward compatibility
    mapping(uint256 => bool) public isRetired;
    mapping(uint256 => address) public retiredBy;
    mapping(uint256 => uint256) public retiredAt;

    /**
     * @dev Retire a credit (makes it non-transferable)
     * @param tokenId The token ID to retire
     */
    function retire(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender, "Only owner can retire credit");
        require(!isRetired[tokenId], "Credit already retired");
        
        isRetired[tokenId] = true;
        retiredBy[tokenId] = msg.sender;
        retiredAt[tokenId] = block.timestamp;
        
        emit CreditRetired(msg.sender, tokenId, block.timestamp);
    }

    /**
     * @dev Pause contract (only Main Admin)
     */
    function pause() public onlyMainAdmin {
        _pause();
    }

    /**
     * @dev Unpause contract (only Main Admin)
     */
    function unpause() public onlyMainAdmin {
        _unpause();
    }

    /**
     * @dev Update main admin (only current main admin)
     * @param _newAdmin New main admin address
     */
    function updateMainAdmin(address _newAdmin) public onlyMainAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        require(_newAdmin != mainAdmin, "New admin same as current");
        
        // Revoke roles from current admin
        _revokeRole(DEFAULT_ADMIN_ROLE, mainAdmin);
        _revokeRole(STATE_ADMIN_ROLE, mainAdmin);
        
        // Grant roles to new admin
        _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
        _grantRole(STATE_ADMIN_ROLE, _newAdmin);
        
        mainAdmin = _newAdmin;
    }

    // Required overrides for OpenZeppelin v5
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
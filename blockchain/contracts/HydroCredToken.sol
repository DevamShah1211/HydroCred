// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HydroCredToken
 * @dev ERC-20 token representing green hydrogen credits
 * Each token represents 1 kg of certified green hydrogen
 * Implements role-based access control with hierarchical admin system
 */
contract HydroCredToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant COUNTRY_ADMIN_ROLE = keccak256("COUNTRY_ADMIN_ROLE");
    bytes32 public constant STATE_ADMIN_ROLE = keccak256("STATE_ADMIN_ROLE");
    bytes32 public constant CITY_ADMIN_ROLE = keccak256("CITY_ADMIN_ROLE");
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Structs
    struct ProductionRequest {
        uint256 requestId;
        address producer;
        uint256 amount;
        string proofHash;
        uint256 timestamp;
        bool certified;
        address certifiedBy;
        uint256 certifiedAt;
        bool tokensMinted;
    }

    struct CreditSale {
        uint256 saleId;
        address seller;
        uint256 amount;
        uint256 price;
        bool active;
        uint256 timestamp;
    }

    // State variables
    uint256 public nextRequestId = 1;
    uint256 public nextSaleId = 1;
    uint256 public totalRetiredCredits = 0;
    
    // Mappings
    mapping(uint256 => ProductionRequest) public productionRequests;
    mapping(uint256 => CreditSale) public creditSales;
    mapping(address => uint256[]) public producerRequests;
    mapping(address => uint256[]) public userSales;
    mapping(address => uint256) public retiredCredits;
    mapping(address => bool) public isProducer;
    mapping(address => bool) public isBuyer;
    mapping(address => bool) public isAuditor;

    // Events
    event ProductionRequestSubmitted(
        uint256 indexed requestId,
        address indexed producer,
        uint256 amount,
        string proofHash,
        uint256 timestamp
    );
    
    event ProductionCertified(
        uint256 indexed requestId,
        address indexed producer,
        uint256 amount,
        address indexed certifier,
        uint256 timestamp
    );
    
    event TokensMinted(
        uint256 indexed requestId,
        address indexed producer,
        uint256 amount,
        uint256 timestamp
    );
    
    event CreditsListed(
        uint256 indexed saleId,
        address indexed seller,
        uint256 amount,
        uint256 price,
        uint256 timestamp
    );
    
    event CreditsSold(
        uint256 indexed saleId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 timestamp
    );
    
    event CreditsRetired(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );
    
    event RoleGranted(
        address indexed user,
        bytes32 indexed role,
        address indexed grantedBy
    );

    // Modifiers
    modifier onlyProducer() {
        require(isProducer[msg.sender], "Only producers can call this function");
        _;
    }

    modifier onlyBuyer() {
        require(isBuyer[msg.sender], "Only buyers can call this function");
        _;
    }

    modifier onlyCertifier() {
        require(
            hasRole(CITY_ADMIN_ROLE, msg.sender) ||
            hasRole(STATE_ADMIN_ROLE, msg.sender) ||
            hasRole(COUNTRY_ADMIN_ROLE, msg.sender),
            "Only certifiers can call this function"
        );
        _;
    }

    modifier onlyHigherAdmin(bytes32 role) {
        if (role == STATE_ADMIN_ROLE) {
            require(hasRole(COUNTRY_ADMIN_ROLE, msg.sender), "Only country admin can appoint state admin");
        } else if (role == CITY_ADMIN_ROLE) {
            require(
                hasRole(STATE_ADMIN_ROLE, msg.sender) || hasRole(COUNTRY_ADMIN_ROLE, msg.sender),
                "Only state or country admin can appoint city admin"
            );
        }
        _;
    }

    constructor() ERC20("HydroCred Token", "H2CRED") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COUNTRY_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Submit a production request for certification
     * @param amount Amount of hydrogen produced in kg
     * @param proofHash Hash of the production proof document
     */
    function submitProductionRequest(uint256 amount, string calldata proofHash) 
        external 
        onlyProducer 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(proofHash).length > 0, "Proof hash cannot be empty");

        uint256 requestId = nextRequestId++;
        
        productionRequests[requestId] = ProductionRequest({
            requestId: requestId,
            producer: msg.sender,
            amount: amount,
            proofHash: proofHash,
            timestamp: block.timestamp,
            certified: false,
            certifiedBy: address(0),
            certifiedAt: 0,
            tokensMinted: false
        });

        producerRequests[msg.sender].push(requestId);
        
        emit ProductionRequestSubmitted(requestId, msg.sender, amount, proofHash, block.timestamp);
    }

    /**
     * @dev Certify a production request (only certifiers)
     * @param requestId ID of the production request
     */
    function certifyProduction(uint256 requestId) 
        external 
        onlyCertifier 
        whenNotPaused 
    {
        ProductionRequest storage request = productionRequests[requestId];
        require(request.producer != address(0), "Request does not exist");
        require(!request.certified, "Request already certified");
        require(!request.tokensMinted, "Tokens already minted");

        request.certified = true;
        request.certifiedBy = msg.sender;
        request.certifiedAt = block.timestamp;

        emit ProductionCertified(
            requestId, 
            request.producer, 
            request.amount, 
            msg.sender, 
            block.timestamp
        );
    }

    /**
     * @dev Mint tokens for a certified production request
     * @param requestId ID of the certified production request
     */
    function mintTokensForCertifiedProduction(uint256 requestId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        ProductionRequest storage request = productionRequests[requestId];
        require(request.producer != address(0), "Request does not exist");
        require(request.certified, "Request not certified");
        require(!request.tokensMinted, "Tokens already minted");
        require(msg.sender == request.producer, "Only producer can mint tokens");

        request.tokensMinted = true;
        _mint(request.producer, request.amount * 10**decimals());

        emit TokensMinted(
            requestId, 
            request.producer, 
            request.amount, 
            block.timestamp
        );
    }

    /**
     * @dev List credits for sale
     * @param amount Amount of credits to sell
     * @param price Price per credit in wei
     */
    function listCreditsForSale(uint256 amount, uint256 price) 
        external 
        onlyProducer 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");

        uint256 saleId = nextSaleId++;
        
        creditSales[saleId] = CreditSale({
            saleId: saleId,
            seller: msg.sender,
            amount: amount,
            price: price,
            active: true,
            timestamp: block.timestamp
        });

        userSales[msg.sender].push(saleId);
        
        emit CreditsListed(saleId, msg.sender, amount, price, block.timestamp);
    }

    /**
     * @dev Purchase credits from a sale
     * @param saleId ID of the sale to purchase from
     */
    function purchaseCredits(uint256 saleId) 
        external 
        payable 
        onlyBuyer 
        whenNotPaused 
        nonReentrant 
    {
        CreditSale storage sale = creditSales[saleId];
        require(sale.seller != address(0), "Sale does not exist");
        require(sale.active, "Sale is not active");
        require(msg.value == sale.amount * sale.price, "Incorrect payment amount");
        require(sale.seller != msg.sender, "Cannot buy from yourself");

        // Transfer credits
        uint256 creditAmount = sale.amount * 10**decimals();
        _transfer(sale.seller, msg.sender, creditAmount);
        
        // Transfer payment to seller
        payable(sale.seller).transfer(msg.value);
        
        // Mark sale as inactive
        sale.active = false;

        emit CreditsSold(
            saleId, 
            sale.seller, 
            msg.sender, 
            sale.amount, 
            sale.price, 
            block.timestamp
        );
    }

    /**
     * @dev Retire credits (permanent, non-transferable)
     * @param amount Amount of credits to retire
     */
    function retireCredits(uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");

        uint256 creditAmount = amount * 10**decimals();
        _burn(msg.sender, creditAmount);
        
        retiredCredits[msg.sender] += amount;
        totalRetiredCredits += amount;

        emit CreditsRetired(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Grant role to user (only higher level admins)
     * @param user Address to grant role to
     * @param role Role to grant
     */
    function grantRole(bytes32 role, address user) 
        public 
        override 
        onlyHigherAdmin(role) 
    {
        super.grantRole(role, user);
        
        // Set additional flags based on role
        if (role == PRODUCER_ROLE) {
            isProducer[user] = true;
        } else if (role == BUYER_ROLE) {
            isBuyer[user] = true;
        } else if (role == AUDITOR_ROLE) {
            isAuditor[user] = true;
        }
        
        emit RoleGranted(user, role, msg.sender);
    }

    /**
     * @dev Revoke role from user
     * @param role Role to revoke
     * @param user Address to revoke role from
     */
    function revokeRole(bytes32 role, address user) 
        public 
        override 
    {
        super.revokeRole(role, user);
        
        // Clear additional flags based on role
        if (role == PRODUCER_ROLE) {
            isProducer[user] = false;
        } else if (role == BUYER_ROLE) {
            isBuyer[user] = false;
        } else if (role == AUDITOR_ROLE) {
            isAuditor[user] = false;
        }
    }

    /**
     * @dev Get production requests for a producer
     * @param producer Address of the producer
     * @return Array of request IDs
     */
    function getProducerRequests(address producer) external view returns (uint256[] memory) {
        return producerRequests[producer];
    }

    /**
     * @dev Get sales for a user
     * @param user Address of the user
     * @return Array of sale IDs
     */
    function getUserSales(address user) external view returns (uint256[] memory) {
        return userSales[user];
    }

    /**
     * @dev Get active sales
     * @return Array of active sale IDs
     */
    function getActiveSales() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextSaleId; i++) {
            if (creditSales[i].active) {
                activeCount++;
            }
        }
        
        uint256[] memory activeSales = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < nextSaleId; i++) {
            if (creditSales[i].active) {
                activeSales[index] = i;
                index++;
            }
        }
        
        return activeSales;
    }

    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to prevent retired credits from being transferred
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._transfer(from, to, amount);
    }

    /**
     * @dev Override mint to prevent direct minting (only through certified production)
     */
    function mint(address to, uint256 amount) external pure {
        revert("Direct minting not allowed. Use certified production flow.");
    }
}
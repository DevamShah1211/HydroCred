// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title H2Token
 * @dev ERC20 token representing green hydrogen credits
 * Each token represents 1 kg of certified green hydrogen
 */
contract H2Token is ERC20, AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant COUNTRY_ADMIN_ROLE = keccak256("COUNTRY_ADMIN_ROLE");
    bytes32 public constant STATE_ADMIN_ROLE = keccak256("STATE_ADMIN_ROLE");
    bytes32 public constant CITY_ADMIN_ROLE = keccak256("CITY_ADMIN_ROLE");
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Certification tracking
    struct ProductionRequest {
        address producer;
        uint256 amount;
        string productionData;
        string proofHash;
        address certifier;
        bool certified;
        uint256 timestamp;
        bool minted;
    }

    // Credit retirement tracking
    struct RetiredCredit {
        address buyer;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }

    // Marketplace listing
    struct MarketListing {
        address seller;
        uint256 amount;
        uint256 pricePerToken;
        bool active;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => ProductionRequest) public productionRequests;
    mapping(address => uint256) public retiredCredits;
    mapping(uint256 => MarketListing) public marketListings;
    mapping(bytes32 => bool) public usedProofHashes;
    
    uint256 public nextListingId;
    uint256 public totalRetiredCredits;
    uint256 public totalCertifiedProduction;

    // Events
    event ProductionRequested(bytes32 indexed requestId, address indexed producer, uint256 amount);
    event ProductionCertified(bytes32 indexed requestId, address indexed certifier, address indexed producer);
    event CreditsMinted(address indexed producer, uint256 amount, bytes32 indexed requestId);
    event CreditsRetired(address indexed buyer, uint256 amount, string reason);
    event MarketListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price);
    event MarketSale(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 amount);
    event RoleGrantedByAdmin(bytes32 indexed role, address indexed account, address indexed admin);

    constructor() ERC20("Green Hydrogen Credit", "H2C") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COUNTRY_ADMIN_ROLE, msg.sender);
    }

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: account is missing role");
        _;
    }

    modifier onlyAdminRoles() {
        require(
            hasRole(COUNTRY_ADMIN_ROLE, msg.sender) ||
            hasRole(STATE_ADMIN_ROLE, msg.sender) ||
            hasRole(CITY_ADMIN_ROLE, msg.sender),
            "Only admin roles can perform this action"
        );
        _;
    }

    /**
     * @dev Request production certification
     * @param amount Amount of hydrogen produced (in kg)
     * @param productionData JSON string with production details
     * @param proofHash Hash of proof documents
     */
    function requestProduction(
        uint256 amount,
        string memory productionData,
        string memory proofHash
    ) external onlyRole(PRODUCER_ROLE) whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(proofHash).length > 0, "Proof hash required");
        require(!usedProofHashes[keccak256(bytes(proofHash))], "Proof already used");

        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            proofHash,
            block.timestamp
        ));

        require(productionRequests[requestId].producer == address(0), "Request already exists");

        productionRequests[requestId] = ProductionRequest({
            producer: msg.sender,
            amount: amount,
            productionData: productionData,
            proofHash: proofHash,
            certifier: address(0),
            certified: false,
            timestamp: block.timestamp,
            minted: false
        });

        usedProofHashes[keccak256(bytes(proofHash))] = true;

        emit ProductionRequested(requestId, msg.sender, amount);
    }

    /**
     * @dev Certify production request (City Admin only)
     * @param requestId The production request ID
     */
    function certifyProduction(bytes32 requestId) external onlyRole(CITY_ADMIN_ROLE) whenNotPaused {
        ProductionRequest storage request = productionRequests[requestId];
        require(request.producer != address(0), "Request does not exist");
        require(!request.certified, "Request already certified");
        require(!request.minted, "Credits already minted");

        request.certified = true;
        request.certifier = msg.sender;

        emit ProductionCertified(requestId, msg.sender, request.producer);
    }

    /**
     * @dev Mint credits after certification
     * @param requestId The certified production request ID
     */
    function mintCredits(bytes32 requestId) external whenNotPaused nonReentrant {
        ProductionRequest storage request = productionRequests[requestId];
        require(request.producer == msg.sender, "Only producer can mint their credits");
        require(request.certified, "Production not certified");
        require(!request.minted, "Credits already minted");

        request.minted = true;
        totalCertifiedProduction += request.amount;

        _mint(request.producer, request.amount * 10**decimals());

        emit CreditsMinted(request.producer, request.amount, requestId);
    }

    /**
     * @dev Create marketplace listing
     * @param amount Amount of credits to sell
     * @param pricePerToken Price per token in wei
     */
    function createMarketListing(uint256 amount, uint256 pricePerToken) external whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerToken > 0, "Price must be greater than 0");
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");

        uint256 listingId = nextListingId++;
        
        marketListings[listingId] = MarketListing({
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true,
            timestamp: block.timestamp
        });

        // Lock the tokens
        _transfer(msg.sender, address(this), amount * 10**decimals());

        emit MarketListingCreated(listingId, msg.sender, amount, pricePerToken);
        return listingId;
    }

    /**
     * @dev Purchase credits from marketplace
     * @param listingId The listing ID to purchase from
     * @param amount Amount of credits to purchase
     */
    function purchaseCredits(uint256 listingId, uint256 amount) external payable whenNotPaused nonReentrant {
        MarketListing storage listing = marketListings[listingId];
        require(listing.active, "Listing not active");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        require(msg.value >= amount * listing.pricePerToken, "Insufficient payment");

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, amount * 10**decimals());

        // Transfer payment to seller
        payable(listing.seller).transfer(amount * listing.pricePerToken);

        // Refund excess payment
        if (msg.value > amount * listing.pricePerToken) {
            payable(msg.sender).transfer(msg.value - (amount * listing.pricePerToken));
        }

        emit MarketSale(listingId, msg.sender, listing.seller, amount);
    }

    /**
     * @dev Retire credits for compliance
     * @param amount Amount of credits to retire
     * @param reason Reason for retirement
     */
    function retireCredits(uint256 amount, string memory reason) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount * 10**decimals(), "Insufficient balance");

        _burn(msg.sender, amount * 10**decimals());
        
        retiredCredits[msg.sender] += amount;
        totalRetiredCredits += amount;

        emit CreditsRetired(msg.sender, amount, reason);
    }

    /**
     * @dev Grant role with hierarchy check
     */
    function grantRoleWithHierarchy(bytes32 role, address account) external {
        if (role == STATE_ADMIN_ROLE) {
            require(hasRole(COUNTRY_ADMIN_ROLE, msg.sender), "Only Country Admin can grant State Admin role");
        } else if (role == CITY_ADMIN_ROLE) {
            require(
                hasRole(COUNTRY_ADMIN_ROLE, msg.sender) || hasRole(STATE_ADMIN_ROLE, msg.sender),
                "Only Country or State Admin can grant City Admin role"
            );
        } else if (role == PRODUCER_ROLE || role == BUYER_ROLE) {
            require(
                hasRole(COUNTRY_ADMIN_ROLE, msg.sender) ||
                hasRole(STATE_ADMIN_ROLE, msg.sender) ||
                hasRole(CITY_ADMIN_ROLE, msg.sender),
                "Only admin roles can grant Producer/Buyer roles"
            );
        } else if (role == AUDITOR_ROLE) {
            require(hasRole(COUNTRY_ADMIN_ROLE, msg.sender), "Only Country Admin can grant Auditor role");
        }

        _grantRole(role, account);
        emit RoleGrantedByAdmin(role, account, msg.sender);
    }

    /**
     * @dev Cancel marketplace listing
     * @param listingId The listing ID to cancel
     */
    function cancelMarketListing(uint256 listingId) external {
        MarketListing storage listing = marketListings[listingId];
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        require(listing.active, "Listing not active");

        listing.active = false;
        
        // Return locked tokens to seller
        _transfer(address(this), listing.seller, listing.amount * 10**decimals());
    }

    /**
     * @dev Get production request details
     */
    function getProductionRequest(bytes32 requestId) external view returns (ProductionRequest memory) {
        return productionRequests[requestId];
    }

    /**
     * @dev Get market listing details
     */
    function getMarketListing(uint256 listingId) external view returns (MarketListing memory) {
        return marketListings[listingId];
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Get user's retired credits
     */
    function getRetiredCredits(address user) external view returns (uint256) {
        return retiredCredits[user];
    }

    /**
     * @dev Override decimals to represent whole kg units
     */
    function decimals() public pure override returns (uint8) {
        return 0; // Whole kg units only
    }
}
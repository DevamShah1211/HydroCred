const { ethers } = require('ethers');
const Web3 = require('web3');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.web3 = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.H2_TOKEN_CONTRACT_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize ethers.js provider
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Initialize Web3
      this.web3 = new Web3(this.rpcUrl);
      
      // Initialize signer if private key is provided
      if (this.privateKey) {
        this.signer = new ethers.Wallet(this.privateKey, this.provider);
      }

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`);

      // Initialize contract if address is provided
      if (this.contractAddress) {
        await this.initializeContract();
      }

    } catch (error) {
      console.error('Blockchain initialization error:', error);
    }
  }

  async initializeContract() {
    try {
      // H2Token contract ABI (minimal for backend operations)
      const contractABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function hasRole(bytes32 role, address account) view returns (bool)",
        "function requestProduction(uint256 amount, string productionData, string proofHash)",
        "function certifyProduction(bytes32 requestId)",
        "function mintCredits(bytes32 requestId)",
        "function createMarketListing(uint256 amount, uint256 pricePerToken) returns (uint256)",
        "function purchaseCredits(uint256 listingId, uint256 amount) payable",
        "function retireCredits(uint256 amount, string reason)",
        "function grantRoleWithHierarchy(bytes32 role, address account)",
        "function getProductionRequest(bytes32 requestId) view returns (tuple(address producer, uint256 amount, string productionData, string proofHash, address certifier, bool certified, uint256 timestamp, bool minted))",
        "function getMarketListing(uint256 listingId) view returns (tuple(address seller, uint256 amount, uint256 pricePerToken, bool active, uint256 timestamp))",
        "function getRetiredCredits(address user) view returns (uint256)",
        "event ProductionRequested(bytes32 indexed requestId, address indexed producer, uint256 amount)",
        "event ProductionCertified(bytes32 indexed requestId, address indexed certifier, address indexed producer)",
        "event CreditsMinted(address indexed producer, uint256 amount, bytes32 indexed requestId)",
        "event MarketListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price)",
        "event MarketSale(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 amount)",
        "event CreditsRetired(address indexed buyer, uint256 amount, string reason)",
        "event RoleGrantedByAdmin(bytes32 indexed role, address indexed account, address indexed admin)"
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer || this.provider);
      
      // Test contract connection
      const name = await this.contract.name();
      console.log(`Connected to H2Token contract: ${name}`);

    } catch (error) {
      console.error('Contract initialization error:', error);
    }
  }

  // Role constants
  getRoles() {
    return {
      DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
      COUNTRY_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("COUNTRY_ADMIN_ROLE")),
      STATE_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("STATE_ADMIN_ROLE")),
      CITY_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("CITY_ADMIN_ROLE")),
      PRODUCER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE")),
      BUYER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("BUYER_ROLE")),
      AUDITOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"))
    };
  }

  // Utility methods
  async getBalance(address) {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.balanceOf(address);
  }

  async hasRole(role, address) {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.hasRole(role, address);
  }

  async getTransactionReceipt(txHash) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  async getCurrentBlock() {
    return await this.provider.getBlockNumber();
  }

  async getGasPrice() {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice;
  }

  async estimateGas(transaction) {
    return await this.provider.estimateGas(transaction);
  }

  // Production request methods
  async requestProduction(amount, productionData, proofHash) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.requestProduction(amount, productionData, proofHash);
    return tx;
  }

  async certifyProduction(requestId) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.certifyProduction(requestId);
    return tx;
  }

  async mintCredits(requestId) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.mintCredits(requestId);
    return tx;
  }

  // Marketplace methods
  async createMarketListing(amount, pricePerToken) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.createMarketListing(amount, pricePerToken);
    return tx;
  }

  async purchaseCredits(listingId, amount, value) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.purchaseCredits(listingId, amount, { value });
    return tx;
  }

  // Credit retirement
  async retireCredits(amount, reason) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.retireCredits(amount, reason);
    return tx;
  }

  // Role management
  async grantRole(role, address) {
    if (!this.contract || !this.signer) throw new Error('Contract or signer not initialized');
    
    const tx = await this.contract.grantRoleWithHierarchy(role, address);
    return tx;
  }

  // Event listening
  startEventListening() {
    if (!this.contract) {
      console.error('Contract not initialized for event listening');
      return;
    }

    // Listen to all major events
    this.contract.on('ProductionRequested', (requestId, producer, amount, event) => {
      console.log('Production Requested:', { requestId, producer, amount });
      this.handleProductionRequested(requestId, producer, amount, event);
    });

    this.contract.on('ProductionCertified', (requestId, certifier, producer, event) => {
      console.log('Production Certified:', { requestId, certifier, producer });
      this.handleProductionCertified(requestId, certifier, producer, event);
    });

    this.contract.on('CreditsMinted', (producer, amount, requestId, event) => {
      console.log('Credits Minted:', { producer, amount, requestId });
      this.handleCreditsMinted(producer, amount, requestId, event);
    });

    this.contract.on('MarketListingCreated', (listingId, seller, amount, price, event) => {
      console.log('Market Listing Created:', { listingId, seller, amount, price });
      this.handleMarketListingCreated(listingId, seller, amount, price, event);
    });

    this.contract.on('MarketSale', (listingId, buyer, seller, amount, event) => {
      console.log('Market Sale:', { listingId, buyer, seller, amount });
      this.handleMarketSale(listingId, buyer, seller, amount, event);
    });

    this.contract.on('CreditsRetired', (buyer, amount, reason, event) => {
      console.log('Credits Retired:', { buyer, amount, reason });
      this.handleCreditsRetired(buyer, amount, reason, event);
    });

    console.log('Started listening to blockchain events');
  }

  // Event handlers (to be implemented based on database operations)
  async handleProductionRequested(requestId, producer, amount, event) {
    // Save to database, update transaction status, etc.
  }

  async handleProductionCertified(requestId, certifier, producer, event) {
    // Update production request status, create audit log, etc.
  }

  async handleCreditsMinted(producer, amount, requestId, event) {
    // Update user balance, create transaction record, etc.
  }

  async handleMarketListingCreated(listingId, seller, amount, price, event) {
    // Create marketplace listing record, etc.
  }

  async handleMarketSale(listingId, buyer, seller, amount, event) {
    // Update marketplace listing, create transaction record, etc.
  }

  async handleCreditsRetired(buyer, amount, reason, event) {
    // Update retired credits tracking, create audit log, etc.
  }

  // Utility method to create request ID
  createRequestId(producer, amount, proofHash, timestamp) {
    return ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'string', 'uint256'],
        [producer, amount, proofHash, timestamp]
      )
    );
  }

  // Connection health check
  async healthCheck() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      
      return {
        connected: true,
        blockNumber,
        chainId: network.chainId,
        networkName: network.name
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
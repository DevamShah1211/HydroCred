import { ethers } from 'ethers';

// Mock data storage
interface MockWallet {
  address: string;
  privateKey: string;
  name: string;
}

interface MockToken {
  tokenId: number;
  owner: string;
  isRetired: boolean;
  retiredBy?: string;
  retiredAt?: number;
  issuedAt: number;
  issuedBy: string;
}

interface MockTransaction {
  hash: string;
  from: string;
  to: string;
  type: 'issue' | 'transfer' | 'retire';
  tokenId?: number;
  amount?: number;
  fromId?: number;
  toId?: number;
  timestamp: number;
  blockNumber: number;
  status: 1 | 0;
}

class MockChainState {
  private wallets: MockWallet[] = [];
  private tokens: MockToken[] = [];
  private transactions: MockTransaction[] = [];
  private currentWallet: string | null = null;
  private nextTokenId = 1;
  private nextBlockNumber = 1000000;
  
  constructor() {
    this.initializeDefaultData();
    this.loadFromStorage();
  }

  private initializeDefaultData() {
    // Create default wallets for different roles
    this.wallets = [
      {
        address: '0x1234567890123456789012345678901234567890',
        privateKey: '0x' + '1'.repeat(64),
        name: 'Certifier Wallet'
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        privateKey: '0x' + '2'.repeat(64),
        name: 'Producer Wallet'
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        privateKey: '0x' + '3'.repeat(64),
        name: 'Buyer Wallet'
      },
      {
        address: '0x4567890123456789012345678901234567890123',
        privateKey: '0x' + '4'.repeat(64),
        name: 'Regulator Wallet'
      }
    ];

    // Create some initial demo tokens for a more interesting demo
    this.tokens = [
      // Producer wallet credits (active)
      {
        tokenId: 1,
        owner: this.wallets[1].address, // Producer
        isRetired: false,
        issuedAt: Date.now() - 86400000, // 1 day ago
        issuedBy: this.wallets[0].address // Certifier
      },
      {
        tokenId: 2,
        owner: this.wallets[1].address, // Producer
        isRetired: false,
        issuedAt: Date.now() - 86400000,
        issuedBy: this.wallets[0].address
      },
      {
        tokenId: 3,
        owner: this.wallets[1].address, // Producer
        isRetired: false,
        issuedAt: Date.now() - 72000000, // 20 hours ago
        issuedBy: this.wallets[0].address
      },
      
      // Buyer wallet credits (some active, some retired)
      {
        tokenId: 4,
        owner: this.wallets[2].address, // Buyer
        isRetired: false,
        issuedAt: Date.now() - 172800000, // 2 days ago
        issuedBy: this.wallets[0].address
      },
      {
        tokenId: 5,
        owner: this.wallets[2].address, // Buyer
        isRetired: true,
        retiredBy: this.wallets[2].address,
        retiredAt: Date.now() - 3600000, // 1 hour ago
        issuedAt: Date.now() - 259200000, // 3 days ago
        issuedBy: this.wallets[0].address
      },
      {
        tokenId: 6,
        owner: this.wallets[2].address, // Buyer
        isRetired: true,
        retiredBy: this.wallets[2].address,
        retiredAt: Date.now() - 7200000, // 2 hours ago
        issuedAt: Date.now() - 345600000, // 4 days ago
        issuedBy: this.wallets[0].address
      }
    ];

    this.nextTokenId = 7;

    // Create some initial demo transactions
    this.transactions = [
      {
        hash: this.generateTxHash(),
        from: this.wallets[0].address,
        to: this.wallets[1].address,
        type: 'issue',
        amount: 3,
        fromId: 1,
        toId: 3,
        timestamp: Math.floor((Date.now() - 86400000) / 1000),
        blockNumber: 999990,
        status: 1
      },
      {
        hash: this.generateTxHash(),
        from: this.wallets[0].address,
        to: this.wallets[2].address,
        type: 'issue',
        amount: 3,
        fromId: 4,
        toId: 6,
        timestamp: Math.floor((Date.now() - 259200000) / 1000),
        blockNumber: 999985,
        status: 1
      },
      {
        hash: this.generateTxHash(),
        from: this.wallets[2].address,
        to: this.wallets[2].address,
        type: 'retire',
        tokenId: 5,
        timestamp: Math.floor((Date.now() - 3600000) / 1000),
        blockNumber: 999995,
        status: 1
      },
      {
        hash: this.generateTxHash(),
        from: this.wallets[2].address,
        to: this.wallets[2].address,
        type: 'retire',
        tokenId: 6,
        timestamp: Math.floor((Date.now() - 7200000) / 1000),
        blockNumber: 999993,
        status: 1
      }
    ];

    this.nextBlockNumber = 1000000;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('mockChainState');
      if (stored) {
        const data = JSON.parse(stored);
        this.tokens = data.tokens || this.tokens;
        this.transactions = data.transactions || [];
        this.nextTokenId = data.nextTokenId || this.nextTokenId;
        this.nextBlockNumber = data.nextBlockNumber || this.nextBlockNumber;
        this.currentWallet = data.currentWallet || null;
      }
    } catch (error) {
      console.warn('Failed to load mock chain state from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        tokens: this.tokens,
        transactions: this.transactions,
        nextTokenId: this.nextTokenId,
        nextBlockNumber: this.nextBlockNumber,
        currentWallet: this.currentWallet
      };
      localStorage.setItem('mockChainState', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save mock chain state to storage:', error);
    }
  }

  // Wallet operations
  async connectWallet(walletIndex: number = 1): Promise<string> {
    if (walletIndex >= this.wallets.length) {
      throw new Error('Invalid wallet index');
    }
    
    this.currentWallet = this.wallets[walletIndex].address;
    this.saveToStorage();
    return this.currentWallet;
  }

  async getWalletAddress(): Promise<string | null> {
    return this.currentWallet;
  }

  getAvailableWallets(): MockWallet[] {
    return this.wallets;
  }

  // Token operations
  async batchIssueCredits(to: string, amount: number): Promise<MockTransactionResponse> {
    // Simulate certifier role check
    if (!this.isCertifier(this.currentWallet!)) {
      throw new Error('Only certifiers can issue credits');
    }

    const fromId = this.nextTokenId;
    const toId = this.nextTokenId + amount - 1;

    // Create tokens
    for (let i = 0; i < amount; i++) {
      this.tokens.push({
        tokenId: this.nextTokenId,
        owner: to,
        isRetired: false,
        issuedAt: Date.now(),
        issuedBy: this.currentWallet!
      });
      this.nextTokenId++;
    }

    // Create transaction record
    const transaction: MockTransaction = {
      hash: this.generateTxHash(),
      from: this.currentWallet!,
      to,
      type: 'issue',
      amount,
      fromId,
      toId,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: this.nextBlockNumber++,
      status: 1
    };

    this.transactions.push(transaction);
    this.saveToStorage();

    return new MockTransactionResponse(transaction);
  }

  async transferCredit(from: string, to: string, tokenId: number): Promise<MockTransactionResponse> {
    const token = this.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }

    if (token.owner !== from) {
      throw new Error('You do not own this token');
    }

    if (token.isRetired) {
      throw new Error('Cannot transfer retired credit');
    }

    // Update token ownership
    token.owner = to;

    // Create transaction record
    const transaction: MockTransaction = {
      hash: this.generateTxHash(),
      from,
      to,
      type: 'transfer',
      tokenId,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: this.nextBlockNumber++,
      status: 1
    };

    this.transactions.push(transaction);
    this.saveToStorage();

    return new MockTransactionResponse(transaction);
  }

  async retireCredit(tokenId: number): Promise<MockTransactionResponse> {
    const token = this.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }

    if (token.owner !== this.currentWallet) {
      throw new Error('Only owner can retire credit');
    }

    if (token.isRetired) {
      throw new Error('Credit already retired');
    }

    // Retire the token
    token.isRetired = true;
    token.retiredBy = this.currentWallet!;
    token.retiredAt = Date.now();

    // Create transaction record
    const transaction: MockTransaction = {
      hash: this.generateTxHash(),
      from: this.currentWallet!,
      to: this.currentWallet!,
      type: 'retire',
      tokenId,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: this.nextBlockNumber++,
      status: 1
    };

    this.transactions.push(transaction);
    this.saveToStorage();

    return new MockTransactionResponse(transaction);
  }

  // Query operations
  async getOwnedTokens(address: string): Promise<number[]> {
    return this.tokens
      .filter(token => token.owner === address)
      .map(token => token.tokenId);
  }

  async isTokenRetired(tokenId: number): Promise<boolean> {
    const token = this.tokens.find(t => t.tokenId === tokenId);
    return token?.isRetired || false;
  }

  async getTokenOwner(tokenId: number): Promise<string> {
    const token = this.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    return token.owner;
  }

  isCertifier(address: string): boolean {
    // First wallet is always the certifier
    return address === this.wallets[0].address;
  }

  // Transaction history
  getCreditEvents(fromBlock: number = 0): MockTransaction[] {
    return this.transactions
      .filter(tx => tx.blockNumber >= fromBlock)
      .sort((a, b) => b.blockNumber - a.blockNumber);
  }

  // Utility methods
  private generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Reset for demo purposes
  resetToDefaults() {
    this.tokens = [];
    this.transactions = [];
    this.nextTokenId = 1;
    this.nextBlockNumber = 1000000;
    this.currentWallet = null;
    this.initializeDefaultData();
    this.saveToStorage();
  }

  // Get all data for debugging
  getAllData() {
    return {
      wallets: this.wallets,
      tokens: this.tokens,
      transactions: this.transactions,
      currentWallet: this.currentWallet,
      nextTokenId: this.nextTokenId
    };
  }
}

class MockTransactionResponse {
  public hash: string;
  public status: number;
  
  constructor(private transaction: MockTransaction) {
    this.hash = transaction.hash;
    this.status = transaction.status;
  }

  async wait(): Promise<MockTransactionReceipt> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return new MockTransactionReceipt(this.transaction);
  }
}

class MockTransactionReceipt {
  public status: number;
  public transactionHash: string;
  public blockNumber: number;
  public gasUsed: bigint;
  public effectiveGasPrice: bigint;

  constructor(transaction: MockTransaction) {
    this.status = transaction.status;
    this.transactionHash = transaction.hash;
    this.blockNumber = transaction.blockNumber;
    this.gasUsed = BigInt(Math.floor(50000 + Math.random() * 100000));
    this.effectiveGasPrice = BigInt(Math.floor(20000000000 + Math.random() * 10000000000));
  }
}

// Global mock chain instance
export const mockChain = new MockChainState();

// Mock implementations of chain functions
export async function getProvider(): Promise<any> {
  return {
    send: async () => [],
    listAccounts: async () => mockChain.getAvailableWallets().map(w => ({ address: w.address }))
  };
}

export async function getSigner(): Promise<any> {
  const address = await mockChain.getWalletAddress();
  if (!address) {
    throw new Error('No wallet connected');
  }
  
  return {
    getAddress: async () => address
  };
}

export async function getContract(): Promise<any> {
  return {
    batchIssue: mockChain.batchIssueCredits.bind(mockChain),
    transferFrom: mockChain.transferCredit.bind(mockChain),
    retire: mockChain.retireCredit.bind(mockChain),
    tokensOfOwner: mockChain.getOwnedTokens.bind(mockChain),
    isRetired: mockChain.isTokenRetired.bind(mockChain),
    ownerOf: mockChain.getTokenOwner.bind(mockChain),
    hasRole: async (role: string, address: string) => mockChain.isCertifier(address),
    CERTIFIER_ROLE: async () => 'CERTIFIER_ROLE'
  };
}

export async function getReadOnlyContract(): Promise<any> {
  return getContract();
}

export async function connectWallet(walletIndex: number = 1): Promise<string> {
  return await mockChain.connectWallet(walletIndex);
}

export async function getWalletAddress(): Promise<string | null> {
  return await mockChain.getWalletAddress();
}

export async function batchIssueCredits(to: string, amount: number): Promise<any> {
  return await mockChain.batchIssueCredits(to, amount);
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<any> {
  return await mockChain.transferCredit(from, to, tokenId);
}

export async function retireCredit(tokenId: number): Promise<any> {
  return await mockChain.retireCredit(tokenId);
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  return await mockChain.getOwnedTokens(address);
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  return await mockChain.isTokenRetired(tokenId);
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  return await mockChain.getTokenOwner(tokenId);
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  return mockChain.isCertifier(address);
}

export async function isCertifier(address: string): Promise<boolean> {
  return mockChain.isCertifier(address);
}

export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export class ChainError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ChainError';
  }
}

export function handleChainError(error: any): ChainError {
  if (error.code === 4001) {
    return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  } else if (error.code === -32603) {
    return new ChainError('Internal JSON-RPC error', 'RPC_ERROR');
  } else if (error.message?.includes('insufficient funds')) {
    return new ChainError('Insufficient funds for transaction', 'INSUFFICIENT_FUNDS');
  } else if (error.message?.includes('user rejected')) {
    return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  }
  
  return new ChainError(error.message || 'Unknown blockchain error', 'UNKNOWN');
}

// Wallet switching utility
export async function switchWallet(walletName: string): Promise<string> {
  const wallets = mockChain.getAvailableWallets();
  const walletIndex = wallets.findIndex(w => w.name === walletName);
  
  if (walletIndex === -1) {
    throw new Error(`Wallet "${walletName}" not found`);
  }
  
  return await mockChain.connectWallet(walletIndex);
}

// Get available wallets for UI
export function getAvailableWallets(): MockWallet[] {
  return mockChain.getAvailableWallets();
}

// Get transaction history
export function getCreditEvents(fromBlock: number = 0): MockTransaction[] {
  return mockChain.getCreditEvents(fromBlock);
}

// Reset demo data
export function resetDemoData(): void {
  mockChain.resetToDefaults();
}

// Debug utility
export function getDebugData(): any {
  return mockChain.getAllData();
}

// Constants
export const CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
export const RPC_URL = 'http://localhost:8545';
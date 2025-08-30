import { ethers } from 'ethers';

// Mock blockchain state
interface MockToken {
  id: number;
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
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
  status: number;
}

interface MockEvent {
  type: 'issued' | 'transferred' | 'retired';
  from?: string;
  to?: string;
  amount?: number;
  fromId?: number;
  toId?: number;
  tokenId?: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  logIndex: number;
}

class MockBlockchain {
  private tokens: Map<number, MockToken> = new Map();
  private transactions: Map<string, MockTransaction> = new Map();
  private events: MockEvent[] = [];
  private nextTokenId = 1;
  private nextBlockNumber = 1000000;
  private certifiers: Set<string> = new Set();
  private admins: Set<string> = new Set();
  private balances: Map<string, number> = new Map();

  constructor() {
    // Initialize with some default data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add some default certifiers and admins
    const defaultAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012'
    ];

    defaultAddresses.forEach((address, index) => {
      if (index === 0) {
        this.admins.add(address);
        this.certifiers.add(address);
      } else {
        this.certifiers.add(address);
      }
      this.balances.set(address, 1000); // Give them some initial credits
    });

    // Create some initial tokens
    this.createMockTokens(defaultAddresses[0], 100);
    this.createMockTokens(defaultAddresses[1], 50);
    this.createMockTokens(defaultAddresses[2], 75);
  }

  private createMockTokens(owner: string, count: number) {
    const fromId = this.nextTokenId;
    const toId = this.nextTokenId + count - 1;

    for (let i = 0; i < count; i++) {
      const tokenId = this.nextTokenId++;
      const token: MockToken = {
        id: tokenId,
        owner,
        isRetired: false,
        issuedAt: Date.now() - Math.random() * 86400000, // Random time in last 24h
        issuedBy: Array.from(this.certifiers)[0]
      };
      this.tokens.set(tokenId, token);
    }

    // Create issuance event
    const event: MockEvent = {
      type: 'issued',
      to: owner,
      amount: count,
      fromId,
      toId,
      transactionHash: this.generateMockHash(),
      blockNumber: this.nextBlockNumber++,
      timestamp: Math.floor(Date.now() / 1000),
      logIndex: 0
    };
    this.events.push(event);
  }

  private generateMockHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateMockTransaction(from: string, to: string): MockTransaction {
    const hash = this.generateMockHash();
    const transaction: MockTransaction = {
      hash,
      from,
      to,
      blockNumber: this.nextBlockNumber++,
      timestamp: Math.floor(Date.now() / 1000),
      gasUsed: (Math.random() * 100000 + 50000).toFixed(0),
      status: 1
    };
    this.transactions.set(hash, transaction);
    return transaction;
  }

  // Mock blockchain functions
  async batchIssue(to: string, amount: number, issuedBy: string): Promise<MockTransaction> {
    if (!this.certifiers.has(issuedBy)) {
      throw new Error('Only certifiers can issue credits');
    }

    if (amount <= 0 || amount > 1000) {
      throw new Error('Amount must be between 1 and 1000');
    }

    const fromId = this.nextTokenId;
    const toId = this.nextTokenId + amount - 1;

    // Create tokens
    for (let i = 0; i < amount; i++) {
      const tokenId = this.nextTokenId++;
      const token: MockToken = {
        id: tokenId,
        owner: to,
        isRetired: false,
        issuedAt: Date.now(),
        issuedBy
      };
      this.tokens.set(tokenId, token);
    }

    // Update balance
    const currentBalance = this.balances.get(to) || 0;
    this.balances.set(to, currentBalance + amount);

    // Create transaction
    const transaction = this.generateMockTransaction(issuedBy, to);

    // Create event
    const event: MockEvent = {
      type: 'issued',
      to,
      amount,
      fromId,
      toId,
      transactionHash: transaction.hash,
      blockNumber: transaction.blockNumber,
      timestamp: transaction.timestamp,
      logIndex: 0
    };
    this.events.push(event);

    return transaction;
  }

  async transferCredit(from: string, to: string, tokenId: number): Promise<MockTransaction> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }

    if (token.owner !== from) {
      throw new Error('Only token owner can transfer');
    }

    if (token.isRetired) {
      throw new Error('Cannot transfer retired credit');
    }

    // Update token ownership
    token.owner = to;

    // Update balances
    const fromBalance = this.balances.get(from) || 0;
    const toBalance = this.balances.get(to) || 0;
    this.balances.set(from, Math.max(0, fromBalance - 1));
    this.balances.set(to, toBalance + 1);

    // Create transaction
    const transaction = this.generateMockTransaction(from, to);

    // Create event
    const event: MockEvent = {
      type: 'transferred',
      from,
      to,
      tokenId,
      transactionHash: transaction.hash,
      blockNumber: transaction.blockNumber,
      timestamp: transaction.timestamp,
      logIndex: 0
    };
    this.events.push(event);

    return transaction;
  }

  async retireCredit(tokenId: number, retiredBy: string): Promise<MockTransaction> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }

    if (token.owner !== retiredBy) {
      throw new Error('Only token owner can retire credit');
    }

    if (token.isRetired) {
      throw new Error('Credit already retired');
    }

    // Retire the token
    token.isRetired = true;
    token.retiredBy = retiredBy;
    token.retiredAt = Date.now();

    // Create transaction
    const transaction = this.generateMockTransaction(retiredBy, '0x0000000000000000000000000000000000000000');

    // Create event
    const event: MockEvent = {
      type: 'retired',
      from: retiredBy,
      tokenId,
      transactionHash: transaction.hash,
      blockNumber: transaction.blockNumber,
      timestamp: transaction.timestamp,
      logIndex: 0
    };
    this.events.push(event);

    return transaction;
  }

  async getOwnedTokens(owner: string): Promise<number[]> {
    const ownedTokens: number[] = [];
    for (const [tokenId, token] of this.tokens) {
      if (token.owner === owner && !token.isRetired) {
        ownedTokens.push(tokenId);
      }
    }
    return ownedTokens;
  }

  async getTokenOwner(tokenId: number): Promise<string> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }
    return token.owner;
  }

  async isTokenRetired(tokenId: number): Promise<boolean> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }
    return token.isRetired;
  }

  async hasRole(role: string, address: string): Promise<boolean> {
    if (role === 'DEFAULT_ADMIN_ROLE') {
      return this.admins.has(address);
    }
    if (role === 'CERTIFIER_ROLE') {
      return this.certifiers.has(address);
    }
    return false;
  }

  async getBalance(address: string): Promise<number> {
    return this.balances.get(address) || 0;
  }

  async getEvents(fromBlock: number = 0): Promise<MockEvent[]> {
    return this.events.filter(event => event.blockNumber >= fromBlock);
  }

  async getTransaction(hash: string): Promise<MockTransaction | null> {
    return this.transactions.get(hash) || null;
  }

  // Utility functions for testing
  addCertifier(address: string) {
    this.certifiers.add(address);
  }

  removeCertifier(address: string) {
    this.certifiers.delete(address);
  }

  addAdmin(address: string) {
    this.admins.add(address);
    this.certifiers.add(address);
  }

  reset() {
    this.tokens.clear();
    this.transactions.clear();
    this.events = [];
    this.nextTokenId = 1;
    this.nextBlockNumber = 1000000;
    this.balances.clear();
    this.certifiers.clear();
    this.admins.clear();
    this.initializeMockData();
  }

  // Get mock data for debugging
  getMockData() {
    return {
      tokens: Array.from(this.tokens.values()),
      events: this.events,
      transactions: Array.from(this.transactions.values()),
      certifiers: Array.from(this.certifiers),
      admins: Array.from(this.admins),
      balances: Object.fromEntries(this.balances)
    };
  }
}

// Export singleton instance
export const mockBlockchain = new MockBlockchain();

// Export types
export type { MockToken, MockTransaction, MockEvent };
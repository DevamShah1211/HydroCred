// Mock backend chain utilities for fake transaction system

interface MockTransaction {
  hash: string;
  from: string;
  to: string;
  type: 'issued' | 'transferred' | 'retired';
  tokenId?: number;
  amount?: number;
  fromId?: number;
  toId?: number;
  timestamp: number;
  blockNumber: number;
  status: 1 | 0;
}

class MockBackendChain {
  private transactions: MockTransaction[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultData();
  }

  private loadFromStorage() {
    // In a real implementation, this would load from a database
    // For now, we'll just use in-memory storage
  }

  private initializeDefaultData() {
    if (this.transactions.length === 0) {
      // Add some initial demo transactions
      this.transactions = [
        {
          hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          from: '0x1234567890123456789012345678901234567890',
          to: '0x2345678901234567890123456789012345678901',
          type: 'issued',
          amount: 10,
          fromId: 1,
          toId: 10,
          timestamp: Math.floor((Date.now() - 86400000) / 1000), // 1 day ago
          blockNumber: 999990,
          status: 1
        },
        {
          hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          from: '0x2345678901234567890123456789012345678901',
          to: '0x3456789012345678901234567890123456789012',
          type: 'transferred',
          tokenId: 1,
          timestamp: Math.floor((Date.now() - 43200000) / 1000), // 12 hours ago
          blockNumber: 999995,
          status: 1
        },
        {
          hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          from: '0x3456789012345678901234567890123456789012',
          to: '0x3456789012345678901234567890123456789012',
          type: 'retired',
          tokenId: 1,
          timestamp: Math.floor((Date.now() - 3600000) / 1000), // 1 hour ago
          blockNumber: 999998,
          status: 1
        }
      ];
    }
  }

  getCreditEvents(fromBlock: number = 0): MockTransaction[] {
    return this.transactions
      .filter(tx => tx.blockNumber >= fromBlock)
      .sort((a, b) => b.blockNumber - a.blockNumber);
  }

  addTransaction(transaction: MockTransaction) {
    this.transactions.push(transaction);
  }

  getAllTransactions(): MockTransaction[] {
    return this.transactions;
  }
}

export const mockBackendChain = new MockBackendChain();

export interface CreditEvent {
  type: 'issued' | 'transferred' | 'retired';
  tokenId?: number;
  from?: string;
  to?: string;
  amount?: number;
  fromId?: number;
  toId?: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export async function getCreditEvents(fromBlock: number = 0): Promise<CreditEvent[]> {
  // Simulate some network delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
  
  const transactions = mockBackendChain.getCreditEvents(fromBlock);
  
  return transactions.map(tx => ({
    type: tx.type,
    tokenId: tx.tokenId,
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    fromId: tx.fromId,
    toId: tx.toId,
    timestamp: tx.timestamp,
    blockNumber: tx.blockNumber,
    transactionHash: tx.hash
  }));
}
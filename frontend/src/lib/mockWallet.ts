// Mock wallet addresses for development
export const MOCK_ADDRESSES = {
  CERTIFIER: '0x1234567890123456789012345678901234567890',
  PRODUCER: '0x2345678901234567890123456789012345678901',
  BUYER: '0x3456789012345678901234567890123456789012',
  REGULATOR: '0x4567890123456789012345678901234567890123'
};

// Mock wallet state
class MockWallet {
  private connected = false;
  private currentAddress: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    // Auto-connect to first address in development
    if (process.env.NODE_ENV === 'development') {
      this.connect(MOCK_ADDRESSES.CERTIFIER);
    }
  }

  // Connect to a specific address
  connect(address: string) {
    this.currentAddress = address;
    this.connected = true;
    this.emit('accountsChanged', [address]);
    this.emit('connect', { chainId: '0x1' });
  }

  // Disconnect wallet
  disconnect() {
    this.connected = false;
    this.currentAddress = null;
    this.emit('disconnect');
  }

  // Switch to different address
  switchAddress(address: string) {
    if (this.currentAddress !== address) {
      this.currentAddress = address;
      this.emit('accountsChanged', [address]);
    }
  }

  // Get current address
  getAddress(): string | null {
    return this.currentAddress;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected;
  }

  // Request accounts (simulates MetaMask)
  async requestAccounts(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }
    return this.currentAddress ? [this.currentAddress] : [];
  }

  // Get accounts
  async getAccounts(): Promise<string[]> {
    if (!this.connected) {
      return [];
    }
    return this.currentAddress ? [this.currentAddress] : [];
  }

  // Get network
  async getNetwork(): Promise<any> {
    return {
      chainId: '0x1',
      name: 'Ethereum Mainnet'
    };
  }

  // Get signer (mock implementation)
  async getSigner(): Promise<any> {
    return {
      getAddress: () => this.currentAddress,
      signMessage: async (message: string) => {
        // Mock signature
        return `0x${Array.from({ length: 130 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
      }
    };
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeListener(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Simulate transaction
  async sendTransaction(transaction: any): Promise<any> {
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate mock transaction hash
    const hash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    return {
      hash,
      from: this.currentAddress,
      to: transaction.to,
      value: transaction.value || '0x0',
      gasLimit: transaction.gasLimit || '0x186a0',
      gasPrice: transaction.gasPrice || '0x3b9aca00',
      nonce: Math.floor(Math.random() * 1000),
      data: transaction.data || '0x',
      chainId: 1
    };
  }

  // Simulate transaction receipt
  async waitForTransaction(hash: string): Promise<any> {
    // Simulate block confirmation delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return {
      hash,
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      blockHash: `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      transactionIndex: Math.floor(Math.random() * 100),
      from: this.currentAddress,
      to: '0x0000000000000000000000000000000000000000',
      cumulativeGasUsed: '0x' + Math.floor(Math.random() * 100000 + 50000).toString(16),
      gasUsed: '0x' + Math.floor(Math.random() * 100000 + 50000).toString(16),
      effectiveGasPrice: '0x3b9aca00',
      status: 1,
      type: 2,
      logs: []
    };
  }
}

// Export singleton instance
export const mockWallet = new MockWallet();

// Mock ethereum object for development
export const mockEthereum = {
  isMetaMask: true,
  isConnected: () => mockWallet.isConnected(),
  request: async (request: any) => {
    switch (request.method) {
      case 'eth_requestAccounts':
        return await mockWallet.requestAccounts();
      case 'eth_accounts':
        return await mockWallet.getAccounts();
      case 'eth_chainId':
        return '0x1';
      case 'eth_getBalance':
        return '0x' + Math.floor(Math.random() * 1000000000000000000).toString(16);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  },
  on: (event: string, callback: Function) => mockWallet.on(event, callback),
  removeListener: (event: string, callback: Function) => mockWallet.removeListener(event, callback),
  removeAllListeners: (event: string) => {
    // Mock implementation
  }
};

// Mock provider
export const mockProvider = {
  getNetwork: async () => ({ chainId: 1, name: 'Ethereum Mainnet' }),
  getBalance: async (address: string) => {
    return BigInt(Math.floor(Math.random() * 1000000000000000000));
  },
  getTransactionCount: async (address: string) => {
    return Math.floor(Math.random() * 1000);
  }
};

// Mock signer
export const mockSigner = {
  getAddress: () => mockWallet.getAddress(),
  getBalance: async () => {
    return BigInt(Math.floor(Math.random() * 1000000000000000000));
  },
  getTransactionCount: async () => {
    return Math.floor(Math.random() * 1000);
  },
  signMessage: async (message: string) => {
    return `0x${Array.from({ length: 130 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
  },
  sendTransaction: async (transaction: any) => {
    return await mockWallet.sendTransaction(transaction);
  }
};

// Utility functions
export function getMockAddresses() {
  return MOCK_ADDRESSES;
}

export function connectMockWallet(address: string) {
  mockWallet.connect(address);
}

export function disconnectMockWallet() {
  mockWallet.disconnect();
}

export function switchMockAddress(address: string) {
  mockWallet.switchAddress(address);
}

export function getCurrentMockAddress(): string | null {
  return mockWallet.getAddress();
}

export function isMockWalletConnected(): boolean {
  return mockWallet.isConnected();
}
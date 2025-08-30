// Mock blockchain functionality for development and demo purposes
import { toast } from '../components/Toast';

// Mock wallet addresses
const MOCK_ADDRESSES = {
  certifier: '0x1234567890123456789012345678901234567890',
  producer1: '0x2345678901234567890123456789012345678901',
  producer2: '0x3456789012345678901234567890123456789012',
  buyer1: '0x4567890123456789012345678901234567890123',
  buyer2: '0x5678901234567890123456789012345678901234',
  regulator: '0x6789012345678901234567890123456789012345',
};

// Mock token data
interface MockToken {
  tokenId: number;
  owner: string;
  isRetired: boolean;
  issuedAt: number;
  issuedBy: string;
  amount: number;
}

// Global mock state
let mockTokens: MockToken[] = [];
let mockCurrentAddress: string = MOCK_ADDRESSES.certifier;
let mockIsConnected: boolean = true; // Auto-connect in mock mode
let nextTokenId = 1;

// Initialize with some demo data
function initializeMockData() {
  if (mockTokens.length === 0) {
    // Create realistic demo tokens for different users
    const now = Date.now();
    
    mockTokens = [
      // Producer 1 tokens
      { tokenId: 1, owner: MOCK_ADDRESSES.producer1, isRetired: false, issuedAt: now - 86400000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      { tokenId: 2, owner: MOCK_ADDRESSES.producer1, isRetired: false, issuedAt: now - 86400000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      { tokenId: 3, owner: MOCK_ADDRESSES.producer1, isRetired: true, issuedAt: now - 172800000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      
      // Producer 2 tokens
      { tokenId: 4, owner: MOCK_ADDRESSES.producer2, isRetired: false, issuedAt: now - 259200000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      { tokenId: 5, owner: MOCK_ADDRESSES.producer2, isRetired: false, issuedAt: now - 259200000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      
      // Buyer 1 tokens (transferred from producers)
      { tokenId: 6, owner: MOCK_ADDRESSES.buyer1, isRetired: false, issuedAt: now - 345600000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      { tokenId: 7, owner: MOCK_ADDRESSES.buyer1, isRetired: true, issuedAt: now - 432000000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
      
      // Buyer 2 tokens
      { tokenId: 8, owner: MOCK_ADDRESSES.buyer2, isRetired: false, issuedAt: now - 518400000, issuedBy: MOCK_ADDRESSES.certifier, amount: 1 },
    ];
    nextTokenId = 9;
  }
}

// Initialize on import
initializeMockData();

// Mock contract configuration
export const CONTRACT_ADDRESS = '0xMOCK1234567890123456789012345678901234567890';
export const RPC_URL = 'https://mock-rpc.example.com';
export const DEV_MODE = true;

// Mock transaction response
interface MockTransactionResponse {
  hash: string;
  wait: () => Promise<{ status: number; blockNumber: number; transactionHash: string }>;
}

function createMockTransaction(): MockTransactionResponse {
  const hash = `0x${Math.random().toString(16).substr(2, 64)}`;
  return {
    hash,
    wait: async () => {
      // Simulate transaction confirmation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        status: 1,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        transactionHash: hash,
      };
    }
  };
}

// Mock wallet functions
export async function getProvider(): Promise<any> {
  return { isMock: true };
}

export async function getSigner(): Promise<any> {
  return { 
    isMock: true,
    getAddress: () => mockCurrentAddress 
  };
}

export async function getContract(): Promise<any> {
  return { isMock: true };
}

export async function getReadOnlyContract(): Promise<any> {
  return { isMock: true };
}

export function isContractConfigured(): boolean {
  return true; // Always configured in mock mode
}

export function isDevelopmentMode(): boolean {
  return true;
}

export async function connectWallet(): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate connection delay
  mockIsConnected = true;
  toast.success('Mock wallet connected successfully!');
  return mockCurrentAddress;
}

export async function getWalletAddress(): Promise<string | null> {
  // Auto-connect in mock mode
  if (!mockIsConnected) {
    mockIsConnected = true;
  }
  return mockCurrentAddress;
}

// Mock blockchain operations
export async function batchIssueCredits(to: string, amount: number): Promise<MockTransactionResponse> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
  
  // Create new tokens
  const startTokenId = nextTokenId;
  for (let i = 0; i < amount; i++) {
    mockTokens.push({
      tokenId: nextTokenId++,
      owner: to,
      isRetired: false,
      issuedAt: Date.now(),
      issuedBy: mockCurrentAddress,
      amount: 1,
    });
  }
  
  return createMockTransaction();
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<MockTransactionResponse> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const token = mockTokens.find(t => t.tokenId === tokenId);
  if (token && token.owner === from) {
    token.owner = to;
  }
  
  return createMockTransaction();
}

export async function retireCredit(tokenId: number): Promise<MockTransactionResponse> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const token = mockTokens.find(t => t.tokenId === tokenId);
  if (token) {
    token.isRetired = true;
  }
  
  return createMockTransaction();
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockTokens
    .filter(token => token.owner.toLowerCase() === address.toLowerCase())
    .map(token => token.tokenId);
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const token = mockTokens.find(t => t.tokenId === tokenId);
  return token?.isRetired || false;
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const token = mockTokens.find(t => t.tokenId === tokenId);
  return token?.owner || '';
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Mock role assignments
  if (role === 'CERTIFIER_ROLE') {
    return address.toLowerCase() === MOCK_ADDRESSES.certifier.toLowerCase();
  }
  return false;
}

export async function isCertifier(address: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return address.toLowerCase() === MOCK_ADDRESSES.certifier.toLowerCase();
}

// Utility functions
export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

// Error handling
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

// Mock user switching (for demo purposes)
export function switchMockUser(userType: 'certifier' | 'producer1' | 'producer2' | 'buyer1' | 'buyer2' | 'regulator') {
  mockCurrentAddress = MOCK_ADDRESSES[userType];
  mockIsConnected = true;
  return mockCurrentAddress;
}

export function getMockAddresses() {
  return MOCK_ADDRESSES;
}

export function getMockTokens() {
  return [...mockTokens];
}

// Generate mock ledger events
export function generateMockLedgerEvents() {
  const events = [];
  const now = Date.now();
  
  // Generate batch issuance events (more realistic)
  const issuanceEvents = [
    {
      type: 'issued' as const,
      to: MOCK_ADDRESSES.producer1,
      amount: 3,
      fromId: 1,
      toId: 3,
      timestamp: Math.floor((now - 172800000) / 1000), // 2 days ago
      blockNumber: 18000001,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
    {
      type: 'issued' as const,
      to: MOCK_ADDRESSES.producer2,
      amount: 2,
      fromId: 4,
      toId: 5,
      timestamp: Math.floor((now - 259200000) / 1000), // 3 days ago
      blockNumber: 18000002,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
    {
      type: 'issued' as const,
      to: MOCK_ADDRESSES.buyer1,
      amount: 2,
      fromId: 6,
      toId: 7,
      timestamp: Math.floor((now - 345600000) / 1000), // 4 days ago
      blockNumber: 18000003,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
    {
      type: 'issued' as const,
      to: MOCK_ADDRESSES.buyer2,
      amount: 1,
      fromId: 8,
      toId: 8,
      timestamp: Math.floor((now - 432000000) / 1000), // 5 days ago
      blockNumber: 18000004,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
  ];
  
  events.push(...issuanceEvents);
  
  // Generate transfer events
  const transferEvents = [
    {
      type: 'transferred' as const,
      tokenId: 6,
      from: MOCK_ADDRESSES.producer1,
      to: MOCK_ADDRESSES.buyer1,
      timestamp: Math.floor((now - 86400000) / 1000), // 1 day ago
      blockNumber: 18000005,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
    {
      type: 'transferred' as const,
      tokenId: 7,
      from: MOCK_ADDRESSES.producer2,
      to: MOCK_ADDRESSES.buyer1,
      timestamp: Math.floor((now - 129600000) / 1000), // 1.5 days ago
      blockNumber: 18000006,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
  ];
  
  events.push(...transferEvents);
  
  // Generate retirement events
  const retirementEvents = [
    {
      type: 'retired' as const,
      tokenId: 3,
      from: MOCK_ADDRESSES.producer1,
      timestamp: Math.floor((now - 43200000) / 1000), // 12 hours ago
      blockNumber: 18000007,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
    {
      type: 'retired' as const,
      tokenId: 7,
      from: MOCK_ADDRESSES.buyer1,
      timestamp: Math.floor((now - 21600000) / 1000), // 6 hours ago
      blockNumber: 18000008,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    },
  ];
  
  events.push(...retirementEvents);
  
  return events.sort((a, b) => b.timestamp - a.timestamp);
}
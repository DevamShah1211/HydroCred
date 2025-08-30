import { ethers } from 'ethers';
import HydroCredTokenABI from '../abi/HydroCredToken.json';
import { mockWallet, mockEthereum, mockProvider, mockSigner, MOCK_ADDRESSES } from './mockWallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const RPC_URL = import.meta.env.VITE_RPC_URL || '';

// Check if we should use mock blockchain (development mode)
const USE_MOCK_BLOCKCHAIN = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_BLOCKCHAIN === 'true';

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;
let contract: ethers.Contract | null = null;

// Mock contract for development
let mockContract: any = null;

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (USE_MOCK_BLOCKCHAIN) {
    // Return mock provider
    return mockProvider as any;
  }

  if (!provider) {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
}

export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (USE_MOCK_BLOCKCHAIN) {
    // Return mock signer
    return mockSigner as any;
  }

  if (!signer) {
    const providerInstance = await getProvider();
    await providerInstance.send('eth_requestAccounts', []);
    signer = await providerInstance.getSigner();
  }
  return signer;
}

export async function getContract(): Promise<ethers.Contract> {
  if (USE_MOCK_BLOCKCHAIN) {
    // Return mock contract
    if (!mockContract) {
      mockContract = {
        batchIssue: async (to: string, amount: number) => {
          // Simulate transaction
          const tx = await mockWallet.sendTransaction({
            to: '0x0000000000000000000000000000000000000000',
            data: '0x'
          });
          return {
            ...tx,
            wait: async () => mockWallet.waitForTransaction(tx.hash)
          };
        },
        transferFrom: async (from: string, to: string, tokenId: number) => {
          const tx = await mockWallet.sendTransaction({
            to: '0x0000000000000000000000000000000000000000',
            data: '0x'
          });
          return {
            ...tx,
            wait: async () => mockWallet.waitForTransaction(tx.hash)
          };
        },
        retire: async (tokenId: number) => {
          const tx = await mockWallet.sendTransaction({
            to: '0x0000000000000000000000000000000000000000',
            data: '0x'
          });
          return {
            ...tx,
            wait: async () => mockWallet.waitForTransaction(tx.hash)
          };
        },
        tokensOfOwner: async (owner: string) => {
          // Return mock token IDs
          const count = Math.floor(Math.random() * 50) + 10;
          return Array.from({ length: count }, (_, i) => BigInt(i + 1));
        },
        ownerOf: async (tokenId: number) => {
          // Return mock owner
          return mockWallet.getAddress() || MOCK_ADDRESSES.PRODUCER;
        },
        isRetired: async (tokenId: number) => {
          // Return mock retirement status
          return Math.random() > 0.8; // 20% chance of being retired
        },
        hasRole: async (role: string, address: string) => {
          // Mock role checking
          if (role === 'CERTIFIER_ROLE') {
            return address === MOCK_ADDRESSES.CERTIFIER || address === mockWallet.getAddress();
          }
          if (role === 'DEFAULT_ADMIN_ROLE') {
            return address === MOCK_ADDRESSES.CERTIFIER;
          }
          return false;
        },
        CERTIFIER_ROLE: async () => '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
    }
    return mockContract;
  }

  if (!contract) {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured. Please deploy the contract first.');
    }
    const signerInstance = await getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, signerInstance);
  }
  return contract;
}

export async function getReadOnlyContract(): Promise<ethers.Contract> {
  if (USE_MOCK_BLOCKCHAIN) {
    // Return mock contract for read operations
    return await getContract();
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please deploy the contract first.');
  }
  const providerInstance = await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, providerInstance);
}

export async function connectWallet(): Promise<string> {
  try {
    if (USE_MOCK_BLOCKCHAIN) {
      // Auto-connect to mock wallet
      return mockWallet.getAddress() || MOCK_ADDRESSES.CERTIFIER;
    }

    const signerInstance = await getSigner();
    return await signerInstance.getAddress();
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    if (USE_MOCK_BLOCKCHAIN) {
      return mockWallet.getAddress();
    }

    const providerInstance = await getProvider();
    const accounts = await providerInstance.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (error) {
    return null;
  }
}

export async function batchIssueCredits(to: string, amount: number): Promise<ethers.ContractTransactionResponse> {
  const contractInstance = await getContract();
  return await contractInstance.batchIssue(to, amount);
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<ethers.ContractTransactionResponse> {
  const contractInstance = await getContract();
  return await contractInstance.transferFrom(from, to, tokenId);
}

export async function retireCredit(tokenId: number): Promise<ethers.ContractTransactionResponse> {
  const contractInstance = await getContract();
  return await contractInstance.retire(tokenId);
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  const contractInstance = await getReadOnlyContract();
  const tokens = await contractInstance.tokensOfOwner(address);
  return tokens.map((token: bigint) => Number(token));
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.isRetired(tokenId);
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.ownerOf(tokenId);
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.hasRole(role, address);
}

export async function isCertifier(address: string): Promise<boolean> {
  const contractInstance = await getReadOnlyContract();
  const certifierRole = await contractInstance.CERTIFIER_ROLE();
  return await contractInstance.hasRole(certifierRole, address);
}

export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function getExplorerUrl(txHash: string): string {
  if (USE_MOCK_BLOCKCHAIN) {
    // Return mock explorer URL for development
    return `#mock-transaction-${txHash}`;
  }
  
  // Default to Sepolia explorer
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

// Mock blockchain utilities for development
export const MockBlockchain = {
  // Get available mock addresses
  getMockAddresses: () => MOCK_ADDRESSES,
  
  // Connect to mock wallet
  connectMockWallet: (address: string) => mockWallet.connect(address),
  
  // Disconnect mock wallet
  disconnectMockWallet: () => mockWallet.disconnect(),
  
  // Switch mock address
  switchMockAddress: (address: string) => mockWallet.switchAddress(address),
  
  // Get current mock address
  getCurrentMockAddress: () => mockWallet.getAddress(),
  
  // Check if mock wallet is connected
  isMockWalletConnected: () => mockWallet.isConnected()
};
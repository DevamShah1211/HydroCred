import { ethers } from 'ethers';
import HydroCredTokenABI from '../abi/HydroCredToken.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract address with proper checksum formatting
const CONTRACT_ADDRESS_RAW = '0xD21032F5988841970eE3bcE8d9E6e5C4eE902Dff';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || CONTRACT_ADDRESS_RAW;

// Validate and format contract address
let validatedContractAddress: string;
try {
  validatedContractAddress = ethers.getAddress(CONTRACT_ADDRESS);
  console.log('✅ Contract address validated:', validatedContractAddress);
} catch (error) {
  console.error('❌ Invalid contract address:', CONTRACT_ADDRESS);
  validatedContractAddress = CONTRACT_ADDRESS_RAW;
}

// Use only the working RPC endpoint
export const RPC_URL = 'https://ethereum-sepolia.publicnode.com';

// Debug logging
console.log('🔍 Chain.ts environment variables:');
console.log('CONTRACT_ADDRESS:', validatedContractAddress);
console.log('RPC_URL:', RPC_URL);

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;
let contract: ethers.Contract | null = null;
let directProvider: ethers.JsonRpcProvider | null = null;

// RPC configuration - use only the working endpoint

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!provider) {
    if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');
    
    // Check if we're on the correct network (Sepolia)
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0xaa36a7') { // Sepolia chain ID
      console.warn('⚠️ Wrong network detected. Please switch to Sepolia testnet.');
      throw new Error('Please connect to Sepolia testnet');
    }
    
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
}

// Get direct RPC provider with simplified configuration
export async function getDirectProvider(): Promise<ethers.JsonRpcProvider> {
  if (!directProvider) {
    try {
      console.log(`🔗 Connecting to RPC: ${RPC_URL}`);
      const testProvider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Test the connection
      await testProvider.getBlockNumber();
      
      directProvider = testProvider;
      console.log(`✅ Connected to RPC: ${RPC_URL}`);
    } catch (error: any) {
      console.error(`❌ Failed to connect to RPC: ${RPC_URL}`, error.message);
      throw new Error(`RPC connection failed: ${error.message}`);
    }
  }
  return directProvider;
}

export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (!signer) {
    const providerInstance = await getProvider();
    await providerInstance.send('eth_requestAccounts', []);
    signer = await providerInstance.getSigner();
  }
  return signer;
}

export async function getContract(): Promise<ethers.Contract> {
  if (!contract) {
    if (!validatedContractAddress) throw new Error('Contract address not configured.');
    const signerInstance = await getSigner();
    contract = new ethers.Contract(validatedContractAddress, HydroCredTokenABI, signerInstance);
  }
  return contract;
}

export async function getDirectReadOnlyContract(): Promise<ethers.Contract> {
  if (!validatedContractAddress) throw new Error('Contract address not configured.');
  const provider = await getDirectProvider();
  return new ethers.Contract(validatedContractAddress, HydroCredTokenABI, provider);
}

export async function connectWallet(): Promise<string> {
  try {
    // Check network first
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0xaa36a7') { // Sepolia chain ID
      console.log('🔄 Switching to Sepolia testnet...');
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
        console.log('✅ Switched to Sepolia testnet');
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Chain not added, add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          console.log('✅ Added Sepolia testnet');
        } else {
          throw switchError;
        }
      }
    }
    
    const signerInstance = await getSigner();
    return signerInstance.getAddress();
  } catch (error: any) {
    console.error('❌ Failed to connect wallet:', error.message);
    throw error;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const accounts = await (await getProvider()).listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch {
    return null;
  }
}

// New hierarchical system functions

/**
 * Assign a State Admin for a specific state (only Main Admin)
 */
export async function assignStateAdmin(admin: string, state: string): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).assignStateAdmin(admin, state);
}

/**
 * Register a producer with state and city
 */
export async function registerProducer(state: string, city: string): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).registerProducer(state, city);
}

/**
 * Request tokens from State Admin
 */
export async function requestTokens(amount: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).requestTokens(amount);
}

/**
 * Approve a token request (only State Admin of that state)
 */
export async function approveRequest(requestId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).approveRequest(requestId);
}

/**
 * Sell token to buyer (only verified producers)
 */
export async function sellToken(buyer: string, tokenId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).sellToken(buyer, tokenId);
}

/**
 * Check if an address is a verified producer
 */
export async function isVerifiedProducer(producer: string): Promise<boolean> {
  try {
    const contract = await getDirectReadOnlyContract();
    return await contract.isVerifiedProducer(producer);
  } catch {
    return false;
  }
}

/**
 * Get producer's state and city
 */
export async function getProducerInfo(producer: string): Promise<{ state: string; city: string }> {
  try {
    const contract = await getDirectReadOnlyContract();
    const [state, city] = await contract.getProducerInfo(producer);
    return { state, city };
  } catch {
    return { state: '', city: '' };
  }
}

/**
 * Get all requests for a producer
 */
export async function getProducerRequests(producer: string): Promise<number[]> {
  try {
    const contract = await getDirectReadOnlyContract();
    const requests = await contract.getProducerRequests(producer);
    return requests.map((req: bigint) => Number(req));
  } catch {
    return [];
  }
}

/**
 * Get all pending requests for a state
 */
export async function getPendingRequestsForState(state: string): Promise<number[]> {
  try {
    const contract = await getDirectReadOnlyContract();
    const requests = await contract.getPendingRequestsForState(state);
    return requests.map((req: bigint) => Number(req));
  } catch {
    return [];
  }
}

/**
 * Get request details
 */
export async function getRequestDetails(requestId: number): Promise<{
  producer: string;
  amount: number;
  state: string;
  timestamp: number;
  approved: boolean;
  processed: boolean;
}> {
  try {
    const contract = await getDirectReadOnlyContract();
    const [producer, amount, state, timestamp, approved, processed] = await contract.getRequestDetails(requestId);
    return {
      producer,
      amount: Number(amount),
      state,
      timestamp: Number(timestamp),
      approved,
      processed
    };
  } catch {
    return {
      producer: '',
      amount: 0,
      state: '',
      timestamp: 0,
      approved: false,
      processed: false
    };
  }
}

/**
 * Check if current user is main admin
 */


export async function isMainAdmin(): Promise<boolean> {
  try {
    console.log('🔍 Checking if user is Main Admin...');
    console.log('📋 Contract address:', validatedContractAddress);
    
const contract = await getDirectReadOnlyContract();
const mainAdmin = await contract.mainAdmin();
console.log('Main Admin from contract:', mainAdmin);

    
    const currentAddress = await getWalletAddress();
    console.log('👤 Current wallet address:', currentAddress);
    
    if (!currentAddress) {
      console.log('❌ No wallet address found');
      return false;
    }

    // Normalize both addresses
    const normalizedCurrent = ethers.getAddress(currentAddress);
    const normalizedMainAdmin = ethers.getAddress(mainAdmin);
    
    console.log('🔐 Normalized addresses:');
    console.log('  Current:', normalizedCurrent);
    console.log('  Main Admin:', normalizedMainAdmin);
    
    const isAdmin = normalizedCurrent === normalizedMainAdmin;
    console.log('🔐 Is Main Admin:', isAdmin);
    
    return isAdmin;
  } catch (error: any) {
    console.error('❌ Error checking Main Admin status:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
}


/**
 * Check if current user is state admin for a specific state
 */
export async function isStateAdmin(state: string): Promise<boolean> {
  try {
    const contract = await getDirectReadOnlyContract();
    const stateAdmin = await contract.stateAdmin(state);
    const currentAddress = await getWalletAddress();
    return currentAddress === stateAdmin;
  } catch {
    return false;
  }
}

/**
 * Get all states where current user is admin
 */
export async function getAdminStates(): Promise<string[]> {
  try {
    const currentAddress = await getWalletAddress();
    if (!currentAddress) return [];
    
    // This would require a view function in the contract to get all states
    // For now, we'll check common Indian states
    const commonStates = [
      'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana',
      'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal'
    ];
    
    const contract = await getDirectReadOnlyContract();
    const adminStates: string[] = [];
    
    for (const state of commonStates) {
      try {
        const stateAdmin = await contract.stateAdmin(state);
        if (stateAdmin === currentAddress) {
          adminStates.push(state);
        }
      } catch {
        continue;
      }
    }
    
    return adminStates;
  } catch {
    return [];
  }
}

// Test function to verify contract connection
export async function testContractConnection(): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    console.log('🧪 Testing contract connection...');
    console.log('📋 Contract address:', validatedContractAddress);
    
    const contract = await getDirectReadOnlyContract();
    console.log('✅ Contract instance created');

    // Optional: Only call if the function exists
    let name = '', symbol = '';
    try { name = await contract.name(); } catch { console.warn('⚠️ name() not available'); }
    try { symbol = await contract.symbol(); } catch { console.warn('⚠️ symbol() not available'); }

    const mainAdmin = await contract.mainAdmin();

    console.log('📋 Contract details:', { name, symbol, mainAdmin });

    return { success: true, details: { name, symbol, mainAdmin } };
  } catch (error: any) {
    console.error('❌ Contract connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}


// Legacy functions for backward compatibility
export async function batchIssueCredits(to: string, amount: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).batchIssue(to, amount);
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).transferFrom(from, to, tokenId);
}

export async function retireCredit(tokenId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).retire(tokenId);
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  console.log('🔄 Getting owned tokens for address:', address);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const contract = await getDirectReadOnlyContract();
      const tokens = await contract.tokensOfOwner(address);
      const tokenArray = tokens.map((token: bigint) => Number(token));
      console.log(`✅ Success! Found ${tokenArray.length} tokens:`, tokenArray);
      return tokenArray;
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === 3) return [];
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  try {
    const contract = await getDirectReadOnlyContract();
    return await contract.isRetired(tokenId);
  } catch {
    return false;
  }
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  const contract = await getDirectReadOnlyContract();
  return await contract.ownerOf(tokenId);
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  const contract = await getDirectReadOnlyContract();
  return await contract.hasRole(role, address);
}

export async function listenForTransfers(callback: (from: string, to: string, tokenId: number) => void) {
  const contractInstance = await getDirectReadOnlyContract();
  contractInstance.on('Transfer', (from: string, to: string, tokenId: bigint) => {
    console.log('🔄 Transfer event detected:', { from, to, tokenId: Number(tokenId) });
    callback(from, to, Number(tokenId));
  });
  console.log('👂 Listening for Transfer events...');
}

export async function waitForTransactionAndRefresh(tx: ethers.ContractTransactionResponse, refreshCallback: () => void) {
  const receipt = await tx.wait();
  if (receipt?.status === 1) setTimeout(refreshCallback, 2000);
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
  if (error.code === 4001) return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  if (error.code === -32603) return new ChainError('Internal JSON-RPC error', 'RPC_ERROR');
  if (error.message?.includes('insufficient funds')) return new ChainError('Insufficient funds for transaction', 'INSUFFICIENT_FUNDS');
  if (error.message?.includes('user rejected')) return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  return new ChainError(error.message || 'Unknown blockchain error', 'UNKNOWN');
}


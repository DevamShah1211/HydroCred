import { ethers } from 'ethers';
import HydroCredTokenABI from '../abi/HydroCredToken.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const RPC_URL = import.meta.env.VITE_RPC_URL || '';
const FAKE_MODE = import.meta.env.VITE_FAKE_MODE === 'true';
const FAKE_STATE_KEY = 'hydrocred_fake_state';
const FAKE_WALLET_KEY = 'hydrocred_fake_wallet';

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;
let contract: ethers.Contract | null = null;

type FakeCreditEvent = {
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
};

type FakeToken = {
  tokenId: number;
  owner: string;
  retired: boolean;
};

type FakeState = {
  nextTokenId: number;
  nextBlockNumber: number;
  tokens: FakeToken[];
  events: FakeCreditEvent[];
  roles: {
    certifiers: string[];
  };
};

function readFakeState(): FakeState {
  const raw = localStorage.getItem(FAKE_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as FakeState;
      return parsed;
    } catch (_) {}
  }
  const initial: FakeState = {
    nextTokenId: 1,
    nextBlockNumber: 1,
    tokens: [],
    events: [],
    roles: { certifiers: [] },
  };
  localStorage.setItem(FAKE_STATE_KEY, JSON.stringify(initial));
  return initial;
}

function writeFakeState(state: FakeState) {
  localStorage.setItem(FAKE_STATE_KEY, JSON.stringify(state));
}

function getOrCreateFakeWallet(): string {
  let addr = localStorage.getItem(FAKE_WALLET_KEY);
  if (!addr) {
    const random = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    addr = `0x${random}`;
    localStorage.setItem(FAKE_WALLET_KEY, addr);
  }
  return addr;
}

function createFakeTx(waitImpl: () => Promise<any>): any {
  return {
    wait: waitImpl,
  } as any;
}

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!provider) {
    if (FAKE_MODE) {
      throw new Error('Provider not available in FAKE mode');
    }
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
}

export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (FAKE_MODE) {
    throw new Error('Signer not available in FAKE mode');
  }
  if (!signer) {
    const providerInstance = await getProvider();
    await providerInstance.send('eth_requestAccounts', []);
    signer = await providerInstance.getSigner();
  }
  return signer;
}

export async function getContract(): Promise<ethers.Contract> {
  if (FAKE_MODE) {
    throw new Error('Contract not available in FAKE mode');
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
  if (FAKE_MODE) {
    throw new Error('Read-only contract not available in FAKE mode');
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please deploy the contract first.');
  }
  const providerInstance = await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, providerInstance);
}

export async function connectWallet(): Promise<string> {
  try {
    if (FAKE_MODE) {
      const address = getOrCreateFakeWallet();
      // Optionally mark as certifier on first connect
      const state = readFakeState();
      if (!state.roles.certifiers.includes(address)) {
        state.roles.certifiers.push(address);
        writeFakeState(state);
      }
      return address;
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
    if (FAKE_MODE) {
      return localStorage.getItem(FAKE_WALLET_KEY) || null;
    }
    const providerInstance = await getProvider();
    const accounts = await providerInstance.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (error) {
    return null;
  }
}

export async function batchIssueCredits(to: string, amount: number): Promise<ethers.ContractTransactionResponse> {
  if (FAKE_MODE) {
    const now = Math.floor(Date.now() / 1000);
    const txHash = ethers.hexlify(ethers.randomBytes(32));
    const state = readFakeState();
    const startId = state.nextTokenId;
    const endId = startId + amount - 1;

    for (let i = 0; i < amount; i++) {
      state.tokens.push({ tokenId: state.nextTokenId, owner: to, retired: false });
      state.nextTokenId += 1;
    }

    state.events.push({
      type: 'issued',
      to,
      amount,
      fromId: startId,
      toId: endId,
      timestamp: now,
      blockNumber: state.nextBlockNumber,
      transactionHash: txHash,
    });
    state.nextBlockNumber += 1;
    writeFakeState(state);

    return createFakeTx(async () => ({ status: 1, transactionHash: txHash, blockNumber: state.nextBlockNumber - 1 })) as any;
  }
  const contractInstance = await getContract();
  return await contractInstance.batchIssue(to, amount);
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<ethers.ContractTransactionResponse> {
  if (FAKE_MODE) {
    const now = Math.floor(Date.now() / 1000);
    const txHash = ethers.hexlify(ethers.randomBytes(32));
    const state = readFakeState();
    const token = state.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    if (token.retired) {
      throw new Error(`Token ${tokenId} is retired`);
    }
    if (token.owner.toLowerCase() !== from.toLowerCase()) {
      throw new Error('Only owner can transfer token');
    }
    token.owner = to;
    state.events.push({
      type: 'transferred',
      tokenId,
      from,
      to,
      timestamp: now,
      blockNumber: state.nextBlockNumber,
      transactionHash: txHash,
    });
    state.nextBlockNumber += 1;
    writeFakeState(state);
    return createFakeTx(async () => ({ status: 1, transactionHash: txHash, blockNumber: state.nextBlockNumber - 1 })) as any;
  }
  const contractInstance = await getContract();
  return await contractInstance.transferFrom(from, to, tokenId);
}

export async function retireCredit(tokenId: number): Promise<ethers.ContractTransactionResponse> {
  if (FAKE_MODE) {
    const now = Math.floor(Date.now() / 1000);
    const txHash = ethers.hexlify(ethers.randomBytes(32));
    const state = readFakeState();
    const token = state.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    token.retired = true;
    state.events.push({
      type: 'retired',
      tokenId,
      from: token.owner,
      timestamp: now,
      blockNumber: state.nextBlockNumber,
      transactionHash: txHash,
    });
    state.nextBlockNumber += 1;
    writeFakeState(state);
    return createFakeTx(async () => ({ status: 1, transactionHash: txHash, blockNumber: state.nextBlockNumber - 1 })) as any;
  }
  const contractInstance = await getContract();
  return await contractInstance.retire(tokenId);
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  if (FAKE_MODE) {
    const state = readFakeState();
    return state.tokens.filter(t => t.owner.toLowerCase() === address.toLowerCase()).map(t => t.tokenId);
  }
  const contractInstance = await getReadOnlyContract();
  const tokens = await contractInstance.tokensOfOwner(address);
  return tokens.map((token: bigint) => Number(token));
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  if (FAKE_MODE) {
    const state = readFakeState();
    const token = state.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      return false;
    }
    return token.retired;
  }
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.isRetired(tokenId);
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  if (FAKE_MODE) {
    const state = readFakeState();
    const token = state.tokens.find(t => t.tokenId === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    return token.owner;
  }
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.ownerOf(tokenId);
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  if (FAKE_MODE) {
    return true;
  }
  const contractInstance = await getReadOnlyContract();
  return await contractInstance.hasRole(role, address);
}

export async function isCertifier(address: string): Promise<boolean> {
  if (FAKE_MODE) {
    return true;
  }
  const contractInstance = await getReadOnlyContract();
  const certifierRole = await contractInstance.CERTIFIER_ROLE();
  return await contractInstance.hasRole(certifierRole, address);
}

export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function getExplorerUrl(txHash: string): string {
  if (FAKE_MODE) {
    return '#';
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
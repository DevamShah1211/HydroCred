import { ethers } from 'ethers';
import { config } from '../config/env';
import HydroCredTokenABI from '../abi/HydroCredToken.json';
import { getCreditEvents as getMockCreditEvents } from './mockChain';

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

export function getProvider() {
  if (!provider && config.rpcUrl) {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }
  return provider;
}

export function getContract() {
  if (!contract && config.contractAddress) {
    const providerInstance = getProvider();
    if (providerInstance) {
      contract = new ethers.Contract(
        config.contractAddress,
        HydroCredTokenABI,
        providerInstance
      );
    }
  }
  return contract;
}

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
  // Check if we should use mock data
  const useMockChain = process.env.USE_MOCK_CHAIN !== 'false';
  
  if (useMockChain) {
    return await getMockCreditEvents(fromBlock);
  }
  
  const contractInstance = getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }

  const events: CreditEvent[] = [];

  try {
    // Get CreditsIssued events
    const issuedFilter = contractInstance.filters.CreditsIssued();
    const issuedEvents = await contractInstance.queryFilter(issuedFilter, fromBlock);
    
    for (const event of issuedEvents) {
      if ('args' in event && event.args) {
        const block = await event.getBlock();
        events.push({
          type: 'issued',
          to: event.args[0] as string,
          amount: Number(event.args[1]),
          fromId: Number(event.args[2]),
          toId: Number(event.args[3]),
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Get Transfer events (excluding mints)
    const transferFilter = contractInstance.filters.Transfer();
    const transferEvents = await contractInstance.queryFilter(transferFilter, fromBlock);
    
    for (const event of transferEvents) {
      if ('args' in event && event.args && event.args[0] !== ethers.ZeroAddress) { // Exclude mints
        const block = await event.getBlock();
        events.push({
          type: 'transferred',
          tokenId: Number(event.args[2]),
          from: event.args[0] as string,
          to: event.args[1] as string,
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Get CreditRetired events
    const retiredFilter = contractInstance.filters.CreditRetired();
    const retiredEvents = await contractInstance.queryFilter(retiredFilter, fromBlock);
    
    for (const event of retiredEvents) {
      if ('args' in event && event.args) {
        const block = await event.getBlock();
        events.push({
          type: 'retired',
          tokenId: Number(event.args[1]),
          from: event.args[0] as string,
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Sort by block number and timestamp
    events.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber - b.blockNumber;
      }
      return a.timestamp - b.timestamp;
    });

    return events;
  } catch (error) {
    console.error('Error fetching credit events:', error);
    throw error;
  }
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  const contractInstance = getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }
  
  try {
    return await contractInstance.ownerOf(tokenId);
  } catch (error) {
    throw new Error(`Token ${tokenId} does not exist`);
  }
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  const contractInstance = getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }
  
  return await contractInstance.isRetired(tokenId);
}
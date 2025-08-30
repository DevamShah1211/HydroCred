import { MockChainService, CreditEvent, TransactionResponse } from './mockChainService';

// Check if we should use mock blockchain (development mode)
const USE_MOCK_BLOCKCHAIN = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_BLOCKCHAIN === 'true';

/**
 * Get all credit events from the blockchain
 */
export async function getCreditEvents(fromBlock: number = 0): Promise<CreditEvent[]> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.getCreditEvents(fromBlock);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Batch issue credits to a producer
 */
export async function batchIssueCredits(to: string, amount: number, issuedBy: string): Promise<TransactionResponse> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.batchIssueCredits(to, amount, issuedBy);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Transfer a credit from one address to another
 */
export async function transferCredit(from: string, to: string, tokenId: number): Promise<TransactionResponse> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.transferCredit(from, to, tokenId);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Retire a credit (make it non-transferable)
 */
export async function retireCredit(tokenId: number, retiredBy: string): Promise<TransactionResponse> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.retireCredit(tokenId, retiredBy);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Get all tokens owned by an address
 */
export async function getOwnedTokens(owner: string): Promise<number[]> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.getOwnedTokens(owner);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Get the owner of a specific token
 */
export async function getTokenOwner(tokenId: number): Promise<string> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.getTokenOwner(tokenId);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Check if a token is retired
 */
export async function isTokenRetired(tokenId: number): Promise<boolean> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.isTokenRetired(tokenId);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Check if an address has a specific role
 */
export async function hasRole(role: string, address: string): Promise<boolean> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.hasRole(role, address);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Get the balance of credits for an address
 */
export async function getBalance(address: string): Promise<number> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.getBalance(address);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Get transaction details by hash
 */
export async function getTransaction(hash: string): Promise<TransactionResponse | null> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.getTransaction(hash);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Check if an address is a certifier
 */
export async function isCertifier(address: string): Promise<boolean> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.isCertifier(address);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

/**
 * Check if an address is an admin
 */
export async function isAdmin(address: string): Promise<boolean> {
  if (USE_MOCK_BLOCKCHAIN) {
    return await MockChainService.isAdmin(address);
  }
  
  // TODO: Implement real blockchain integration
  throw new Error('Real blockchain integration not implemented yet');
}

// Export types for use in other modules
export type { CreditEvent, TransactionResponse };

// Export mock blockchain utilities for development
export const MockBlockchain = {
  addCertifier: MockChainService.addCertifier,
  removeCertifier: MockChainService.removeCertifier,
  addAdmin: MockChainService.addAdmin,
  reset: MockChainService.reset,
  getMockData: MockChainService.getMockData
};
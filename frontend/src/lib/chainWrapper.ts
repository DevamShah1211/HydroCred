// Unified chain library that automatically switches between real and mock implementations
import { USE_MOCK_DATA } from './config';

// Import both implementations
import * as realChain from './chain';
import * as mockChain from './mockChain';

// Export the appropriate implementation based on configuration
export const {
  CONTRACT_ADDRESS,
  RPC_URL,
  DEV_MODE,
  getProvider,
  getSigner,
  getContract,
  getReadOnlyContract,
  isContractConfigured,
  isDevelopmentMode,
  connectWallet,
  getWalletAddress,
  batchIssueCredits,
  transferCredit,
  retireCredit,
  getOwnedTokens,
  isTokenRetired,
  getTokenOwner,
  hasRole,
  isCertifier,
  formatTokenId,
  getExplorerUrl,
  ChainError,
  handleChainError,
} = USE_MOCK_DATA ? mockChain : realChain;

// Mock-specific exports (only available when using mock data)
export const switchMockUser = USE_MOCK_DATA ? mockChain.switchMockUser : undefined;
export const getMockAddresses = USE_MOCK_DATA ? mockChain.getMockAddresses : undefined;
export const getMockTokens = USE_MOCK_DATA ? mockChain.getMockTokens : undefined;
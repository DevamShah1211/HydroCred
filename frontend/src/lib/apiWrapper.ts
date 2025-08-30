// Unified API library that automatically switches between real and mock implementations
import { USE_MOCK_DATA } from './config';

// Import both implementations
import * as realApi from './api';
import * as mockBackend from './mockBackend';

// Export the appropriate implementation based on configuration
export const {
  uploadDocument,
  getLedgerData,
  getTokenMetadata,
  checkHealth,
} = USE_MOCK_DATA ? mockBackend : realApi;

// Re-export types
export type { CreditEvent, LedgerResponse, UploadResponse } from './api';
// Mock API functionality for development and demo purposes
import { generateMockLedgerEvents } from './mockChain';

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

export interface LedgerResponse {
  success: boolean;
  events: CreditEvent[];
  count: number;
  fromBlock: number;
}

export interface UploadResponse {
  success: boolean;
  file: {
    id: string;
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
    ipfsHash: string | null;
    encryptedPath: string;
  };
}

// Mock file uploads
export async function uploadDocument(file: File): Promise<UploadResponse> {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    file: {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.name,
      filename: `mock_${Date.now()}_${file.name}`,
      size: file.size,
      mimetype: file.type,
      uploadedAt: new Date().toISOString(),
      ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`, // Mock IPFS hash
      encryptedPath: `/encrypted/mock_${Date.now()}_${file.name}`,
    }
  };
}

// Mock ledger data
export async function getLedgerData(fromBlock?: number): Promise<LedgerResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const events = generateMockLedgerEvents();
  
  return {
    success: true,
    events,
    count: events.length,
    fromBlock: fromBlock || 0,
  };
}

// Mock token metadata
export async function getTokenMetadata(tokenId: number) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    tokenId,
    metadata: {
      name: `HydroCred Token #${tokenId.toString().padStart(4, '0')}`,
      description: 'Green Hydrogen Production Credit - Verified and Tradeable',
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
      attributes: [
        { trait_type: 'Type', value: 'Green Hydrogen Credit' },
        { trait_type: 'Unit', value: '1 verified unit' },
        { trait_type: 'Status', value: 'Active' },
        { trait_type: 'Issued Date', value: new Date().toLocaleDateString() },
      ]
    }
  };
}

// Mock health check
export async function checkHealth() {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HydroCred Mock API',
    mode: 'development'
  };
}
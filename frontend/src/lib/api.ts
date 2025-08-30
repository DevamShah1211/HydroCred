import axios from 'axios';
import { getCreditEvents as getMockCreditEvents } from './mockChain';

const API_BASE_URL = 'http://localhost:5055/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_CHAIN !== 'false'; // Default to true for demo

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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

export async function uploadDocument(file: File): Promise<UploadResponse> {
  if (USE_MOCK_API) {
    // Mock file upload
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      success: true,
      file: {
        id: Math.random().toString(36).substring(7),
        originalName: file.name,
        filename: `upload-${Date.now()}-${file.name}`,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date().toISOString(),
        ipfsHash: null,
        encryptedPath: `encrypted-${Math.random().toString(36).substring(7)}`
      }
    };
  }
  
  const formData = new FormData();
  formData.append('document', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

export async function getLedgerData(fromBlock?: number): Promise<LedgerResponse> {
  if (USE_MOCK_API) {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const events = getMockCreditEvents(fromBlock || 0);
    return {
      success: true,
      events: events.map(tx => ({
        type: tx.type as 'issued' | 'transferred' | 'retired',
        tokenId: tx.tokenId,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        fromId: tx.fromId,
        toId: tx.toId,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber,
        transactionHash: tx.hash
      })),
      count: events.length,
      fromBlock: fromBlock || 0
    };
  }
  
  const params = fromBlock ? { fromBlock: fromBlock.toString() } : {};
  const response = await api.get<LedgerResponse>('/ledger', { params });
  return response.data;
}

export async function getTokenMetadata(tokenId: number) {
  if (USE_MOCK_API) {
    // Mock token metadata
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    return {
      success: true,
      tokenId,
      metadata: {
        name: `HydroCred Token #${tokenId}`,
        description: 'Green Hydrogen Production Credit',
        attributes: [
          { trait_type: 'Type', value: 'Green Hydrogen Credit' },
          { trait_type: 'Unit', value: '1 verified unit' },
          { trait_type: 'Status', value: 'Active' }
        ]
      }
    };
  }
  
  const response = await api.get(`/token/${tokenId}`);
  return response.data;
}

export async function checkHealth() {
  if (USE_MOCK_API) {
    // Mock health check
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'HydroCred Mock API'
    };
  }
  
  const response = await api.get('/health');
  return response.data;
}

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to backend server');
    }
    
    throw error;
  }
);
import axios from 'axios';
import { ethers } from 'ethers';

const API_BASE_URL = 'http://localhost:5055/api';
const FAKE_MODE = import.meta.env.VITE_FAKE_MODE === 'true';
const FAKE_STATE_KEY = 'hydrocred_fake_state';

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
  if (FAKE_MODE) {
    const id = ethers.hexlify(ethers.randomBytes(8));
    return {
      success: true,
      file: {
        id,
        originalName: file.name,
        filename: `${id}-${file.name}`,
        size: file.size,
        mimetype: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        ipfsHash: null,
        encryptedPath: 'local://fake',
      },
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
  if (FAKE_MODE) {
    const raw = localStorage.getItem(FAKE_STATE_KEY);
    const state = raw ? JSON.parse(raw) : { events: [] };
    const allEvents: CreditEvent[] = state.events || [];
    const filtered = fromBlock ? allEvents.filter((e: CreditEvent) => e.blockNumber >= fromBlock) : allEvents;
    return {
      success: true,
      events: filtered,
      count: filtered.length,
      fromBlock: fromBlock || 0,
    };
  }
  const params = fromBlock ? { fromBlock: fromBlock.toString() } : {};
  const response = await api.get<LedgerResponse>('/ledger', { params });
  return response.data;
}

export async function getTokenMetadata(tokenId: number) {
  if (FAKE_MODE) {
    return {
      success: true,
      tokenId,
      metadata: {
        name: `HydroCred Token #${tokenId}`,
        description: 'Green Hydrogen Production Credit',
        attributes: [
          { trait_type: 'Type', value: 'Green Hydrogen Credit' },
          { trait_type: 'Unit', value: '1 verified unit' }
        ]
      }
    };
  }
  const response = await api.get(`/token/${tokenId}`);
  return response.data;
}

export async function checkHealth() {
  if (FAKE_MODE) {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'HydroCred Backend API (FAKE)' };
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
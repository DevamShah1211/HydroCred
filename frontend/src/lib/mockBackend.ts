// Mock backend server functionality
import { generateMockLedgerEvents } from './mockChain';

// Mock server state
let mockServerRunning = true;
let mockApiDelay = 500; // Base delay for API calls

// Simulate server responses
export async function mockApiCall<T>(response: T, delay: number = mockApiDelay): Promise<T> {
  if (!mockServerRunning) {
    throw new Error('Cannot connect to backend server');
  }
  
  // Add random delay variation
  const actualDelay = delay + Math.random() * 200;
  await new Promise(resolve => setTimeout(resolve, actualDelay));
  
  // Simulate occasional server errors (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Server error - please try again later');
  }
  
  return response;
}

// Override API functions to use mock backend
export async function getLedgerData(fromBlock?: number) {
  return mockApiCall({
    success: true,
    events: generateMockLedgerEvents(),
    count: generateMockLedgerEvents().length,
    fromBlock: fromBlock || 0,
  });
}

export async function uploadDocument(file: File) {
  return mockApiCall({
    success: true,
    file: {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.name,
      filename: `mock_${Date.now()}_${file.name}`,
      size: file.size,
      mimetype: file.type,
      uploadedAt: new Date().toISOString(),
      ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
      encryptedPath: `/encrypted/mock_${Date.now()}_${file.name}`,
    }
  }, 2000); // Longer delay for file uploads
}

export async function getTokenMetadata(tokenId: number) {
  return mockApiCall({
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
  });
}

export async function checkHealth() {
  return mockApiCall({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HydroCred Mock Backend API',
    mode: 'development'
  });
}

// Mock server control (for demo purposes)
export function setMockServerStatus(running: boolean) {
  mockServerRunning = running;
}

export function setMockApiDelay(delay: number) {
  mockApiDelay = delay;
}
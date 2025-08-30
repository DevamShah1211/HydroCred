// Configuration for switching between real and mock implementations

export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true' || 
                             import.meta.env.DEV || 
                             !import.meta.env.VITE_CONTRACT_ADDRESS ||
                             import.meta.env.VITE_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000';

console.log('🔧 Configuration:', {
  useMockData: USE_MOCK_DATA,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  isDev: import.meta.env.DEV,
});
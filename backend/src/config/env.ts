import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5056,
  rpcUrl: process.env.RPC_URL || 'https://ethereum-sepolia.publicnode.com',
  contractAddress: process.env.CONTRACT_ADDRESS || '0xD21032F5988841970eE3bcE8d9E6e5C4eE902Dff',
  aesKey: process.env.AES_KEY || 'hydrocred_encryption_key_32_chars_min',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const required = ['CONTRACT_ADDRESS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work properly.');
  }
  
  return missing.length === 0;
}
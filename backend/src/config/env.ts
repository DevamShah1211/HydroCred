import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5055,
  rpcUrl: process.env.RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  registryAddress: process.env.REGISTRY_ADDRESS || '',
  roleManagerAddress: process.env.ROLE_MANAGER_ADDRESS || '',
  marketplaceAddress: process.env.MARKETPLACE_ADDRESS || '',
  aesKey: process.env.AES_KEY || 'default_key_change_me_32_chars_min',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const required = ['RPC_URL', 'CONTRACT_ADDRESS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work properly.');
  }
  
  return missing.length === 0;
}
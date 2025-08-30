#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 HydroCred Setup Script');
console.log('========================\n');

// Make script executable
try {
  execSync('chmod +x scripts/start-dev.sh', { stdio: 'pipe' });
} catch (error) {
  // Ignore errors
}

// Check if .env exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('📝 Copying env.example to .env...');
  
  const envExamplePath = path.join(__dirname, '../env.example');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Created .env file');
  console.log('⚠️  Please edit .env file with your configuration:');
  console.log('   - RPC_URL: Your Infura/Alchemy endpoint');
  console.log('   - PRIVATE_KEY: Your wallet private key for deployment');
  console.log('   - AES_KEY: 32+ character encryption key\n');
} else {
  console.log('✅ .env file exists');
}

// Check if contract is deployed
const contractAddressFile = path.join(__dirname, '../blockchain/contract-address.json');
if (!fs.existsSync(contractAddressFile)) {
  console.log('❌ Contract not deployed yet');
  console.log('📋 To deploy the contract:');
  console.log('   1. cd blockchain');
  console.log('   2. npm install');
  console.log('   3. npx hardhat compile');
  console.log('   4. npx hardhat run scripts/deploy.ts --network sepolia');
  console.log('   5. npm run update-addresses\n');
} else {
  console.log('✅ Contract deployed');
  
  // Update environment files
  try {
    execSync('node scripts/update-contract-address.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to update contract addresses:', error.message);
  }
}

// Check dependencies
console.log('📦 Checking dependencies...');

const directories = ['frontend', 'backend', 'blockchain'];
for (const dir of directories) {
  const packageJsonPath = path.join(__dirname, `../${dir}/package.json`);
  const nodeModulesPath = path.join(__dirname, `../${dir}/node_modules`);
  
  if (fs.existsSync(packageJsonPath)) {
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`❌ ${dir} dependencies not installed`);
      console.log(`   Run: cd ${dir} && npm install`);
    } else {
      console.log(`✅ ${dir} dependencies installed`);
    }
  }
}

console.log('\n🎉 Setup check complete!');
console.log('📚 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md');
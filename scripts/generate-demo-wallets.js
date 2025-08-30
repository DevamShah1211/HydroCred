const { ethers } = require('ethers');

console.log('🔐 Generating Demo Wallets for HydroCred Testing\n');

const wallets = [];

for (let i = 1; i <= 10; i++) {
  const wallet = ethers.Wallet.createRandom();
  wallets.push({
    id: i,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || 'N/A'
  });
}

console.log('📋 Demo Wallets Generated:\n');

wallets.forEach(wallet => {
  console.log(`Wallet ${wallet.id}:`);
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Private Key: ${wallet.privateKey}`);
  console.log(`  Mnemonic: ${wallet.mnemonic}`);
  console.log('');
});

console.log('💡 Usage Instructions:');
console.log('1. Import these private keys into MetaMask for testing');
console.log('2. Use the mnemonic phrases to restore wallets in other wallets');
console.log('3. These wallets are for development/testing only - never use in production');
console.log('4. Each wallet starts with 0 ETH - you\'ll need to fund them for gas fees');
console.log('5. For Polygon testnet, you can get test MATIC from a faucet');

console.log('\n⚠️  SECURITY WARNING:');
console.log('- These are demo wallets with real private keys');
console.log('- Never share private keys or use them for real funds');
console.log('- Delete this file after copying the information');
console.log('- Use only in isolated development environments');

// Save to file
const fs = require('fs');
const outputPath = 'demo-wallets.json';

try {
  fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2));
  console.log(`\n✅ Demo wallets saved to: ${outputPath}`);
} catch (error) {
  console.error('❌ Failed to save demo wallets:', error.message);
}
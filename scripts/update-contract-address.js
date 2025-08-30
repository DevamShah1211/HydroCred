const fs = require('fs');
const path = require('path');

// Reads blockchain/contract-address.json and writes .env variables and frontend env
function main() {
  const addrPath = path.join(__dirname, '../blockchain/contract-address.json');
  if (!fs.existsSync(addrPath)) {
    console.error('contract-address.json not found. Deploy first.');
    process.exit(1);
  }
  const info = JSON.parse(fs.readFileSync(addrPath, 'utf8'));

  // Update root .env (or create)
  const envPath = path.join(__dirname, '../.env');
  let env = '';
  if (fs.existsSync(envPath)) env = fs.readFileSync(envPath, 'utf8');
  const setKV = (k, v) => {
    const re = new RegExp(`^${k}=.*$`, 'm');
    if (re.test(env)) env = env.replace(re, `${k}=${v}`); else env += `\n${k}=${v}`;
  };
  setKV('CONTRACT_ADDRESS', info.token);
  setKV('REGISTRY_ADDRESS', info.registry);
  setKV('ROLE_MANAGER_ADDRESS', info.roleManager);
  setKV('MARKETPLACE_ADDRESS', info.marketplace);
  fs.writeFileSync(envPath, env.trim() + '\n');

  // Update frontend env
  const feEnvPath = path.join(__dirname, '../frontend/.env');
  let fe = '';
  if (fs.existsSync(feEnvPath)) fe = fs.readFileSync(feEnvPath, 'utf8');
  const setFE = (k, v) => {
    const re = new RegExp(`^${k}=.*$`, 'm');
    if (re.test(fe)) fe = fe.replace(re, `${k}=${v}`); else fe += `\n${k}=${v}`;
  };
  setFE('VITE_CONTRACT_ADDRESS', info.token);
  setFE('VITE_REGISTRY_ADDRESS', info.registry);
  setFE('VITE_ROLE_MANAGER_ADDRESS', info.roleManager);
  setFE('VITE_MARKETPLACE_ADDRESS', info.marketplace);
  fs.writeFileSync(feEnvPath, fe.trim() + '\n');

  console.log('Updated .env and frontend/.env with deployed addresses.');
}

main();

const fs = require('fs');
const path = require('path');

// Read contract address from blockchain deployment
const contractAddressFile = path.join(__dirname, '../blockchain/contract-address.json');

if (!fs.existsSync(contractAddressFile)) {
  console.log('❌ Contract address file not found. Deploy the contract first.');
  process.exit(1);
}

const contractInfo = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
const contractAddress = contractInfo.address;

console.log(`📝 Updating contract address: ${contractAddress}`);

// Update frontend .env.local
const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
const frontendEnvContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log('✅ Updated frontend/.env.local');

// Update backend .env.local
const backendEnvPath = path.join(__dirname, '../backend/.env.local');
const backendEnvContent = `CONTRACT_ADDRESS=${contractAddress}\n`;
fs.writeFileSync(backendEnvPath, backendEnvContent);
console.log('✅ Updated backend/.env.local');

console.log('🎉 Contract address updated in all environments');
const fs = require('fs');
const path = require('path');

// Copy ABIs to frontend and backend for Token, Registry, RoleManager, Marketplace
const contracts = [
  { file: 'HydroCredToken.sol', name: 'HydroCredToken' },
  { file: 'CertificationRegistry.sol', name: 'CertificationRegistry' },
  { file: 'RoleManager.sol', name: 'RoleManager' },
  { file: 'Marketplace.sol', name: 'Marketplace' },
];

const frontendAbiPath = path.join(__dirname, '../../frontend/src/abi');
const backendAbiPath = path.join(__dirname, '../../backend/src/abi');

fs.mkdirSync(frontendAbiPath, { recursive: true });
fs.mkdirSync(backendAbiPath, { recursive: true });

let copied = 0;
for (const c of contracts) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${c.file}/${c.name}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.log(`❌ Artifact for ${c.name} not found at ${artifactPath}`);
    continue;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = JSON.stringify(artifact.abi, null, 2);
  fs.writeFileSync(path.join(frontendAbiPath, `${c.name}.json`), abi);
  fs.writeFileSync(path.join(backendAbiPath, `${c.name}.json`), abi);
  copied++;
}

if (copied > 0) {
  console.log(`✅ Copied ${copied} ABI(s) to frontend and backend`);
} else {
  console.log('❌ No ABIs copied. Run compile first.');
}
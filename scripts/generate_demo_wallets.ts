import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const roles = [
  'Country Admin',
  'State Admin',
  'City Admin 1',
  'City Admin 2',
  'Producer 1',
  'Producer 2',
  'Producer 3',
  'Buyer 1',
  'Buyer 2',
  'Auditor',
];

const outPath = path.join(__dirname, '../DEMO_WALLETS.json');

const wallets = roles.map((name) => {
  const wallet = ethers.Wallet.createRandom();
  return {
    name,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || '',
  };
});

fs.writeFileSync(outPath, JSON.stringify(wallets, null, 2));
console.log('Wrote demo wallets to', outPath);


# HydroCred 🌊

Blockchain-based Green Hydrogen Credit System (ERC-20 gasless-style H2 token)

HydroCred tracks, certifies, and trades green hydrogen credits as fungible tokens (1 H2 = 1 kg). Credits are minted only when a producer submits a request and a City Admin certifies it with an EIP-712 signature. Admins cannot mint to themselves directly.

![HydroCred Logo](logo/hydrocred.svg)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask
- Polygon Amoy RPC (or any EVM testnet)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd HydroCred
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your RPC URL and private key
   ```

3. **Compile and deploy contracts:**
   ```bash
   npm run chain:compile
   npm run chain:deploy
   npm run chain:export-abi
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:5055

## 🏗️ Architecture

```
HydroCred/
├── contracts/          # Smart contracts (Hardhat)
├── backend/            # Express API server  
├── frontend/           # React + Vite app
├── logo/              # Brand assets
└── scripts/           # Automation scripts
```

## 🔐 Roles & Permissions

### 🛡️ Certifier
- **Issue verified credits** to hydrogen producers
- **Batch issuance** up to 1000 credits at once
- **View issuance history** with transaction links

### 🏭 Producer  
- **Manage owned credits** with real-time status
- **Transfer credits** to buyers or other parties
- **View credit portfolio** (active vs. retired)

### 👥 Buyer
- **Purchase credits** from producers
- **Retire credits** for carbon offset (permanent)
- **Download retirement proofs** (JSON certificates)

### 📊 Regulator
- **Monitor all transactions** with comprehensive audit trail
- **Filter and search** events by type and address
- **Export compliance reports** (blockchain explorer links)

## 🛠️ Technology Stack

- **Smart Contracts:** Solidity + Hardhat + OpenZeppelin
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Blockchain:** Polygon testnet (ERC-20 H2) + Ethers.js
- **Styling:** Custom dark theme with teal accents

## 📋 Smart Contract Features

- ERC-20 H2 token with producer-only claimMint using City Admin signature
- RoleManager hierarchy: Country → State → City → Producer/Buyer/Auditor
- Marketplace for listings and purchases (escrowed transfers)
- Retire credits (burn) with reason for audit
- Double-certification prevention (DB + on-chain hash)

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev              # Start frontend + backend
npm run chain:compile    # Compile smart contracts
npm run chain:deploy     # Deploy to testnet
npm run chain:test       # Run contract tests

# Individual workspaces
npm -w blockchain run test
npm -w backend run dev
npm -w frontend run dev
```

### Environment Variables

Create `.env` from `env.example`:

```bash
# Contracts / networks
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0x...

# Backend
PORT=5055
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=hydrocred
AES_KEY=32_characters_minimum_secret
JWT_SECRET=dev_jwt_secret

# Deployed addresses
CONTRACT_ADDRESS=0x...           # HydroCredToken
ROLE_MANAGER_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...

# Relayer (demo)
RELAYER_PRIVATE_KEY=0x...
CERTIFIER_PRIVATE_KEY=0x...
```

## 🌐 Demo Flow

1. Deploy contracts → Deployer is initial Country Admin
2. City Admin certifies a producer request → signs EIP-712 message
3. Producer calls claimMint(cert, sig) → H2 tokens minted
4. Producer lists credits on Marketplace → escrow tokens
5. Buyer purchases → receives H2, seller receives ETH
6. Buyer retires credits → on-chain burn + audit log

## 🔮 Future Enhancements

- IPFS for document storage
- Multi-sig governance
- Price oracles and off-chain data feeds
- L2 scaling

## 🐛 Troubleshooting

### Common Issues

**"Contract not deployed"**
- Run `npm run chain:deploy` first
- Check `.env` has correct `RPC_URL` and `PRIVATE_KEY`

"MetaMask connection failed"
- Install MetaMask
- Switch to Polygon Amoy
- Ensure wallet has testnet ETH

**"Backend API errors"**
- Check backend is running on port 5055
- Verify `CONTRACT_ADDRESS` in environment

**"Transaction failed"**
- Ensure sufficient testnet ETH for gas
- Check wallet is connected to correct network
- Verify you have required role permissions

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for a sustainable hydrogen future**
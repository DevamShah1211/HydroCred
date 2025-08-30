# HydroCred 🌊

**Blockchain-powered Green Hydrogen Credit System**

HydroCred is a decentralized application (DApp) for issuing, transferring, and retiring verified green hydrogen production credits on the blockchain. Built with immutable audit trails and role-based access control.

![HydroCred Logo](logo/hydrocred.svg)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **MongoDB** (local or cloud instance)
- **MetaMask** browser extension
- **Ethereum testnet** (Sepolia) or **Polygon testnet** access

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd HydroCred
   npm install
   ```

2. **Set up MongoDB:**
   ```bash
   # Local MongoDB
   mongod --dbpath /path/to/data/db
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate demo wallets (for testing):**
   ```bash
   cd scripts
   node generate-demo-wallets.js
   # This creates demo-wallets.json with 10 test wallets
   ```

5. **Compile and deploy contracts:**
   ```bash
   npm run blockchain:compile
   npm run blockchain:deploy
   ```

6. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   npm run backend:dev
   
   # Terminal 2: Start frontend
   npm run frontend:dev
   ```

7. **Access the app:**
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:3000

### First-Time Setup

1. **Deploy Contract:** Run `npm run blockchain:deploy` to deploy the smart contract
2. **Connect Wallet:** Open the app and connect MetaMask
3. **Complete Onboarding:** Fill out your profile and select a role
4. **Admin Verification:** Wait for an upper-level admin to verify your account
5. **Start Using:** Begin submitting production requests or certifying users

## 🏗️ Architecture

```
HydroCred/
├── blockchain/          # Smart contracts (Hardhat)
├── backend/            # Express API server  
├── frontend/           # React + Vite app
├── logo/              # Brand assets
└── scripts/           # Automation scripts
```

## 🔐 Roles & Permissions

### 🏛️ Admin Hierarchy
- **Country Admin** → Oversees states, appoints State Admins
- **State Admin** → Oversees cities, appoints City Admins  
- **City Admin (Certifier)** → Certifies hydrogen production requests

**Verification Flow:**
- Users connect wallet and complete onboarding
- Upper-level admin verifies user account
- Users can only perform actions after verification
- Admin hierarchy enforces location-based permissions

### 🏭 Producer
- **Submit production requests** with proof documents
- **Receive H2CRED tokens** after certification
- **List credits for sale** on marketplace
- **Manage production portfolio** and token balance

### 👥 Buyer (Industry)
- **Purchase verified credits** from certified producers
- **Retire credits** for compliance and carbon offset
- **View transaction history** and portfolio analytics

### 📊 Auditor/Government
- **Monitor system activities** with comprehensive audit trail
- **Export data** for external verification (JSON/CSV)
- **View-only access** to all transactions and user data

## 🛠️ Technology Stack

- **Smart Contracts:** Solidity + Hardhat + OpenZeppelin (ERC-20)
- **Backend:** Node.js + Express + TypeScript + MongoDB
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Blockchain:** Ethereum/Polygon + Ethers.js + Web3.js
- **Authentication:** Wallet-based (MetaMask, WalletConnect)
- **Styling:** Modern UI with Tailwind CSS and shadcn/UI components

## 📋 Smart Contract Features

- **ERC-20 Standard:** Fungible H2CRED tokens (1 token = 1 kg hydrogen)
- **Role-based Access Control:** Hierarchical admin system (Country → State → City)
- **Production Certification:** Producer requests + Admin verification workflow
- **Marketplace Integration:** Credit listing, purchasing, and trading
- **Credit Retirement:** Permanent token burning for compliance
- **Event Logging:** Complete audit trail with blockchain verification
- **Pausable:** Emergency stop functionality for security
- **Reentrancy Protection:** Secure against common attack vectors

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev              # Start all services
npm run build            # Build all packages
npm run test             # Run all tests

# Blockchain
npm run blockchain:compile    # Compile smart contracts
npm run blockchain:deploy     # Deploy to testnet
npm run blockchain:test       # Run contract tests
npm run blockchain:node       # Start local Hardhat node

# Backend
npm run backend:dev      # Start backend in development
npm run backend:build    # Build backend
npm run backend:start    # Start backend in production

# Frontend
npm run frontend:dev     # Start frontend in development
npm run frontend:build   # Build frontend
npm run frontend:preview # Preview production build
```

### Environment Variables

Create `.env` from `.env.example`:

```bash
# Blockchain
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Backend  
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hydrocred
JWT_SECRET=your_jwt_secret_key

# Frontend
VITE_API_BASE_URL=http://localhost:3000/api

# Auto-populated after deployment
CONTRACT_ADDRESS=0x...
```

## 🌐 Demo Flow

1. **Deploy Contract** → Sets deployer as Country Admin
2. **Connect MetaMask** → Switch to testnet (Sepolia/Polygon)
3. **User Onboarding** → Connect wallet and select role
4. **Admin Verification** → Upper-level admin verifies user account
5. **Producer Request** → Submit hydrogen production with proof
6. **Admin Certification** → City Admin certifies production request
7. **Token Minting** → Producer mints H2CRED tokens
8. **Marketplace Trading** → List and purchase credits
9. **Credit Retirement** → Buyers retire credits for compliance
10. **Audit & Export** → Regulators monitor and export data

## 🔒 Security Features

- **Role-Based Access Control:** Hierarchical admin system with location-based permissions
- **Wallet Authentication:** MetaMask integration with signature verification
- **Double Certification:** Database + blockchain verification for production requests
- **Fraud Prevention:** Admins cannot mint tokens directly; only through certified producer flow
- **Audit Trail:** Complete logging of all system activities and transactions
- **Pausable Contracts:** Emergency stop functionality for security incidents
- **Reentrancy Protection:** Secure against common smart contract attacks

## 🔐 Demo Wallets

For testing purposes, the system includes a demo wallet generator:

```bash
cd scripts
node generate-demo-wallets.js
```

This creates 10 test wallets with:
- **Addresses** for MetaMask import
- **Private Keys** for direct wallet access
- **Mnemonic Phrases** for wallet restoration

⚠️ **Security Warning**: These are demo wallets only. Never use for real funds.

## 🔮 Future Enhancements

- **IPFS Integration** for document storage
- **Multi-sig Governance** for admin management  
- **Carbon Credit Marketplace** with dynamic pricing
- **Mobile App** with QR code scanning
- **Oracle Integration** for real-world data feeds
- **Layer 2 Scaling** (Polygon, Arbitrum)
- **WalletConnect Integration** for mobile wallets

## 🐛 Troubleshooting

### Common Issues

**"Contract not deployed"**
- Run `npm run blockchain:deploy` first
- Check `.env` has correct `RPC_URL` and `PRIVATE_KEY`

**"MetaMask connection failed"**  
- Install MetaMask extension
- Switch to correct network (Sepolia/Polygon)
- Ensure wallet has testnet ETH/MATIC

**"Backend API errors"**
- Check backend is running on port 3000
- Verify MongoDB is running and accessible
- Check `MONGODB_URI` in environment

**"User verification failed"**
- Ensure admin hierarchy is properly set up
- Check user role and location requirements
- Verify admin has permission to verify user

**"Transaction failed"**
- Ensure sufficient testnet ETH/MATIC for gas
- Check wallet is connected to correct network
- Verify you have required role permissions
- Check if contract is paused

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for a sustainable hydrogen future**
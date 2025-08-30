# HydroCred Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the HydroCred application.

## Common Errors and Solutions

### 1. "Contract address not configured. Please deploy the contract first."

**Problem**: The smart contract hasn't been deployed or the contract address isn't configured.

**Solution**:
1. Deploy the smart contract to your chosen network (e.g., Sepolia testnet)
2. Update the `.env` file with the deployed contract address:
   ```bash
   CONTRACT_ADDRESS=0x... # Your deployed contract address
   ```
3. Restart both frontend and backend servers

### 2. "Cannot connect to backend server" or "Server error - please try again later"

**Problem**: The backend server isn't running or there's a connection issue.

**Solution**:
1. Ensure the backend server is running on port 5055:
   ```bash
   cd backend
   npm run dev
   ```
2. Check if port 5055 is available:
   ```bash
   lsof -i :5055
   ```
3. Verify the backend is accessible:
   ```bash
   curl http://localhost:5055/api/health
   ```

### 3. "RPC URL not configured" or "Blockchain connection unavailable"

**Problem**: The RPC URL for the blockchain network isn't configured.

**Solution**:
1. Get an RPC URL from a provider like Infura, Alchemy, or QuickNode
2. Update the `.env` file:
   ```bash
   RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   ```
3. Restart the backend server

### 4. React Router Future Flag Warnings

**Problem**: Warnings about future React Router features.

**Solution**: These warnings are informational and don't affect functionality. They've been addressed by adding future flags to the router configuration.

### 5. MetaMask Connection Issues

**Problem**: Wallet connection fails or MetaMask isn't detected.

**Solution**:
1. Ensure MetaMask is installed and unlocked
2. Connect to the correct network (e.g., Sepolia testnet)
3. Grant permission to connect when prompted
4. Check browser console for detailed error messages

## Quick Setup Checklist

- [ ] Copy `env.example` to `.env`
- [ ] Configure `RPC_URL` with your blockchain provider
- [ ] Deploy smart contract and set `CONTRACT_ADDRESS`
- [ ] Install dependencies: `npm install` in both `frontend/` and `backend/`
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`

## Development Commands

### Start Everything at Once
```bash
./scripts/start-dev.sh
```

### Start Backend Only
```bash
cd backend
npm run dev
```

### Start Frontend Only
```bash
cd frontend
npm run dev
```

### Check Backend Health
```bash
curl http://localhost:5055/api/health
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RPC_URL` | Blockchain RPC endpoint | Yes |
| `CONTRACT_ADDRESS` | Deployed smart contract address | Yes |
| `PORT` | Backend server port | No (default: 5055) |
| `AES_KEY` | Encryption key (32+ chars) | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Network Configuration

### Sepolia Testnet (Recommended for Development)
- Network Name: Sepolia
- RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
- Chain ID: 11155111
- Currency: Sepolia ETH

### Local Hardhat Network
- Network Name: Localhost
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: 31337
- Currency: ETH

## Smart Contract Deployment

1. **Compile the contract**:
   ```bash
   cd blockchain
   npx hardhat compile
   ```

2. **Deploy to testnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Update environment**:
   ```bash
   # Copy the deployed address to .env
   CONTRACT_ADDRESS=0x... # From deployment output
   ```

## Debugging Tips

1. **Check browser console** for frontend errors
2. **Check backend logs** for server errors
3. **Verify network connection** in MetaMask
4. **Test API endpoints** with curl or Postman
5. **Check environment variables** are loaded correctly

## Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure both frontend and backend are running
4. Check if the smart contract is deployed and accessible
5. Verify your blockchain network configuration

## Common Network Issues

- **RPC rate limiting**: Use a paid plan or switch providers
- **Network congestion**: Wait for less busy periods
- **Incorrect network**: Ensure MetaMask is on the right network
- **Contract not verified**: Verify the contract on the block explorer
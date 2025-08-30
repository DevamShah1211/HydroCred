# Smart Contract Deployment Guide

This guide will help you deploy the HydroCred smart contract to resolve the "Contract address not configured" errors.

## Prerequisites

1. **Node.js and npm** installed
2. **MetaMask** wallet with some testnet ETH
3. **Infura account** (or other RPC provider) for blockchain access

## Step 1: Install Dependencies

```bash
cd blockchain
npm install
```

## Step 2: Configure Environment

1. Copy the environment template:
   ```bash
   cp ../env.example ../.env
   ```

2. Edit the `.env` file and add your configuration:
   ```bash
   # Get these from Infura (https://infura.io/)
   RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   
   # Your wallet private key (be careful with this!)
   PRIVATE_KEY=your_private_key_here
   
   # Optional: Etherscan API key for contract verification
   EXPLORER_API_KEY=your_etherscan_api_key
   ```

## Step 3: Compile the Contract

```bash
npx hardhat compile
```

This will create the contract artifacts in the `artifacts/` directory.

## Step 4: Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Important**: Make sure you have Sepolia testnet ETH in your wallet!

## Step 5: Update Environment Variables

After successful deployment, you'll see output like:
```
HydroCred Token deployed to: 0x1234...5678
```

Copy this address and update your `.env` file:
```bash
CONTRACT_ADDRESS=0x1234...5678  # Your deployed contract address
```

## Step 6: Verify the Contract (Optional)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Step 7: Test the Deployment

1. Start the backend server:
   ```bash
   cd ../backend
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:5055/api/health
   ```

You should see the contract status as "configured" if everything is set up correctly.

## Alternative: Deploy to Local Hardhat Network

For local development:

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Update .env with localhost RPC
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x... # From deployment output
```

## Troubleshooting

### "Insufficient funds for deployment"
- Get Sepolia testnet ETH from a faucet
- Popular faucets: Alchemy, Infura, Chainlink

### "Nonce too high" error
- Reset your MetaMask account (Settings > Advanced > Reset Account)
- This will clear transaction history and reset nonce

### "Contract deployment failed"
- Check your RPC URL is correct
- Ensure you have enough testnet ETH
- Verify your private key is correct

### "Gas estimation failed"
- The contract might be too complex for the current gas limit
- Try increasing gas limit in MetaMask
- Check if the network is congested

## Network Configuration

### Sepolia Testnet
- **Network Name**: Sepolia
- **RPC URL**: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
- **Chain ID**: 11155111
- **Currency**: Sepolia ETH
- **Block Explorer**: https://sepolia.etherscan.io/

### Local Hardhat
- **Network Name**: Localhost
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Currency**: ETH

## Next Steps

After successful deployment:

1. **Restart both servers** (frontend and backend)
2. **Connect your wallet** to the frontend
3. **Test the functionality** by trying to issue or transfer credits
4. **Check the configuration status** on the home page

## Security Notes

- **Never commit your private key** to version control
- **Use testnet wallets** for development
- **Keep your mainnet private keys secure**
- **Consider using environment-specific .env files**

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the contract was deployed successfully
4. Check the backend logs for detailed error information
5. Refer to the main troubleshooting guide
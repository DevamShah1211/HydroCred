# HydroCred Deployment Guide

This guide walks you through deploying the HydroCred hierarchical token distribution system on Ethereum Sepolia testnet.

## 🚀 Prerequisites

- Node.js 18+ and npm
- MetaMask wallet with Sepolia testnet ETH
- Access to Ethereum Sepolia RPC endpoint
- Etherscan API key (for contract verification)

## 📋 Setup Steps

### 1. Environment Configuration

Create `.env` file in the `blockchain/` directory:

```env
PRIVATE_KEY=your_wallet_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Important**: Never commit your private key to version control!

### 2. Install Dependencies

```bash
cd blockchain
npm install
```

### 3. Deploy Smart Contract

```bash
npm run deploy
```

This will:
- Deploy the HydroCredToken contract
- Set the deployer as the Main Admin
- Save contract address to `contract-address.json`
- Display deployment information

**Expected Output:**
```
🚀 Deploying HydroCredToken...
Deploying with account: 0x...
Account balance: 1.234 ETH
✅ HydroCredToken deployed to: 0x...
🔑 Main Admin: 0x...
🔑 State Admin role granted to: 0x...
📄 Contract info saved to contract-address.json
📋 Contract verified: HydroCred Token (HCT)
👑 Main Admin: 0x...
```

### 4. Assign State Admins

After deployment, assign State Admins for different states:

```bash
npm run assign-admin
```

**Note**: You'll need multiple MetaMask accounts or wallets to test different roles:
- Account 1: Main Admin (deployer)
- Account 2: State Admin for Maharashtra
- Account 3: State Admin for Delhi
- Account 4: Producer
- Account 5: Buyer

### 5. Configure Frontend

Create `.env` file in the `frontend/` directory:

```env
VITE_CONTRACT_ADDRESS=0x... # From contract-address.json
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

### 6. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Access the application at `http://localhost:5173`

## 🔐 Role Testing

### Main Admin Testing

1. Connect with Main Admin wallet
2. Navigate to `/main-admin`
3. Assign State Admin for "Maharashtra" to a different wallet address
4. Verify assignment appears in the UI

### State Admin Testing

1. Connect with State Admin wallet
2. Navigate to `/state-admin`
3. Verify assigned states are visible
4. Wait for producer requests to appear

### Producer Testing

1. Connect with Producer wallet
2. Navigate to `/producer`
3. Register state and city (e.g., Maharashtra, Mumbai)
4. Request tokens (e.g., 100 tokens)
5. Verify request appears in State Admin dashboard

### State Admin Approval Testing

1. Switch to State Admin wallet
2. Navigate to `/state-admin`
3. Select the assigned state
4. Approve the producer's token request
5. Verify tokens are minted to producer

### Producer Token Transfer Testing

1. Switch back to Producer wallet
2. Navigate to `/producer`
3. Verify tokens are now visible
4. Transfer tokens to Buyer wallet

### Buyer Testing

1. Connect with Buyer wallet
2. Navigate to `/buyer`
3. Verify producer before purchase
4. Receive tokens from producer
5. Retire credits for carbon offset

## 🧪 Testing Scenarios

### Scenario 1: Basic Workflow
1. Deploy contract
2. Assign State Admin for Maharashtra
3. Register producer in Maharashtra
4. Request and approve tokens
5. Transfer tokens to buyer
6. Retire credits

### Scenario 2: State Isolation
1. Assign State Admin for Delhi
2. Register producer in Delhi
3. Verify State Admin can only see Delhi requests
4. Verify Maharashtra State Admin cannot see Delhi requests

### Scenario 3: Producer Verification
1. Register multiple producers
2. Approve some, reject others
3. Verify only approved producers can transfer tokens
4. Test buyer verification tool

### Scenario 4: Error Handling
1. Try to assign State Admin to already assigned state
2. Try to register producer without state admin
3. Try to request tokens without registration
4. Try to approve request from different state

## 🔍 Verification

### Contract Verification on Etherscan

```bash
cd blockchain
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "MAIN_ADMIN_ADDRESS"
```

### Event Monitoring

Monitor these events on Etherscan:
- `StateAdminAssigned`
- `ProducerRegistered`
- `TokenRequested`
- `RequestApproved`
- `TokensIssued`
- `TokenSold`
- `CreditRetired`

## 🚨 Troubleshooting

### Common Issues

**"Insufficient funds"**
- Ensure wallet has Sepolia testnet ETH
- Get testnet ETH from Sepolia faucet

**"Contract not found"**
- Verify contract address in frontend .env
- Check if contract was deployed successfully

**"Role access denied"**
- Verify wallet has correct role
- Check role assignments in contract

**"State admin not found"**
- Ensure State Admin was assigned for the state
- Check assignment transaction on Etherscan

**"Producer not verified"**
- Ensure producer request was approved by State Admin
- Check approval transaction on Etherscan

### Debug Commands

```bash
# Check contract state
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("HydroCredToken", "CONTRACT_ADDRESS")
> await contract.mainAdmin()
> await contract.stateAdmin("Maharashtra")

# Check producer info
> await contract.getProducerInfo("PRODUCER_ADDRESS")
> await contract.isVerifiedProducer("PRODUCER_ADDRESS")

# Check pending requests
> await contract.getPendingRequestsForState("Maharashtra")
```

## 📊 Monitoring

### Key Metrics to Track

- Number of State Admins assigned
- Number of producers registered
- Number of token requests
- Approval/rejection rates
- Token transfer volume
- Credit retirement count

### Health Checks

- Contract pause status
- Role assignments
- Event emission
- Gas usage patterns
- Transaction success rates

## 🔒 Security Considerations

### Access Control
- Only Main Admin can assign State Admins
- State Admins can only manage their assigned states
- Producers must register before requesting tokens
- Only verified producers can transfer tokens

### Data Validation
- State names must be non-empty
- Token amounts must be 1-1000
- Addresses must be valid Ethereum addresses
- Duplicate registrations are prevented

### Emergency Procedures
- Main Admin can pause contract
- Paused contract blocks all operations
- Main Admin can transfer role to new address

## 📈 Production Deployment

### Mainnet Considerations

1. **Security Audit**: Conduct professional security audit
2. **Multi-sig**: Consider multi-signature wallet for Main Admin
3. **Timelock**: Implement timelock for critical operations
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Insurance**: Consider smart contract insurance coverage

### Network Selection

- **Ethereum Mainnet**: Highest security, highest gas costs
- **Polygon**: Lower gas costs, good security
- **Arbitrum**: Low gas costs, high security
- **Base**: Low gas costs, Coinbase-backed

### Upgrade Strategy

- **Proxy Pattern**: Consider upgradeable contract pattern
- **Data Migration**: Plan for future contract upgrades
- **Backward Compatibility**: Maintain compatibility with existing data

## 🎯 Next Steps

After successful deployment:

1. **Documentation**: Update team documentation
2. **Training**: Train users on new workflow
3. **Monitoring**: Set up monitoring and alerting
4. **Backup**: Document all configuration and addresses
5. **Testing**: Conduct comprehensive testing with real users

## 📞 Support

For deployment issues:
- Check this guide thoroughly
- Review contract compilation errors
- Verify environment configuration
- Check network connectivity
- Review transaction logs on Etherscan

---

**Remember**: Always test thoroughly on testnets before mainnet deployment!
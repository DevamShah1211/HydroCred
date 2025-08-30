# 🎭 Mock Blockchain System Guide

The HydroCred project now includes a comprehensive mock blockchain system that allows you to test all functionality without deploying to a real blockchain network.

## 🚀 Quick Start

### 1. Enable Mock Blockchain

Copy the development environment file:
```bash
cp .env.development .env
```

### 2. Start the Application

```bash
npm run dev
```

This will start both the backend and frontend with mock blockchain enabled.

## 🎯 Features

### ✅ Complete Transaction Simulation
- **Credit Issuance**: Simulate issuing credits as a certifier
- **Credit Transfer**: Simulate transferring credits between addresses
- **Credit Retirement**: Simulate retiring credits permanently
- **Role Management**: Test different user roles and permissions

### ✅ Mock Wallet System
- **Auto-Connection**: Automatically connects to mock addresses
- **Role Switching**: Switch between different mock addresses for testing
- **Transaction Simulation**: Realistic transaction delays and confirmations

### ✅ Mock Blockchain State
- **Persistent State**: Maintains state across page refreshes
- **Event Logging**: Complete audit trail of all operations
- **Balance Tracking**: Real-time balance updates
- **Reset Functionality**: Reset to initial state when needed

## 🔑 Mock Addresses

The system provides four pre-configured mock addresses:

| Role | Address | Description |
|------|---------|-------------|
| **Certifier** | `0x1234...7890` | Admin + Certifier role |
| **Producer** | `0x2345...8901` | Hydrogen producer |
| **Buyer** | `0x3456...9012` | Credit buyer |
| **Regulator** | `0x4567...0123` | Regulatory oversight |

## 🛠️ Usage

### Frontend Interface

#### Mock Wallet Switcher
- Located in the bottom-right corner (development mode only)
- Click to open the wallet switcher
- Select different addresses to test different roles
- Reset button to clear all mock data

#### Testing Different Roles

1. **As Certifier**:
   - Navigate to `/certifier`
   - Issue credits to producers
   - View issuance history

2. **As Producer**:
   - Navigate to `/producer`
   - View owned credits
   - Transfer credits to buyers

3. **As Buyer**:
   - Navigate to `/buyer`
   - Purchase credits from producers
   - Retire credits for carbon offset

4. **As Regulator**:
   - Navigate to `/regulator`
   - View complete transaction history
   - Monitor all operations

### Backend API Endpoints

#### Mock Blockchain Operations

```bash
# Issue credits
POST /api/mock/issue
{
  "to": "0x2345...8901",
  "amount": 100,
  "issuedBy": "0x1234...7890"
}

# Transfer credits
POST /api/mock/transfer
{
  "from": "0x2345...8901",
  "to": "0x3456...9012",
  "tokenId": 1
}

# Retire credits
POST /api/mock/retire
{
  "tokenId": 1,
  "retiredBy": "0x3456...9012"
}

# Get owned tokens
GET /api/mock/tokens/0x2345...8901

# Check role
GET /api/mock/role/certifier/0x1234...7890

# Add certifier
POST /api/mock/add-certifier
{
  "address": "0x5678...1234"
}

# Add admin
POST /api/mock/add-admin
{
  "address": "0x5678...1234"
}

# Reset blockchain
POST /api/mock/reset

# Get mock data
GET /api/mock/data
```

## 🔄 Transaction Flow

### 1. Credit Issuance
```
Certifier → Producer
- Certifier issues 100 credits to Producer
- Producer receives 100 new token IDs
- Event logged: CreditsIssued
- Balance updated: Producer +100
```

### 2. Credit Transfer
```
Producer → Buyer
- Producer transfers token #1 to Buyer
- Ownership changes from Producer to Buyer
- Event logged: Transfer
- Balance updated: Producer -1, Buyer +1
```

### 3. Credit Retirement
```
Buyer → Retirement
- Buyer retires token #1 for carbon offset
- Token becomes non-transferable
- Event logged: CreditRetired
- Balance updated: Buyer -1
```

## 🎨 Customization

### Mock Data Initialization

Edit `backend/src/lib/mockBlockchain.ts` to customize:

```typescript
private initializeMockData() {
  // Add custom addresses
  const customAddresses = [
    '0xYourCustomAddress1',
    '0xYourCustomAddress2'
  ];
  
  // Set initial balances
  this.balances.set(customAddresses[0], 500);
  this.balances.set(customAddresses[1], 300);
  
  // Create initial tokens
  this.createMockTokens(customAddresses[0], 500);
  this.createMockTokens(customAddresses[1], 300);
}
```

### Transaction Delays

Adjust simulation delays in `frontend/src/lib/mockWallet.ts`:

```typescript
// Simulate transaction delay
await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

// Simulate block confirmation delay
await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Credit Lifecycle
1. Connect as Certifier
2. Issue 100 credits to Producer
3. Switch to Producer role
4. Transfer 50 credits to Buyer
5. Switch to Buyer role
6. Retire 25 credits
7. Verify all events in Regulator view

### Scenario 2: Role Management
1. Connect as Certifier (Admin)
2. Add new certifier address
3. Verify new certifier can issue credits
4. Remove certifier role
5. Verify role removal

### Scenario 3: Error Handling
1. Try to issue credits without certifier role
2. Try to transfer non-owned tokens
3. Try to retire already retired credits
4. Verify proper error messages

## 🐛 Troubleshooting

### Common Issues

**Mock wallet not connecting**
- Check `.env` has `USE_MOCK_BLOCKCHAIN=true`
- Ensure `NODE_ENV=development`
- Restart the application

**Transactions not working**
- Verify mock blockchain is enabled
- Check browser console for errors
- Ensure proper role permissions

**State not persisting**
- Mock blockchain maintains state in memory
- Page refresh preserves state
- Use reset button to clear all data

**API endpoints not found**
- Ensure backend is running on port 5055
- Check mock endpoints are only available in development
- Verify API routes are properly configured

### Debug Mode

Enable debug logging by adding to `.env`:

```bash
DEBUG_MOCK_BLOCKCHAIN=true
LOG_LEVEL=debug
```

View mock blockchain state:

```bash
curl http://localhost:5055/api/mock/data
```

## 🔮 Future Enhancements

- **IPFS Integration**: Mock document storage
- **Multi-sig Simulation**: Mock governance operations
- **Oracle Mocking**: Simulate external data feeds
- **Gas Estimation**: Realistic gas cost simulation
- **Network Switching**: Mock different blockchain networks

## 📚 API Reference

### Mock Blockchain Service

```typescript
import { MockChainService } from './lib/mockChainService';

// Get all events
const events = await MockChainService.getCreditEvents();

// Issue credits
const tx = await MockChainService.batchIssueCredits(to, amount, issuedBy);

// Transfer credits
const tx = await MockChainService.transferCredit(from, to, tokenId);

// Retire credits
const tx = await MockChainService.retireCredit(tokenId, retiredBy);

// Check roles
const isCertifier = await MockChainService.isCertifier(address);
const isAdmin = await MockChainService.isAdmin(address);

// Get balances
const balance = await MockChainService.getBalance(address);
```

### Mock Wallet Utilities

```typescript
import { MockBlockchain } from './lib/chain';

// Get available addresses
const addresses = MockBlockchain.getMockAddresses();

// Switch addresses
MockBlockchain.switchMockAddress(address);

// Check connection
const connected = MockBlockchain.isMockWalletConnected();
```

## 🎉 Benefits

1. **No Gas Costs**: Test without spending real ETH
2. **Instant Transactions**: No waiting for block confirmations
3. **Complete Control**: Full control over blockchain state
4. **Easy Testing**: Test all scenarios without deployment
5. **Development Speed**: Faster iteration and debugging
6. **Offline Development**: Work without internet connection

---

**Happy Testing! 🚀**

The mock blockchain system makes it easy to develop, test, and demonstrate the HydroCred platform without any blockchain deployment requirements.
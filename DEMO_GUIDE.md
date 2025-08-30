# 🎮 HydroCred Demo Mode Guide

The application now runs in **Demo Mode** with fully functional fake transactions and blockchain simulation!

## 🚀 Quick Start

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

The application will automatically run in demo mode with:
- ✅ Fake blockchain transactions
- ✅ Mock wallet connections  
- ✅ Simulated API responses
- ✅ Realistic demo data
- ✅ All features working perfectly

## 🎭 Demo Features

### User Role Switching
- Use the **User Switcher** in the top navigation
- Switch between different roles: Certifier, Producer A/B, Buyer A/B, Regulator
- Each role has different permissions and sees different data

### Available Demo Users
- 🛡️ **Certifier** - Can issue credits to producers
- 🏭 **Producer A** - Has 2 active credits, 1 retired credit
- 🏭 **Producer B** - Has 2 active credits
- 🏢 **Buyer A** - Has 1 active credit, 1 retired credit  
- 🏢 **Buyer B** - Has 1 active credit
- 🏛️ **Regulator** - Can view all transactions and ledger data

### Functional Features

#### As Certifier:
- ✅ Issue new credits to any address
- ✅ View history of all issued credits
- ✅ See transaction confirmations

#### As Producer:
- ✅ View owned credits
- ✅ Transfer credits to buyers
- ✅ See transfer confirmations

#### As Buyer:
- ✅ View purchased credits
- ✅ Retire credits for carbon offset
- ✅ See retirement confirmations

#### As Regulator:
- ✅ View complete transaction ledger
- ✅ Filter by transaction type
- ✅ Search by address
- ✅ Real-time data updates

## 🔄 Transaction Simulation

All transactions are fully simulated with:
- ✅ Realistic processing delays (0.5-2 seconds)
- ✅ Transaction hash generation
- ✅ Block number assignment
- ✅ Success/failure simulation
- ✅ State updates across all components
- ✅ Toast notifications

## 🎯 Demo Scenarios

### Scenario 1: Issue Credits
1. Switch to **Certifier** role
2. Go to `/certifier` page
3. Issue credits to a producer address
4. Watch the transaction process and succeed

### Scenario 2: Transfer Credits
1. Switch to **Producer A** role
2. Go to `/producer` page
3. Transfer a credit to a buyer
4. Switch to buyer role to see the received credit

### Scenario 3: Retire Credits
1. Switch to **Buyer A** role
2. Go to `/buyer` page
3. Retire a credit for carbon offset
4. See the credit marked as retired

### Scenario 4: Monitor Transactions
1. Switch to **Regulator** role
2. Go to `/regulator` page
3. View all transactions in the system
4. Use filters and search functionality

## 🛠️ Technical Details

- **Mock Chain Library**: `/frontend/src/lib/mockChain.ts`
- **Mock API Library**: `/frontend/src/lib/mockBackend.ts`
- **Configuration**: Auto-switches based on environment
- **State Management**: In-memory state with persistence across components
- **Transaction Hashes**: Randomly generated but consistent
- **Block Numbers**: Sequential numbering starting from 18000000

## 🔧 Switching to Real Blockchain

To switch from demo mode to real blockchain:

1. Set up actual environment variables in `.env`
2. Deploy the smart contract
3. Set `VITE_USE_MOCK=false` in environment
4. Restart the application

The application will automatically detect and switch to real blockchain mode.

---

**Enjoy exploring the HydroCred platform! 🌱⚡**
# HydroCred Demo Guide

## 🎯 Overview

This is a **complete fake transaction system** that simulates all blockchain operations without requiring MetaMask, real blockchain connectivity, or any setup. Everything works perfectly in demo mode!

## ✨ Features

### ✅ What Works (All Fake/Simulated):
- **Wallet Management**: Switch between 4 pre-configured demo wallets
- **Credit Issuance**: Certifiers can issue credits to producers
- **Credit Transfers**: Producers can transfer credits to buyers
- **Credit Retirement**: Buyers can retire credits for carbon offsetting
- **Transaction History**: Complete audit trail of all operations
- **Real-time Updates**: UI updates instantly after transactions
- **Persistent Data**: All data is stored locally and persists between sessions
- **Realistic Delays**: Simulated network delays for authentic feel
- **Transaction Receipts**: Generated with realistic transaction hashes
- **Role-based Access**: Proper permissions for different wallet types

### 🎭 Demo Wallets

| Role | Address | Capabilities |
|------|---------|-------------|
| **Certifier** | `0x1234...7890` | Issue credits to producers |
| **Producer** | `0x2345...8901` | Receive and transfer credits |
| **Buyer** | `0x3456...9012` | Purchase and retire credits |
| **Regulator** | `0x4567...0123` | View all transactions and audit |

## 🚀 How to Use

### 1. **Start the Application**
```bash
npm run dev
```

### 2. **Switch Wallets**
- Click the wallet selector in the top-right corner
- Choose any of the 4 demo wallets
- Each wallet has different permissions and sees different data

### 3. **Try Different Scenarios**

#### **As a Certifier** (Purple wallet):
1. Go to `/certifier`
2. Issue credits to producers using the quick address buttons
3. Watch the transaction complete with realistic delays
4. See the credits appear in the producer's wallet

#### **As a Producer** (Green wallet):
1. Go to `/producer`
2. View your received credits
3. Transfer credits to buyers using quick address selection
4. See your credit count decrease and buyer's increase

#### **As a Buyer** (Blue wallet):
1. Go to `/buyer`
2. View your purchased credits
3. Retire credits for carbon offsetting
4. Download retirement certificates

#### **As a Regulator** (Orange wallet):
1. Go to `/regulator`
2. View complete system audit trail
3. Filter transactions by type
4. Search by wallet addresses

### 4. **Reset Demo Data**
- Click "Demo Config" → "Reset All Demo Data"
- Or use the "Reset Demo" button in the navigation
- This restores the initial state with sample data

## 🔧 Technical Implementation

### **Mock Chain System**
- **File**: `frontend/src/lib/mockChain.ts`
- **Features**: Complete blockchain simulation
- **Storage**: LocalStorage for data persistence
- **Transactions**: Realistic transaction receipts and delays

### **Mock API System**
- **File**: `frontend/src/lib/api.ts`
- **Features**: Simulated backend responses
- **Delays**: Realistic network delays
- **Data**: Synchronized with mock chain

### **Configuration**
- **Environment**: `.env` file with `VITE_USE_MOCK_CHAIN=true`
- **Toggle**: Can switch between real and mock modes
- **Default**: Demo mode is enabled by default

## 📱 User Interface

### **Components Added**:
- `WalletSelector`: Switch between demo wallets
- `DemoBanner`: Shows demo mode status
- `DemoConfig`: Advanced demo configuration
- `DemoInstructions`: Interactive guided tour
- `TransactionHistory`: Real-time transaction display

### **Enhanced Pages**:
- **Home**: Demo guide and quick start
- **Certifier**: Quick address selection for issuing
- **Producer**: Quick address selection for transfers
- **Buyer**: Enhanced retirement flow
- **Regulator**: Comprehensive audit dashboard

## 🎮 Demo Scenarios

### **Scenario 1: Complete Credit Lifecycle**
1. Switch to Certifier → Issue 10 credits to Producer
2. Switch to Producer → Transfer 5 credits to Buyer
3. Switch to Buyer → Retire 3 credits
4. Switch to Regulator → View complete audit trail

### **Scenario 2: Multiple Producers**
1. Switch to Certifier → Issue credits to different producers
2. Switch between Producer wallets → See different credit balances
3. Transfer credits between producers and buyers
4. Monitor everything as Regulator

### **Scenario 3: Bulk Operations**
1. Issue large batches of credits (up to 1000)
2. Transfer multiple credits
3. Retire credits in bulk
4. Analyze statistics as Regulator

## 🛠️ Development Notes

### **Real vs Mock Mode**
- Set `VITE_USE_MOCK_CHAIN=false` to use real blockchain
- Default is `true` for seamless demo experience
- All functions have both real and mock implementations

### **Data Persistence**
- Mock data is stored in `localStorage`
- Survives browser refresh and tab close
- Can be reset via demo controls

### **Error Handling**
- All error scenarios are simulated
- Realistic error messages
- Proper error recovery flows

## 🎯 Perfect Demo Experience

The system is designed to provide a **perfect demo experience** where:
- ✅ Everything works immediately without setup
- ✅ All transactions complete successfully
- ✅ UI updates in real-time
- ✅ Data persists between sessions
- ✅ Realistic delays and confirmations
- ✅ Complete audit trail
- ✅ Role-based permissions work correctly
- ✅ No external dependencies required

## 🔄 Switching to Real Mode

To use with real blockchain:
1. Set `VITE_USE_MOCK_CHAIN=false` in `.env`
2. Configure real contract address and RPC URL
3. Install MetaMask and connect
4. Deploy contracts to testnet
5. All functionality will work with real blockchain

---

**Ready to explore?** Start by clicking different wallet roles and trying out the various transaction types. The system is designed to work perfectly from the first click! 🚀
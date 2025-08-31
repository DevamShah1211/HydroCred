# HydroCred - Hierarchical Green Hydrogen Credit System

HydroCred is a blockchain-powered green hydrogen credit system with a hierarchical, state-aware approval workflow. The system enforces a structured hierarchy where Main Admins assign State Admins, who then approve producers within their assigned states.

## 🏗️ System Architecture

### Roles and Hierarchy

1. **Main Admin (India-level)**
   - Only one wallet address (set during contract deployment)
   - Can assign State Admins for each state
   - Cannot approve producers or buyers directly
   - Has full system control and can pause/unpause the contract

2. **State Admin (State-level)**
   - Assigned by Main Admin for specific states
   - Can approve producers in their assigned state only
   - Cannot create other admins
   - Cannot approve users outside their assigned state

3. **Producer**
   - Must register state and city after connecting wallet
   - Cannot request tokens until state & city are submitted
   - Requests tokens from State Admin of their registered state
   - Only approved producers can receive tokens and sell to buyers

4. **Buyer**
   - Can receive tokens from verified producers
   - Can verify producer legitimacy using `isVerifiedProducer`
   - Can retire credits for carbon offset
   - Cannot approve anyone

## 🔄 Workflow

1. **Producer Registration**
   - Producer connects wallet via MetaMask
   - System requires state & city selection
   - Producer submits registration → wallet + state + city saved on-chain

2. **Token Request Process**
   - Producer requests tokens → automatically routed to State Admin of their state
   - State Admin reviews and approves/rejects requests
   - Upon approval, tokens are minted and producer becomes verified

3. **Token Trading**
   - Verified producers can sell tokens to buyers
   - Buyers can verify producer legitimacy before purchase
   - All transfers are recorded on-chain with events

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask wallet extension
- Access to Ethereum Sepolia testnet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HydroCred
   ```

2. **Install dependencies**
   ```bash
   # Install blockchain dependencies
   cd blockchain
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Deploy the smart contract**
   ```bash
   cd ../blockchain
   npm run deploy
   ```

4. **Assign State Admins**
   ```bash
   npm run assign-admin
   ```

5. **Start the frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```

## 📋 Smart Contract Functions

### Main Admin Functions
- `assignStateAdmin(address _admin, string _state)` - Assign state admin
- `updateMainAdmin(address _newAdmin)` - Transfer main admin role
- `pause()` / `unpause()` - Control contract state

### State Admin Functions
- `approveRequest(uint256 _requestId)` - Approve producer token request

### Producer Functions
- `registerProducer(string _state, string _city)` - Register state and city
- `requestTokens(uint256 _amount)` - Request tokens from state admin

### View Functions
- `isVerifiedProducer(address _producer)` - Check if producer is verified
- `getProducerInfo(address _producer)` - Get producer's state and city
- `getPendingRequestsForState(string _state)` - Get pending requests for a state
- `getRequestDetails(uint256 _requestId)` - Get request details

## 🎯 Frontend Features

### Main Admin Dashboard
- Assign State Admins for different states
- System configuration and monitoring
- Access control management

### State Admin Dashboard
- View pending token requests for assigned states
- Approve/reject producer requests
- State-specific request management

### Producer Dashboard
- State and city registration form
- Token request submission
- Request status tracking
- Token management and transfer

### Buyer Dashboard
- Producer verification tool
- Credit purchase and retirement
- Retirement proof generation

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `blockchain/` and `frontend/` directories:

**Blockchain (.env)**
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend (.env)**
```env
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_RPC_URL=your_sepolia_rpc_url
```

### Network Configuration

The system is configured for Ethereum Sepolia testnet by default. Update `hardhat.config.ts` for other networks.

## 📊 Events and Monitoring

The smart contract emits events for all key actions:
- `StateAdminAssigned` - When a state admin is assigned
- `ProducerRegistered` - When a producer registers
- `TokenRequested` - When tokens are requested
- `RequestApproved` - When a request is approved
- `TokensIssued` - When tokens are minted
- `TokenSold` - When tokens are transferred
- `CreditRetired` - When credits are retired

## 🧪 Testing

### Smart Contract Tests
```bash
cd blockchain
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚨 Security Features

- **Access Control**: OpenZeppelin AccessControl for role management
- **State Isolation**: State Admins can only manage their assigned states
- **Input Validation**: Comprehensive parameter validation
- **Pausable**: Emergency pause functionality for Main Admin
- **Event Logging**: Complete audit trail for all operations

## 🔄 State Management

The system maintains several key mappings:
- `walletAddress → state` - Producer state registration
- `walletAddress → city` - Producer city registration
- `state → stateAdmin` - State admin assignments
- `verifiedProducers` - Approved producer addresses
- `tokenRequests` - All token request records

## 📈 Future Enhancements

- Multi-token support for different credit types
- Advanced analytics and reporting
- Mobile application
- Integration with external verification systems
- Automated compliance checking
- Cross-chain interoperability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting guide in `TROUBLESHOOTING.md`
- Review the deployment guide in `DEPLOYMENT_GUIDE.md`

## 🔗 Links

- **Smart Contract**: `blockchain/contracts/HydroCredToken.sol`
- **Frontend**: `frontend/src/`
- **Deployment Scripts**: `blockchain/scripts/`
- **Configuration**: `blockchain/hardhat.config.ts`

---

**Note**: This system is designed for production use with proper security considerations. Always test thoroughly on testnets before deploying to mainnet.
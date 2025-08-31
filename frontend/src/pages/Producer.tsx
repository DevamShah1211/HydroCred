import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Send, RefreshCw, MapPin, Clock, CheckCircle, Plus, MessageSquare, X } from 'lucide-react';
import { 
  getWalletAddress, 
  getOwnedTokens, 
  transferCredit, 
  isTokenRetired, 
  handleChainError, 
  waitForTransactionAndRefresh, 
  listenForTransfers,
  registerProducer,
  getProducerInfo,
  requestTokens,
  getProducerRequests,
  getRequestDetails,
  isVerifiedProducer,
  sellToken,
  getDirectReadOnlyContract
} from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

interface TokenRequest {
  requestId: number;
  producer: string;
  amount: number;
  state: string;
  timestamp: number;
  approved: boolean;
  processed: boolean;
}

const Producer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState<number | null>(null);
  
  // New state for hierarchical system
  const [isRegistered, setIsRegistered] = useState(false);
  const [producerState, setProducerState] = useState('');
  const [producerCity, setProducerCity] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([]);
  
  // Transfer form state
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  
  // Token request form state
  const [requestAmount, setRequestAmount] = useState('');

  useEffect(() => {
    loadWalletAndData();
    
    // Set up event listeners for all relevant events
    const setupEventListeners = async () => {
      try {
        // Listen for transfers
        await listenForTransfers((_from, _to, _tokenId) => {
          console.log('🔄 Transfer detected, refreshing credits...');
          if (walletAddress) {
            loadCredits(walletAddress);
          }
        });

        // Listen for tokens issued (when requests are approved)
        const contract = await getDirectReadOnlyContract();
        contract.on('TokensIssued', (to: string, amount: bigint, fromId: bigint, toId: bigint) => {
          console.log('🆕 Tokens issued event detected:', { to, amount: Number(amount), fromId: Number(fromId), toId: Number(toId) });
          if (walletAddress && to.toLowerCase() === walletAddress.toLowerCase()) {
            console.log('🎉 New tokens issued to current user, refreshing...');
            loadCredits(walletAddress);
            loadTokenRequests(walletAddress);
          }
        });

        console.log('👂 Event listeners set up successfully');
      } catch (error) {
        console.error('❌ Failed to set up event listeners:', error);
      }
    };
    
    setupEventListeners();
  }, [walletAddress]);

  const loadWalletAndData = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        await Promise.all([
          loadCredits(address),
          checkProducerRegistration(address)
        ]);
      }
    } catch (error) {
      console.error('Failed to load wallet and data:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const checkProducerRegistration = async (address: string) => {
    try {
      const info = await getProducerInfo(address);
      if (info.state) {
        setIsRegistered(true);
        setProducerState(info.state);
        setProducerCity(info.city);
        
        // Load token requests
        await loadTokenRequests(address);
      }
    } catch (error) {
      console.error('Failed to check producer registration:', error);
    }
  };

  const loadTokenRequests = async (address: string) => {
    try {
      const requestIds = await getProducerRequests(address);
      const requests: TokenRequest[] = [];
      
      for (const requestId of requestIds) {
        const details = await getRequestDetails(requestId);
        if (details.producer) {
          requests.push({
            requestId,
            ...details
          });
        }
      }
      
      setTokenRequests(requests);
    } catch (error) {
      console.error('Failed to load token requests:', error);
    }
  };

  const loadCredits = async (address: string) => {
    try {
      console.log('🔄 Loading credits for address:', address);
      const tokenIds = await getOwnedTokens(address);
      console.log('📋 Found token IDs:', tokenIds);
      
      const creditsWithStatus = await Promise.all(
        tokenIds.map(async (tokenId) => ({
          tokenId,
          isRetired: await isTokenRetired(tokenId),
        }))
      );
      
      console.log('✅ Credits loaded:', creditsWithStatus);
      setCredits(creditsWithStatus);
    } catch (error) {
      console.error('Failed to load credits:', error);
      toast.error('Failed to load your credits');
    }
  };

  const handleRegisterProducer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!producerState || !producerCity) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsRegistering(true);
    
    try {
      const tx = await registerProducer(producerState, producerCity);
      
      toast.info('Registration submitted. Waiting for confirmation...');
      
      await tx.wait();
      
      setIsRegistered(true);
      toast.success('Producer registered successfully!');
      
      // Refresh data
      if (walletAddress) {
        await loadTokenRequests(walletAddress);
      }
      
    } catch (error: any) {
      console.error('Failed to register producer:', error);
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(requestAmount);
    if (!amount || amount <= 0 || amount > 1000) {
      toast.error('Please enter a valid amount (1-1000)');
      return;
    }

    setIsRequesting(true);
    
    try {
      const tx = await requestTokens(amount);
      
      toast.info('Token request submitted. Waiting for confirmation...');
      
      await tx.wait();
      
      toast.success(`Request for ${amount} tokens submitted successfully!`);
      setRequestAmount('');
      
      // Refresh requests
      if (walletAddress) {
        await loadTokenRequests(walletAddress);
      }
      
    } catch (error: any) {
      console.error('Failed to request tokens:', error);
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTokenId || !transferAddress || !walletAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if producer is verified
    const isVerified = await isVerifiedProducer(walletAddress);
    if (!isVerified) {
      toast.error('Only verified producers can transfer tokens');
      return;
    }

    setIsTransferring(selectedTokenId);
    
    try {
      const tx = await transferCredit(walletAddress, transferAddress, selectedTokenId);
      
      toast.info('Transfer submitted. Waiting for confirmation...');
      
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      toast.success(`Credit #${selectedTokenId} transferred successfully`);
      setSelectedTokenId(null);
      setTransferAddress('');
      
    } catch (error: any) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsTransferring(null);
    }
  };

  const handleSellToken = async (e: React.FormEvent, tokenId: number) => {
    e.preventDefault();
    
    if (!transferAddress || !walletAddress) {
      toast.error('Please enter buyer address');
      return;
    }

    // Check if producer is verified
    const isVerified = await isVerifiedProducer(walletAddress);
    if (!isVerified) {
      toast.error('Only verified producers can sell tokens');
      return;
    }

    setIsTransferring(tokenId);
    
    try {
      // Use the sellToken function from the smart contract
      const tx = await sellToken(transferAddress, tokenId);
      
      toast.info('Sale submitted. Waiting for confirmation...');
      
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      toast.success(`Credit #${tokenId} sold successfully to ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}`);
      setTransferAddress('');
      
    } catch (error: any) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsTransferring(null);
    }
  };

  const handleRefresh = () => {
    if (walletAddress) {
      loadCredits(walletAddress);
      loadTokenRequests(walletAddress);
      toast.info('Refreshing data...');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Leaf className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the producer dashboard</p>
        </motion.div>
      </div>
    );
  }

  // Show registration form if not registered
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-dark py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <Leaf className="h-16 w-16 text-brand mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">Producer Registration Required</h1>
              <p className="text-gray-400">Please register your state and city to continue</p>
            </div>

            {/* Registration Form */}
            <div className="card max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-6 flex items-center justify-center">
                <MapPin className="h-5 w-5 mr-2 text-brand" />
                Register as Producer
              </h2>
              
              <form onSubmit={handleRegisterProducer} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    State *
                  </label>
                  <select
                    value={producerState}
                    onChange={(e) => setProducerState(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Choose your state...</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={producerCity}
                    onChange={(e) => setProducerCity(e.target.value)}
                    placeholder="Enter your city (optional)"
                    className="input w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isRegistering ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Register Producer</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">Why Registration?</h3>
                <p className="text-sm text-gray-300">
                  Producers must register their state and city to ensure proper routing of token requests 
                  to the appropriate State Admin for approval. This maintains the hierarchical structure 
                  of the system.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const activeCredits = credits.filter(c => !c.isRetired);

  const pendingRequests = tokenRequests.filter(r => !r.processed);
  const approvedRequests = tokenRequests.filter(r => r.approved && r.processed);

  return (
    <div className="min-h-screen bg-gradient-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Leaf className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">Producer Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => walletAddress && loadCredits(walletAddress)}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Credits</span>
              </button>
            </div>
            <p className="text-gray-400">Manage your green hydrogen production credits</p>
            <div className="mt-2 text-sm text-gray-500">
              State: <span className="text-white">{producerState}</span>
              {producerCity && ` | City: ${producerCity}`}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-brand">{credits.length}</h3>
              <p className="text-gray-400">Total Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">{activeCredits.length}</h3>
              <p className="text-gray-400">Active Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-yellow-400">{pendingRequests.length}</h3>
              <p className="text-gray-400">Pending Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-blue-400">{approvedRequests.length}</h3>
              <p className="text-gray-400">Approved Requests</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Token Request Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-brand" />
                Request Tokens
              </h2>
              
              <form onSubmit={handleRequestTokens} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Tokens
                  </label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="1-1000"
                    min="1"
                    max="1000"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Request will be sent to State Admin of {producerState}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isRequesting}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isRequesting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Request Tokens</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Transfer Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Send className="h-5 w-5 mr-2 text-brand" />
                Transfer Credit
              </h2>
              
              {activeCredits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active credits available for transfer
                </p>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Credit to Transfer
                    </label>
                    <select
                      value={selectedTokenId || ''}
                      onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                      className="input w-full"
                      required
                    >
                      <option value="">Choose a credit...</option>
                      {activeCredits.map((credit) => (
                        <option key={credit.tokenId} value={credit.tokenId}>
                          Credit #{credit.tokenId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="0x..."
                      className="input w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isTransferring !== null}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isTransferring === selectedTokenId ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Transfer Credit</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Token Requests */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-400" />
                Token Requests
              </h2>
              
              {tokenRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No token requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tokenRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className={`p-4 rounded-xl border transition-all ${
                        request.processed
                          ? request.approved
                            ? 'bg-green-900/20 border-green-700/50'
                            : 'bg-red-900/20 border-red-700/50'
                          : 'bg-yellow-900/20 border-yellow-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            Request #{request.requestId}
                          </p>
                          <p className="text-sm text-gray-400">
                            {request.amount} tokens requested
                          </p>
                          <p className="text-sm text-gray-400">
                            State: {request.state}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.processed
                              ? request.approved
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {request.processed
                              ? request.approved
                                ? 'Approved'
                                : 'Rejected'
                              : 'Pending'
                            }
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(request.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Credits List */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Your Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {credits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No credits found. Request tokens from your State Admin to get started.
                  </p>
                ) : (
                  credits.map((credit) => (
                    <div
                      key={credit.tokenId}
                      className={`p-4 rounded-xl border transition-all ${
                        credit.isRetired
                          ? 'bg-gray-900/50 border-gray-700 opacity-60'
                          : 'bg-gray-800/50 border-gray-600 hover:border-brand/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-400">
                            Status: {credit.isRetired ? 'Retired' : 'Active'}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            credit.isRetired ? 'bg-gray-500' : 'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Credit Requests Section */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-brand" />
                Incoming Credit Requests
              </h2>
              
              <div className="space-y-4">
                {tokenRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No credit requests from buyers yet</p>
                    <p className="text-sm text-gray-500 mt-2">Buyers can request credits through the producer directory</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tokenRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="p-4 rounded-xl border border-gray-600 bg-gray-800/50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold">
                              Request #{request.requestId}
                            </p>
                            <p className="text-sm text-gray-400">
                              State: {request.state}
                            </p>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Credits Requested
                            </label>
                            <p className="font-semibold">{request.amount}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Status
                            </label>
                            <p className="capitalize">{request.approved ? 'Approved' : 'Pending'}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {/* Handle send credits */}}
                            className="btn-primary flex-1 flex items-center justify-center space-x-2"
                            disabled={!request.approved}
                          >
                            <Send className="h-4 w-4" />
                            <span>Send Credits</span>
                          </button>
                          
                          <button
                            onClick={() => {/* Handle reject */}}
                            className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Tokens Section */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Send className="h-5 w-5 mr-2 text-brand" />
                Send Tokens to Buyers
              </h2>
              
              <div className="space-y-6">
                {/* Quick Transfer Form */}
                <div className="p-6 rounded-xl border border-gray-600 bg-gray-800/50">
                  <h3 className="text-lg font-semibold mb-4">Quick Transfer</h3>
                  
                  <form onSubmit={handleTransfer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Select Token
                        </label>
                        <select
                          value={selectedTokenId || ''}
                          onChange={(e) => setSelectedTokenId(e.target.value ? Number(e.target.value) : null)}
                          className="input w-full"
                          required
                        >
                          <option value="">Choose a token...</option>
                          {credits.filter(credit => !credit.isRetired).map((credit) => (
                            <option key={credit.tokenId} value={credit.tokenId}>
                              Credit #{credit.tokenId}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Buyer Address
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          className="input w-full"
                          value={transferAddress}
                          onChange={(e) => setTransferAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!selectedTokenId || !transferAddress || isTransferring !== null}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      {isTransferring ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Transferring...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Token</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Individual Token Sale Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Individual Token Sales</h3>
                  
                  {credits.filter(credit => !credit.isRetired).length === 0 ? (
                    <div className="text-center py-8">
                      <Send className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No active credits available for sale</p>
                      <p className="text-sm text-gray-500 mt-2">Only active (non-retired) credits can be sold</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {credits.filter(credit => !credit.isRetired).map((credit) => (
                        <div
                          key={credit.tokenId}
                          className="p-4 rounded-xl border border-gray-600 bg-gray-800/50"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <p className="font-semibold">
                                Credit #{credit.tokenId}
                              </p>
                              <p className="text-sm text-gray-400">
                                Available for sale
                              </p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          </div>
                          
                          <form onSubmit={(e) => handleSellToken(e, credit.tokenId)} className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Buyer Address
                              </label>
                              <input
                                type="text"
                                placeholder="0x..."
                                className="input w-full"
                                value={transferAddress}
                                onChange={(e) => setTransferAddress(e.target.value)}
                                required
                              />
                            </div>
                            
                            <button
                              type="submit"
                              disabled={isTransferring === credit.tokenId}
                              className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                              {isTransferring === credit.tokenId ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Selling...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  <span>Sell Credit #{credit.tokenId}</span>
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Producer;
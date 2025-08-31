import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Download, RefreshCw, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getWalletAddress, 
  getOwnedTokens, 
  retireCredit, 
  isTokenRetired, 
  handleChainError, 
  waitForTransactionAndRefresh, 
  listenForTransfers,
  isVerifiedProducer,
  getProducerInfo
} from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

const Buyer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetiring, setIsRetiring] = useState<number | null>(null);
  
  // New state for producer verification
  const [producerAddress, setProducerAddress] = useState('');
  const [producerInfo, setProducerInfo] = useState<{ state: string; city: string; isVerified: boolean } | null>(null);
  const [isCheckingProducer, setIsCheckingProducer] = useState(false);
  
  // Retirement confirmation state
  const [confirmRetirement, setConfirmRetirement] = useState<number | null>(null);

  useEffect(() => {
    loadWalletAndCredits();
    
    // Set up transfer event listener
    const setupTransferListener = async () => {
      await listenForTransfers((_from, _to, _tokenId) => {
        console.log('🔄 Transfer detected, refreshing credits...');
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
    };
    
    setupTransferListener();
  }, [walletAddress]);

  const loadWalletAndCredits = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        await loadCredits(address);
      }
    } catch (error) {
      console.error('Failed to load wallet and credits:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
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

  const handleCheckProducer = async () => {
    if (!producerAddress) {
      toast.error('Please enter a producer address');
      return;
    }

    if (!producerAddress.startsWith('0x') || producerAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    setIsCheckingProducer(true);
    
    try {
      const [isVerified, info] = await Promise.all([
        isVerifiedProducer(producerAddress),
        getProducerInfo(producerAddress)
      ]);
      
      setProducerInfo({
        state: info.state,
        city: info.city,
        isVerified
      });
      
      if (isVerified) {
        toast.success('Producer verified! This producer can sell legitimate tokens.');
      } else {
        toast.info('Producer not verified. Be cautious when purchasing tokens.');
      }
      
    } catch (error) {
      console.error('Failed to check producer:', error);
      toast.error('Failed to verify producer');
      setProducerInfo(null);
    } finally {
      setIsCheckingProducer(false);
    }
  };

  const handleRetireCredit = async (tokenId: number) => {
    setIsRetiring(tokenId);
    
    try {
      const tx = await retireCredit(tokenId);
      
      toast.info('Retirement submitted. Waiting for confirmation...');
      
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      toast.success(`Credit #${tokenId} retired successfully`);
      setConfirmRetirement(null);
      
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsRetiring(null);
    }
  };

  const downloadRetirementProof = (tokenId: number) => {
    const proof = {
      creditId: tokenId,
      retiredBy: walletAddress,
      retiredAt: new Date().toISOString(),
      blockchain: 'Ethereum Sepolia Testnet',
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
      purpose: 'Carbon offset via green hydrogen credit retirement',
      verification: 'This credit has been permanently retired and cannot be transferred.',
    };
    
    const dataStr = JSON.stringify(proof, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hydrocred-retirement-proof-${tokenId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Retirement proof downloaded');
  };

  const handleRefresh = () => {
    if (walletAddress) {
      loadCredits(walletAddress);
      toast.info('Refreshing credits...');
    }
  };

  const clearProducerCheck = () => {
    setProducerAddress('');
    setProducerInfo(null);
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
          <Users className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the buyer dashboard</p>
        </motion.div>
      </div>
    );
  }

  const activeCredits = credits.filter(c => !c.isRetired);
  const retiredCredits = credits.filter(c => c.isRetired);

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
                <Users className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Purchase and retire credits for carbon offset</p>
          </div>

          {/* Producer Verification */}
          <div className="mb-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Search className="h-5 w-5 mr-2 text-brand" />
                Verify Producer
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Producer Address
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={producerAddress}
                      onChange={(e) => setProducerAddress(e.target.value)}
                      placeholder="0x..."
                      className="input flex-1"
                    />
                    <button
                      onClick={handleCheckProducer}
                      disabled={isCheckingProducer}
                      className="btn-primary px-4"
                    >
                      {isCheckingProducer ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Verify a producer before purchasing tokens
                  </p>
                </div>

                {producerInfo && (
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Producer Status</h3>
                      <button
                        onClick={clearProducerCheck}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {producerInfo.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          producerInfo.isVerified ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {producerInfo.isVerified ? 'Verified Producer' : 'Not Verified'}
                        </span>
                      </div>
                      
                      {producerInfo.state && (
                        <p className="text-sm text-gray-300">
                          State: <span className="text-white">{producerInfo.state}</span>
                        </p>
                      )}
                      
                      {producerInfo.city && (
                        <p className="text-sm text-gray-300">
                          City: <span className="text-white">{producerInfo.city}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-gray-400">Available to Retire</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-orange-400">{retiredCredits.length}</h3>
              <p className="text-gray-400">Retired for Offset</p>
            </motion.div>
          </div>

          {/* Credits Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Credits */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Active Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No active credits. Purchase credits from verified producers to get started.
                  </p>
                ) : (
                  activeCredits.map((credit) => (
                    <div key={credit.tokenId} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-brand">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-400">
                            1 verified green hydrogen unit
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setConfirmRetirement(credit.tokenId)}
                            disabled={isRetiring === credit.tokenId}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Retire</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-400 font-medium">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Retired Credits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Retired Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {retiredCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No retired credits yet
                  </p>
                ) : (
                  retiredCredits.map((credit) => (
                    <div key={credit.tokenId} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 opacity-80">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-300">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-500">
                            Permanently retired
                          </p>
                        </div>
                        
                        <button
                          onClick={() => downloadRetirementProof(credit.tokenId)}
                          className="bg-brand hover:bg-brand-accent text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Proof</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                        <span className="text-xs text-gray-500 font-medium">Retired</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Information Panel */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Buyer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">Producer Verification</h3>
                  <p className="text-sm text-gray-300">
                    Always verify producers before purchasing tokens. Verified producers have been 
                    approved by State Admins and can sell legitimate green hydrogen credits.
                  </p>
                </div>
                
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">Credit Retirement</h3>
                  <p className="text-sm text-gray-300">
                    Retire credits to offset your carbon footprint. Retired credits are permanently 
                    removed from circulation and provide proof of environmental action.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Marketplace Discovery */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Search className="h-5 w-5 mr-2 text-brand" />
                Discover Available Credits
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-400 mb-2">How to Buy Credits</h3>
                      <p className="text-sm text-gray-300 mb-3">
                        To purchase green hydrogen credits, you need to:
                      </p>
                      <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Connect with verified producers directly</li>
                        <li>Negotiate the price and terms</li>
                        <li>Provide your wallet address to the producer</li>
                        <li>Producer will transfer the credit to your wallet</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-400 mb-2">Finding Producers</h3>
                      <p className="text-sm text-gray-300">
                        Look for verified producers in your region. You can use the producer verification 
                        tool above to check if an address belongs to a verified producer before making a purchase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Retirement Confirmation Modal */}
          {confirmRetirement && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card max-w-md mx-4"
              >
                <h3 className="text-xl font-bold mb-4">Confirm Credit Retirement</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to retire Credit #{confirmRetirement}? 
                  This action is permanent and cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfirmRetirement(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRetireCredit(confirmRetirement)}
                    disabled={isRetiring === confirmRetirement}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex-1 flex items-center justify-center space-x-2"
                  >
                    {isRetiring === confirmRetirement ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Retiring...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Retire Credit</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Buyer;
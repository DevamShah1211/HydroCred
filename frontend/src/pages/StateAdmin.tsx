import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { getWalletAddress, getAdminStates, getPendingRequestsForState, getRequestDetails, approveRequest } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface TokenRequest {
  requestId: number;
  producer: string;
  amount: number;
  state: string;
  timestamp: number;
  approved: boolean;
  processed: boolean;
}

const StateAdmin: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [adminStates, setAdminStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [pendingRequests, setPendingRequests] = useState<TokenRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWalletAndAdminStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadPendingRequests(selectedState);
    }
  }, [selectedState]);

  const loadWalletAndAdminStates = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        const states = await getAdminStates();
        setAdminStates(states);
        if (states.length > 0) {
          setSelectedState(states[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load wallet and admin states:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async (state: string) => {
    try {
      const requestIds = await getPendingRequestsForState(state);
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
      
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      toast.error('Failed to load pending requests');
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    setIsApproving(requestId);
    
    try {
      const tx = await approveRequest(requestId);
      
      toast.info('Request approval submitted. Waiting for confirmation...');
      
      await tx.wait();
      
      toast.success(`Request #${requestId} approved successfully`);
      
      // Refresh the requests list
      if (selectedState) {
        loadPendingRequests(selectedState);
      }
      
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setIsApproving(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (selectedState) {
      await loadPendingRequests(selectedState);
    }
    setIsRefreshing(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
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
          <Building2 className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the State Admin dashboard</p>
        </motion.div>
      </div>
    );
  }

  if (adminStates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Admin States Found</h1>
          <p className="text-gray-400">You are not assigned as a State Admin for any state</p>
          <p className="text-sm text-gray-500 mt-2">Connected: {walletAddress}</p>
        </motion.div>
      </div>
    );
  }

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
                <Building2 className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">State Admin Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Manage producer token requests for your assigned states</p>
            <div className="mt-2 text-sm text-gray-500">
              Connected: {walletAddress}
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
              <Building2 className="h-8 w-8 text-brand mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-brand">{adminStates.length}</h3>
              <p className="text-gray-400">Admin States</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-yellow-400">{pendingRequests.length}</h3>
              <p className="text-gray-400">Pending Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-400">Ready to Approve</h3>
              <p className="text-gray-400">Producer Requests</p>
            </motion.div>
          </div>

          {/* State Selection */}
          <div className="mb-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Select State</h2>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="input w-full max-w-xs"
              >
                {adminStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-400" />
              Pending Token Requests - {selectedState}
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending requests for {selectedState}</p>
                <p className="text-gray-500 text-sm">Producers will appear here when they request tokens</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.requestId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-brand/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Request #{request.requestId}
                        </h3>
                        <p className="text-gray-400">
                          Producer: {formatAddress(request.producer)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand">
                          {request.amount} tokens
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatTimestamp(request.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        <p>State: <span className="text-white">{request.state}</span></p>
                        <p>Status: <span className="text-yellow-400">Pending Approval</span></p>
                      </div>
                      
                      <button
                        onClick={() => handleApproveRequest(request.requestId)}
                        disabled={isApproving === request.requestId}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isApproving === request.requestId ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Information Panel */}
          <div className="mt-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">State Admin Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">Your Role</h3>
                  <p className="text-sm text-gray-300">
                    As a State Admin for {selectedState}, you can approve token requests from producers 
                    in your assigned state. Each approval will mint the requested tokens to the producer.
                  </p>
                </div>
                
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">Approval Process</h3>
                  <p className="text-sm text-gray-300">
                    When you approve a request, the producer becomes verified and receives the requested 
                    tokens. They can then sell these tokens to buyers in the marketplace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StateAdmin;

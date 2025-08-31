import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { getWalletAddress, assignStateAdmin, isMainAdmin, testContractConnection } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MainAdmin: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isMainAdminUser, setIsMainAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Form state
  const [newStateAdmin, setNewStateAdmin] = useState('');
  const [selectedState, setSelectedState] = useState('');
  
  // Common Indian states
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  useEffect(() => {
    loadWalletAndCheckAdmin();
  }, []);

  const loadWalletAndCheckAdmin = async () => {
    try {
      console.log('🔄 Loading wallet and checking admin status...');
      
      const address = await getWalletAddress();
      setWalletAddress(address);
      console.log('👤 Wallet address:', address);
      
      if (address) {
        // First test the contract connection
        console.log('🧪 Testing contract connection...');
        const connectionTest = await testContractConnection();
        console.log('📋 Connection test result:', connectionTest);
        
        if (connectionTest.success) {
          console.log('✅ Contract connection successful, checking admin status...');
          const adminStatus = await isMainAdmin();
          console.log('🔐 Admin status:', adminStatus);
          setIsMainAdminUser(Boolean(adminStatus));
        } else {
          console.error('❌ Contract connection failed:', connectionTest.error);
          toast.error('Contract connection failed. Please check the console for details.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load wallet and check admin status:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignStateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStateAdmin || !selectedState) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newStateAdmin.startsWith('0x') || newStateAdmin.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    setIsAssigning(true);
    
    try {
      const tx = await assignStateAdmin(newStateAdmin, selectedState);
      
      toast.info('State Admin assignment submitted. Waiting for confirmation...');
      
      await tx.wait();
      
      toast.success(`State Admin assigned successfully for ${selectedState}`);
      setNewStateAdmin('');
      setSelectedState('');
      
    } catch (error: any) {
      console.error('Failed to assign state admin:', error);
      toast.error(error.message || 'Failed to assign state admin');
    } finally {
      setIsAssigning(false);
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
          <Crown className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the Main Admin dashboard</p>
        </motion.div>
      </div>
    );
  }

  if (!isMainAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Only the Main Admin can access this dashboard</p>
          <p className="text-sm text-gray-500 mt-2">Connected: {walletAddress}</p>
          
          {/* Debug section */}
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <button
              onClick={async () => {
                console.log('🧪 Manual contract test...');
                const result = await testContractConnection();
                console.log('📋 Manual test result:', result);
                if (result.success) {
                  toast.success('Contract connection successful!');
                } else {
                  toast.error(`Contract test failed: ${result.error}`);
                }
              }}
              className="btn-secondary"
            >
              Test Contract Connection
            </button>
            <button
              onClick={async () => {
                console.log('🔐 Manual admin check...');
                const result = await isMainAdmin();
                console.log('📋 Admin check result:', result);
                toast.info(`Admin status: ${result ? 'Yes' : 'No'}`);
              }}
              className="btn-secondary ml-2"
            >
              Check Admin Status
            </button>
          </div>
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
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="h-8 w-8 text-brand" />
              <h1 className="text-3xl font-bold">Main Admin Dashboard</h1>
            </div>
            <p className="text-gray-400">Manage state administrators and system configuration</p>
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
              <Crown className="h-8 w-8 text-brand mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-brand">Main Admin</h3>
              <p className="text-gray-400">System Administrator</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-400">{indianStates.length}</h3>
              <p className="text-gray-400">Available States</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <MapPin className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-blue-400">State Admins</h3>
              <p className="text-gray-400">To be assigned</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assign State Admin Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Users className="h-5 w-5 mr-2 text-brand" />
                Assign State Admin
              </h2>
              
              <form onSubmit={handleAssignStateAdmin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Choose a state...</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    State Admin Address
                  </label>
                  <input
                    type="text"
                    value={newStateAdmin}
                    onChange={(e) => setNewStateAdmin(e.target.value)}
                    placeholder="0x..."
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Ethereum wallet address of the state admin
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAssigning}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isAssigning ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Assign State Admin</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Information Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">System Information</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">Main Admin Role</h3>
                  <p className="text-sm text-gray-300">
                    As the Main Admin, you can assign State Admins for each state. 
                    State Admins will then be responsible for approving producers in their respective states.
                  </p>
                </div>
                
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <h3 className="font-semibold text-green-400 mb-2">State Admin Assignment</h3>
                  <p className="text-sm text-gray-300">
                    Each state can have one State Admin. State Admins can approve 
                    producers and manage token requests within their assigned state.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <h3 className="font-semibold text-yellow-400 mb-2">Important Notes</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• State Admin addresses must be valid Ethereum addresses</li>
                    <li>• Each state can only have one admin assigned</li>
                    <li>• State Admins cannot be changed once assigned</li>
                    <li>• Only you can assign State Admins</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MainAdmin;

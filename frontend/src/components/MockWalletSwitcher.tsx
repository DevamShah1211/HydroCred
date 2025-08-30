import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users, RefreshCw } from 'lucide-react';
import { MockBlockchain } from '../lib/chain';
import { toast } from './Toast';

const MockWalletSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const mockAddresses = MockBlockchain.getMockAddresses();
  
  React.useEffect(() => {
    setCurrentAddress(MockBlockchain.getCurrentMockAddress());
  }, []);

  const handleSwitchAddress = (address: string) => {
    MockBlockchain.switchMockAddress(address);
    setCurrentAddress(address);
    setIsOpen(false);
    
    // Force page refresh to update all components
    window.location.reload();
  };

  const handleReset = async () => {
    try {
      // Call backend reset endpoint
      const response = await fetch('/api/mock/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success('Mock blockchain reset successfully');
        // Force page refresh
        window.location.reload();
      } else {
        toast.error('Failed to reset mock blockchain');
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset mock blockchain');
    }
  };

  const getAddressLabel = (address: string): string => {
    for (const [key, value] of Object.entries(mockAddresses)) {
      if (value === address) {
        return key.charAt(0) + key.slice(1).toLowerCase();
      }
    }
    return 'Unknown';
  };

  const getAddressColor = (address: string): string => {
    if (address === mockAddresses.CERTIFIER) return 'text-green-400';
    if (address === mockAddresses.PRODUCER) return 'text-blue-400';
    if (address === mockAddresses.BUYER) return 'text-purple-400';
    if (address === mockAddresses.REGULATOR) return 'text-orange-400';
    return 'text-gray-400';
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development mode
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand hover:bg-brand-accent text-white rounded-full p-3 shadow-lg"
        title="Mock Wallet Switcher"
      >
        <Wallet className="h-5 w-5" />
      </motion.button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-16 right-0 bg-gray-800 border border-gray-700 rounded-xl p-4 min-w-80 shadow-2xl"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Mock Wallet Switcher
            </h3>
            <p className="text-sm text-gray-400">
              Switch between different mock addresses to test different roles
            </p>
          </div>

          {/* Current Address */}
          {currentAddress && (
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Current Address</p>
              <p className="text-sm font-mono text-white">
                {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
              </p>
              <p className={`text-xs ${getAddressColor(currentAddress)}`}>
                {getAddressLabel(currentAddress)}
              </p>
            </div>
          )}

          {/* Address Options */}
          <div className="space-y-2 mb-4">
            {Object.entries(mockAddresses).map(([role, address]) => (
              <button
                key={role}
                onClick={() => handleSwitchAddress(address)}
                className={`w-full p-3 rounded-lg border transition-all ${
                  currentAddress === address
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-medium">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
                    <p className="text-xs font-mono opacity-75">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${getAddressColor(address)} bg-gray-700/50`}>
                    {role === 'CERTIFIER' && 'Admin + Certifier'}
                    {role === 'PRODUCER' && 'Producer'}
                    {role === 'BUYER' && 'Buyer'}
                    {role === 'REGULATOR' && 'Regulator'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Mock Blockchain</span>
          </button>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 This resets all mock data and returns to initial state. All transactions will be cleared.
            </p>
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}
    </div>
  );
};

export default MockWalletSwitcher;
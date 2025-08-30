import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users, Shield, Building, Eye } from 'lucide-react';
import { getAvailableWallets, switchWallet, getWalletAddress } from '../lib/mockChain';
import { toast } from './Toast';

interface WalletSelectorProps {
  onWalletChange?: (address: string, walletName: string) => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ onWalletChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [currentWalletName, setCurrentWalletName] = useState<string>('');

  const wallets = getAvailableWallets();

  const roleIcons = {
    'Certifier Wallet': Shield,
    'Producer Wallet': Building,
    'Buyer Wallet': Users,
    'Regulator Wallet': Eye
  };

  const roleColors = {
    'Certifier Wallet': 'bg-purple-500',
    'Producer Wallet': 'bg-green-500',
    'Buyer Wallet': 'bg-blue-500',
    'Regulator Wallet': 'bg-orange-500'
  };

  useEffect(() => {
    loadCurrentWallet();
  }, []);

  const loadCurrentWallet = async () => {
    const address = await getWalletAddress();
    if (address) {
      const wallet = wallets.find(w => w.address === address);
      setCurrentWallet(address);
      setCurrentWalletName(wallet?.name || 'Unknown Wallet');
    }
  };

  const handleWalletSwitch = async (walletName: string) => {
    try {
      const address = await switchWallet(walletName);
      setCurrentWallet(address);
      setCurrentWalletName(walletName);
      setIsOpen(false);
      
      toast.success(`Switched to ${walletName}`);
      
      if (onWalletChange) {
        onWalletChange(address, walletName);
      }
    } catch (error) {
      console.error('Failed to switch wallet:', error);
      toast.error('Failed to switch wallet');
    }
  };

  const getCurrentIcon = () => {
    const IconComponent = roleIcons[currentWalletName as keyof typeof roleIcons] || Wallet;
    return IconComponent;
  };

  const getCurrentColor = () => {
    return roleColors[currentWalletName as keyof typeof roleColors] || 'bg-gray-500';
  };

  if (!currentWallet) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleWalletSwitch('Producer Wallet')}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 transition-colors"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-3 px-4 py-2 ${getCurrentColor()} text-white rounded-lg hover:opacity-80 transition-opacity`}
      >
        <CurrentIcon className="h-4 w-4" />
        <div className="text-left">
          <div className="text-sm font-medium">{currentWalletName}</div>
          <div className="text-xs opacity-80">
            {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}
          </div>
        </div>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              Switch Wallet
            </div>
            
            {wallets.map((wallet) => {
              const Icon = roleIcons[wallet.name as keyof typeof roleIcons] || Wallet;
              const colorClass = roleColors[wallet.name as keyof typeof roleColors] || 'bg-gray-500';
              const isActive = wallet.address === currentWallet;
              
              return (
                <button
                  key={wallet.address}
                  onClick={() => handleWalletSwitch(wallet.name)}
                  disabled={isActive}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gray-100 dark:bg-gray-700 cursor-default' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`p-1.5 ${colorClass} rounded-md`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {wallet.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                  </div>
                  {isActive && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletSelector;
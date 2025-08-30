import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Info, Users, Shield, Building, Eye, RotateCcw, Database, X } from 'lucide-react';
import { getAvailableWallets, resetDemoData, getDebugData } from '../lib/chain';
import { toast } from './Toast';

const DemoConfig: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const wallets = getAvailableWallets();

  const roleIcons = {
    'Certifier Wallet': Shield,
    'Producer Wallet': Building,
    'Buyer Wallet': Users,
    'Regulator Wallet': Eye
  };

  const roleDescriptions = {
    'Certifier Wallet': 'Can issue green hydrogen credits to producers',
    'Producer Wallet': 'Can receive and transfer credits',
    'Buyer Wallet': 'Can purchase and retire credits for carbon offsetting',
    'Regulator Wallet': 'Can view all transactions and audit the system'
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast.success('Demo data has been reset to defaults');
    setDebugData(null);
    window.location.reload();
  };

  const handleShowDebugData = () => {
    const data = getDebugData();
    setDebugData(data);
    toast.info('Debug data loaded');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
      >
        <Settings className="h-4 w-4" />
        <span>Demo Config</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Demo Configuration
              </h3>
            </div>

            <div className="space-y-4">
              {/* Available Wallets */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Demo Wallets
                </h4>
                <div className="space-y-2">
                  {wallets.map((wallet) => {
                    const Icon = roleIcons[wallet.name as keyof typeof roleIcons] || Users;
                    return (
                      <div
                        key={wallet.address}
                        className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <Icon className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {wallet.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {wallet.address}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {roleDescriptions[wallet.name as keyof typeof roleDescriptions]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Demo Controls */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Demo Controls
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={handleResetDemo}
                    className="w-full flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset All Demo Data</span>
                  </button>
                  
                  <button
                    onClick={handleShowDebugData}
                    className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Database className="h-4 w-4" />
                    <span>Show Debug Data</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How to Use
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Switch between different wallet roles using the wallet selector</p>
                  <p>• All transactions are simulated and stored locally</p>
                  <p>• Use "Reset Demo" to restore initial state</p>
                  <p>• No MetaMask or real blockchain required</p>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Data Modal */}
          {debugData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl max-h-96 overflow-auto m-4">
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Debug Data
                    </h3>
                    <button
                      onClick={() => setDebugData(null)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DemoConfig;
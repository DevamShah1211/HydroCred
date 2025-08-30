import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, Zap, Database } from 'lucide-react';
import { switchMockUser, getMockAddresses, getMockTokens } from '../lib/chainWrapper';
import { toast } from './Toast';

const DemoControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!switchMockUser) {
    return null; // Only show in mock mode
  }

  const handleResetDemo = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
    toast.info('Demo data reset - page refreshed');
  };

  const handleQuickDemo = () => {
    toast.info('Starting quick demo scenario...');
    
    // Simulate a quick demo flow
    setTimeout(() => {
      if (switchMockUser) {
        switchMockUser('certifier');
        toast.success('Switched to Certifier - try issuing credits!');
      }
    }, 1000);
  };

  const mockStats = getMockTokens ? getMockTokens() : [];
  const totalTokens = mockStats.length;
  const retiredTokens = mockStats.filter(t => t.isRetired).length;
  const activeTokens = totalTokens - retiredTokens;

  return (
    <>
      {/* Floating Control Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-brand hover:bg-brand-accent text-white p-3 rounded-full shadow-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="h-5 w-5" />
      </motion.button>

      {/* Demo Control Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed bottom-20 right-6 z-40 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Zap className="h-4 w-4 text-brand" />
              <span>Demo Controls</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Stats */}
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Mock Data Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-brand font-bold">{totalTokens}</div>
                <div className="text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold">{activeTokens}</div>
                <div className="text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold">{retiredTokens}</div>
                <div className="text-gray-400">Retired</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleQuickDemo}
              className="w-full btn-primary text-sm py-2"
            >
              🎬 Quick Demo
            </button>
            
            <button
              onClick={handleResetDemo}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            All transactions are simulated
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default DemoControls;
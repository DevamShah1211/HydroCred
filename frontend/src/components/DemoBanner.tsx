import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Info } from 'lucide-react';

const DemoBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-400" />
          <span className="text-blue-300 font-medium">Demo Mode</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-300">
          <Info className="h-4 w-4" />
          <span>All transactions are simulated • No MetaMask required • Data persists locally</span>
        </div>
        
        <div className="md:hidden text-sm text-gray-300">
          <span>Simulated transactions</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoBanner;
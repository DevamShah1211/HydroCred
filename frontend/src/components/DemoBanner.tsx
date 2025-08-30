import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, X, Play } from 'lucide-react';
import { USE_MOCK_DATA } from '../lib/config';

const DemoBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!USE_MOCK_DATA || !isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative flex items-center justify-center space-x-3">
        <Play className="h-5 w-5" />
        <span className="font-medium">
          🎮 Demo Mode Active - All transactions are simulated for demonstration
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 hover:bg-white/20 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default DemoBanner;
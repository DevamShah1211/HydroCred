import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronDown } from 'lucide-react';
import { switchMockUser, getMockAddresses } from '../lib/chainWrapper';
import { toast } from './Toast';

const UserSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState('certifier');

  const users = [
    { key: 'certifier', label: '🛡️ Certifier', description: 'Issues credits to producers' },
    { key: 'producer1', label: '🏭 Producer A', description: 'Hydrogen production facility' },
    { key: 'producer2', label: '🏭 Producer B', description: 'Another production facility' },
    { key: 'buyer1', label: '🏢 Buyer A', description: 'Corporate buyer of credits' },
    { key: 'buyer2', label: '🏢 Buyer B', description: 'Another corporate buyer' },
    { key: 'regulator', label: '🏛️ Regulator', description: 'Oversight and monitoring' },
  ];

  const handleUserSwitch = (userKey: string) => {
    if (switchMockUser) {
      const address = switchMockUser(userKey as any);
      setCurrentUser(userKey);
      setIsOpen(false);
      
      const user = users.find(u => u.key === userKey);
      toast.success(`Switched to ${user?.label} (${address.slice(0, 6)}...${address.slice(-4)})`);
      
      // Refresh the page to update all components
      window.location.reload();
    }
  };

  // Only show in mock mode
  if (!switchMockUser) {
    return null;
  }

  const currentUserData = users.find(u => u.key === currentUser);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
      >
        <Users className="h-4 w-4 text-brand" />
        <span className="text-sm font-medium">{currentUserData?.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50"
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700 mb-2">
              Demo Mode - Switch User Role
            </div>
            {users.map((user) => (
              <button
                key={user.key}
                onClick={() => handleUserSwitch(user.key)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
                  currentUser === user.key ? 'bg-gray-700 border border-brand/30' : ''
                }`}
              >
                <div className="font-medium text-sm">{user.label}</div>
                <div className="text-xs text-gray-400">{user.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserSwitcher;
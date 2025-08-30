import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../hooks/useAuth';
import { WalletIcon, UserIcon, MenuIcon, XIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { account, isConnected, connect, disconnect, isConnecting } = useWallet();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    disconnect();
    setShowUserMenu(false);
    navigate('/');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HydroCred</span>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              to="/marketplace"
              className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Marketplace
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                {['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(user.role) && (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {user.role === 'PRODUCER' && (
                  <Link
                    to="/producer"
                    className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Producer
                  </Link>
                )}
                {user.role === 'BUYER' && (
                  <Link
                    to="/buyer"
                    className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Buyer
                  </Link>
                )}
                {user.role === 'AUDITOR' && (
                  <Link
                    to="/auditor"
                    className="text-gray-600 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Auditor
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side - Wallet and User */}
          <div className="flex items-center space-x-4">
            {/* Wallet Connection */}
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <WalletIcon className="h-5 w-5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Wallet Info */}
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <WalletIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-mono">
                    {formatAddress(account!)}
                  </span>
                </div>

                {/* User Menu */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg transition-colors"
                    >
                      <UserIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {user.username}
                      </span>
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
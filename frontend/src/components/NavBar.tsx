import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, RotateCcw } from 'lucide-react';
import { getWalletAddress, resetDemoData } from '../lib/chain';
import WalletSelector from './WalletSelector';
import DemoConfig from './DemoConfig';
import { toast } from './Toast';

const NavBar: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const handleWalletChange = (address: string, walletName: string) => {
    setWalletAddress(address);
    // Refresh the current page to update data
    window.location.reload();
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast.success('Demo data reset successfully');
    window.location.reload();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/certifier', label: 'Certifier' },
    { path: '/producer', label: 'Producer' },
    { path: '/buyer', label: 'Buyer' },
    { path: '/regulator', label: 'Regulator' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src="/hydrocred.png" alt="HydroCred" className="h-8 w-8" />
            <span className="text-xl font-bold gradient-text">HydroCred</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-brand/20 text-brand'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Connection & Demo Controls */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <DemoConfig />
            </div>
            
            <WalletSelector onWalletChange={handleWalletChange} />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-brand/20 text-brand'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  handleResetDemo();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-sm mt-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
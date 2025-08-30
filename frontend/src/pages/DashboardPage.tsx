import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon, 
  ShoppingCartIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { account, chainId } = useWallet();

  const getRoleDisplay = (role: string) => {
    const roleConfigs = {
      'COUNTRY_ADMIN': { label: 'Country Administrator', color: 'bg-purple-100 text-purple-800' },
      'STATE_ADMIN': { label: 'State Administrator', color: 'bg-blue-100 text-blue-800' },
      'CITY_ADMIN': { label: 'City Administrator', color: 'bg-indigo-100 text-indigo-800' },
      'PRODUCER': { label: 'Hydrogen Producer', color: 'bg-green-100 text-green-800' },
      'BUYER': { label: 'Credit Buyer', color: 'bg-orange-100 text-orange-800' },
      'AUDITOR': { label: 'System Auditor', color: 'bg-gray-100 text-gray-800' },
    };
    
    return roleConfigs[role as keyof typeof roleConfigs] || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const getQuickActions = () => {
    const actions = [
      {
        title: 'View Profile',
        description: 'Update your account information',
        icon: UserGroupIcon,
        href: '/profile',
        color: 'bg-blue-500',
      },
      {
        title: 'Marketplace',
        description: 'Browse available hydrogen credits',
        icon: ShoppingCartIcon,
        href: '/marketplace',
        color: 'bg-green-500',
      },
    ];

    // Add role-specific actions
    if (['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(user?.role || '')) {
      actions.push({
        title: 'Admin Dashboard',
        description: 'Manage users and certifications',
        icon: ShieldCheckIcon,
        href: '/admin',
        color: 'bg-purple-500',
      });
    }

    if (user?.role === 'PRODUCER') {
      actions.push({
        title: 'Producer Dashboard',
        description: 'Manage production requests',
        icon: DocumentTextIcon,
        href: '/producer',
        color: 'bg-teal-500',
      });
    }

    if (user?.role === 'BUYER') {
      actions.push({
        title: 'Buyer Dashboard',
        description: 'View purchased credits',
        icon: ShoppingCartIcon,
        href: '/buyer',
        color: 'bg-orange-500',
      });
    }

    if (user?.role === 'AUDITOR') {
      actions.push({
        title: 'Auditor Dashboard',
        description: 'View system audit logs',
        icon: DocumentTextIcon,
        href: '/auditor',
        color: 'bg-gray-500',
      });
    }

    return actions;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
    
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80002: 'Polygon Amoy Testnet',
      1337: 'Localhost',
    };
    
    return networks[chainId as keyof typeof networks] || `Chain ID: ${chainId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your HydroCred account
          </p>
        </motion.div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Role Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getRoleDisplay(user?.role || '').label}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${getRoleDisplay(user?.role || '').color}`}>
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${
                user?.isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  user?.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
            </div>
          </motion.div>

          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet</p>
                <p className="text-sm font-mono text-gray-900">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <ChartBarIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          {/* Network Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Network</p>
                <p className="text-sm font-semibold text-gray-900">
                  {getNetworkName(chainId)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                <CogIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getQuickActions().map((action, index) => (
              <Link
                key={action.title}
                to={action.href}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-200 group-hover:border-gray-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Profile Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                {user?.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                )}
                {user?.organization && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organization:</span>
                    <span className="font-medium">{user.organization}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Location</h3>
              <div className="space-y-2">
                {user?.country && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{user.country}</span>
                  </div>
                )}
                {user?.state && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">State:</span>
                    <span className="font-medium">{user.state}</span>
                  </div>
                )}
                {user?.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-medium">{user.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {user?.verifiedBy && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Verification</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Verified by:</span>
                <span className="font-mono text-sm">{user.verifiedBy}</span>
              </div>
              {user.verifiedAt && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Verified on:</span>
                  <span className="font-medium">
                    {new Date(user.verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
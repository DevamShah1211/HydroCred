import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { buyerAPI } from '../services/api';
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load buyer dashboard data
      const dashboardResponse = await buyerAPI.getDashboard();
      if (dashboardResponse.data.success) {
        // Handle dashboard data
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Buyer Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your purchased hydrogen credits and trading activities
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  0 H2CRED
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  0 H2CRED
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-800">
                <ChartBarIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retired Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  0 H2CRED
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-800">
                <ShoppingCartIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  $0.00
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-800">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center py-12"
        >
          <ShoppingCartIcon className="h-24 w-24 mx-auto mb-6 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Credits Purchased Yet
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start building your hydrogen credit portfolio by purchasing verified credits from the marketplace.
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Browse Marketplace
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <ShoppingCartIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Browse Marketplace</div>
                  <div className="text-sm text-gray-500">Find available hydrogen credits</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Transaction History</div>
                  <div className="text-sm text-gray-500">View your purchase history</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Portfolio Analytics</div>
                  <div className="text-sm text-gray-500">Track your credit performance</div>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerDashboardPage;
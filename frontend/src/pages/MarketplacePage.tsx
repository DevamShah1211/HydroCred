import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import { marketplaceAPI } from '../services/api';
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon,
  TagIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CreditSale {
  id: string;
  producer: {
    username: string;
    organization: string;
    country: string;
    state: string;
    city: string;
  };
  amount: number;
  price: number;
  totalPrice: number;
  createdAt: string;
  isActive: boolean;
}

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { account, signer } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<CreditSale[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'my-sales'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'amount' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadMarketplaceData();
  }, [filter, sortBy, sortOrder]);

  const loadMarketplaceData = async () => {
    try {
      setIsLoading(true);
      
      // Load marketplace data
      const salesResponse = await marketplaceAPI.getSales();
      if (salesResponse.data.success) {
        setSales(salesResponse.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (saleId: string) => {
    if (!account || !signer) {
      alert('Please connect your wallet to purchase credits');
      return;
    }

    try {
      // TODO: Implement blockchain purchase
      console.log('Purchasing sale:', saleId);
      alert('Purchase functionality will be implemented with blockchain integration');
    } catch (error) {
      console.error('Failed to purchase credits:', error);
      alert('Failed to purchase credits. Please try again.');
    }
  };

  const sortedSales = [...sales].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  if (isLoading) {
    return (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading marketplace...</p>
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
            Hydrogen Credits Marketplace
          </h1>
          <p className="text-gray-600">
            Buy and sell verified hydrogen credits from certified producers
          </p>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'my-sales')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Sales</option>
                <option value="active">Active Only</option>
                <option value="my-sales">My Sales</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'amount' | 'date')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="amount">Sort by Amount</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            {user?.role === 'PRODUCER' && (
              <button className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                <TagIcon className="h-4 w-4 mr-2" />
                List Credits for Sale
              </button>
            )}
          </div>
        </motion.div>

        {/* Sales Grid */}
        {sortedSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Producer Info */}
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-800 mr-3">
                      <BuildingOfficeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {sale.producer.organization}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.producer.city}, {sale.producer.state}
                      </div>
                    </div>
                  </div>

                  {/* Sale Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {sale.amount.toLocaleString()} H2CRED
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price per credit:</span>
                      <span className="font-semibold text-gray-900">
                        ${sale.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total price:</span>
                      <span className="font-semibold text-teal-600 text-lg">
                        ${sale.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </div>
                    
                    {sale.isActive ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Active
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">Inactive</div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  {sale.isActive && user?.role === 'BUYER' && (
                    <button
                      onClick={() => handlePurchase(sale.id)}
                      className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      Purchase Credits
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <TagIcon className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Credits Available
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {filter === 'my-sales' 
                ? "You haven't listed any credits for sale yet."
                : "No hydrogen credits are currently available in the marketplace."
              }
            </p>
            {user?.role === 'PRODUCER' && (
              <button className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                <TagIcon className="h-5 w-5 mr-2" />
                List Your First Credits
              </button>
            )}
          </motion.div>
        )}

        {/* Market Stats */}
        {sales.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Market Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {sales.length}
                </div>
                <div className="text-sm text-blue-600 font-medium">Total Listings</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {sales.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-green-600 font-medium">Active Listings</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  ${sales.reduce((sum, sale) => sum + sale.totalPrice, 0).toLocaleString()}
                </div>
                <div className="text-sm text-purple-600 font-medium">Total Value</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
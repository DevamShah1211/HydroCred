import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { auditorAPI } from '../services/api';
import { 
  DocumentMagnifyingGlassIcon, 
  ChartBarIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  totalProducers: number;
  totalBuyers: number;
  totalAdmins: number;
  totalProductionRequests: number;
  pendingRequests: number;
  certifiedRequests: number;
  rejectedRequests: number;
  totalProductionAmount: number;
}

const AuditorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const dashboardResponse = await auditorAPI.getDashboard();
      if (dashboardResponse.data.success) {
        setStats(dashboardResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportResponse = await auditorAPI.export(exportFormat);
      if (exportResponse.data.success) {
        // Handle export data
        if (exportFormat === 'json') {
          const dataStr = JSON.stringify(exportResponse.data.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hydrocred-audit-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
        // TODO: Handle CSV export
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsExporting(false);
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
            Auditor Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor system activities and export audit data for compliance
          </p>
        </motion.div>

        {/* Export Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Export Audit Data
              </h2>
              <p className="text-sm text-gray-600">
                Download comprehensive system data for external verification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                <UserGroupIcon className="h-6 w-6" />
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
                <p className="text-sm font-medium text-gray-600">Total Producers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalProducers || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-800">
                <BuildingOfficeIcon className="h-6 w-6" />
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
                <p className="text-sm font-medium text-gray-600">Total Buyers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalBuyers || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-800">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalAdmins || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-800">
                <ChartBarIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Production Requests Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Production Requests Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {stats?.totalProductionRequests || 0}
              </div>
              <div className="text-sm text-blue-600 font-medium">Total Requests</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {stats?.pendingRequests || 0}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {stats?.certifiedRequests || 0}
              </div>
              <div className="text-sm text-green-600 font-medium">Certified</div>
            </div>
          </div>
          
          {stats && stats.totalProductionAmount > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {stats.totalProductionAmount.toLocaleString()} kg
                </div>
                <div className="text-sm text-gray-600">Total Certified Production</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">View Production Requests</div>
                  <div className="text-sm text-gray-500">Review all production data</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">User Directory</div>
                  <div className="text-sm text-gray-500">Browse all registered users</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">System Analytics</div>
                  <div className="text-sm text-gray-500">View detailed statistics</div>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuditorDashboardPage;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { adminAPI } from '../services/api';
import { DashboardStats, User } from '../types/user';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load admin dashboard data
      const dashboardResponse = await adminAPI.getDashboard();
      if (dashboardResponse.data.success) {
        setStats(dashboardResponse.data.stats);
        setPendingRequests(dashboardResponse.data.pendingRequests || []);
      }

      // Load pending users for verification
      const usersResponse = await adminAPI.getUsers({ status: 'pending', limit: 10 });
      if (usersResponse.data.success) {
        setPendingUsers(usersResponse.data.users);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await adminAPI.verifyUser(userId);
      if (response.data.success) {
        toast.success('User verified successfully');
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to verify user:', error);
      toast.error('Failed to verify user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await adminAPI.revokeVerification(userId);
      if (response.data.success) {
        toast.success('User verification revoked');
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to revoke verification:', error);
      toast.error('Failed to revoke verification');
    }
  };

  const getAdminLevel = () => {
    switch (user?.role) {
      case 'COUNTRY_ADMIN':
        return 'Country';
      case 'STATE_ADMIN':
        return 'State';
      case 'CITY_ADMIN':
        return 'City';
      default:
        return 'Unknown';
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
            {getAdminLevel()} Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, certifications, and monitor system activity
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers || 0}
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
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingVerifications || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800">
                <ClockIcon className="h-6 w-6" />
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
                  {stats.totalProducers || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-800">
                <DocumentTextIcon className="h-6 w-6" />
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
                  {stats.totalBuyers || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-800">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Users Pending Verification
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {pendingUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No users pending verification
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((pendingUser) => (
                      <tr key={pendingUser.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {pendingUser.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pendingUser.walletAddress.slice(0, 6)}...{pendingUser.walletAddress.slice(-4)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {pendingUser.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {[pendingUser.country, pendingUser.state, pendingUser.city]
                            .filter(Boolean)
                            .join(', ') || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVerifyUser(pendingUser.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Verify
                            </button>
                            <button
                              onClick={() => handleRejectUser(pendingUser.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Production Requests */}
        {user?.role === 'CITY_ADMIN' && pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Production Requests Pending Certification
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.producer?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.producer?.organization || 'No organization'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.amount} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-teal-600 hover:text-teal-900">
                            Review Request
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

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
                <UserGroupIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">View All Users</div>
                  <div className="text-sm text-gray-500">Browse and manage users</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Production Requests</div>
                  <div className="text-sm text-gray-500">Review certification requests</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">System Reports</div>
                  <div className="text-sm text-gray-500">Generate activity reports</div>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
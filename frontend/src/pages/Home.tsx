import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Leaf, BarChart3, Play, Zap, Settings } from 'lucide-react';
import DemoConfig from '../components/DemoConfig';

const Home: React.FC = () => {
  const roles = [
    {
      title: 'Certifier',
      description: 'Issue verified green hydrogen credits to producers',
      icon: <Shield className="h-8 w-8" />,
      path: '/certifier',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Producer',
      description: 'Manage and transfer your hydrogen production credits',
      icon: <Leaf className="h-8 w-8" />,
      path: '/producer',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Buyer',
      description: 'Purchase and retire credits for carbon offset',
      icon: <Users className="h-8 w-8" />,
      path: '/buyer',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Regulator',
      description: 'Monitor and audit the credit system',
      icon: <BarChart3 className="h-8 w-8" />,
      path: '/regulator',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <img src="/hydrocred.png" alt="HydroCred" className="h-24 w-24 mx-auto mb-6" />
              <h1 className="text-6xl font-bold mb-4">
                <span className="gradient-text">HydroCred</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
                Blockchain-powered green hydrogen credit system with immutable audit trails.
                Issue, transfer, and retire verified hydrogen production credits.
              </p>
              
              {/* Demo Mode Banner */}
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl px-6 py-3 mb-8">
                <Zap className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Demo Mode Active</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-300">No MetaMask required</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">Ethereum Testnet</span>
              </div>
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">ERC-721 Standard</span>
              </div>
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">Immutable Ledger</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl"></div>
        </div>
      </motion.div>

      {/* Roles Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select your role to access the appropriate dashboard and functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
            >
              <Link to={role.path} className="block group">
                <div className="card hover:bg-gray-800/70 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 text-white`}>
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-brand transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Demo Guide Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="bg-gray-900/30 py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="gradient-text">Try the Demo</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the full HydroCred system with simulated blockchain transactions. 
              No setup required - everything works out of the box!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white">Switch Wallets</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Use the wallet selector in the top-right to switch between different roles: 
                Certifier, Producer, Buyer, and Regulator.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Perform Transactions</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Issue credits as a Certifier, transfer them as a Producer, 
                or retire them as a Buyer. All transactions are simulated perfectly.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">View Results</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Check the Regulator dashboard to see all transactions, 
                or view your credits in the Producer/Buyer dashboards.
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center space-x-4">
              <Link 
                to="/certifier"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              >
                <Play className="h-4 w-4" />
                <span>Start Demo</span>
              </Link>
              
              <div className="hidden md:block">
                <DemoConfig />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="bg-gray-900/50 py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why HydroCred?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Immutable Verification</h3>
              <p className="text-gray-400">Every credit is cryptographically verified and recorded on the blockchain</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Green Energy Focus</h3>
              <p className="text-gray-400">Specifically designed for green hydrogen production credits</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Audit Trail</h3>
              <p className="text-gray-400">Track every credit from issuance to retirement with full transparency</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
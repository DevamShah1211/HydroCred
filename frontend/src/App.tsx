
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProducerDashboardPage from './pages/ProducerDashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import AuditorDashboardPage from './pages/AuditorDashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';

// Context
import { WalletProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';

// Hooks
import { useAuth } from './hooks/useAuth';

// Types
import { UserRole } from './types/user';

// Styles
import './styles/globals.css';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Admin Routes */}
              {['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(user.role) && (
                <Route path="/admin" element={<AdminDashboardPage />} />
              )}
              
              {/* Producer Routes */}
              {user.role === 'PRODUCER' && (
                <Route path="/producer" element={<ProducerDashboardPage />} />
              )}
              
              {/* Buyer Routes */}
              {user.role === 'BUYER' && (
                <Route path="/buyer" element={<BuyerDashboardPage />} />
              )}
              
              {/* Auditor Routes */}
              {user.role === 'AUDITOR' && (
                <Route path="/auditor" element={<AuditorDashboardPage />} />
              )}
              
              {/* Common Routes */}
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WalletProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </WalletProvider>
  );
};

export default App;
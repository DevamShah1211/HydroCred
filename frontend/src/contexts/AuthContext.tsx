import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { User } from '../types/user';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { account, isConnected, signMessage } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && user.isVerified;

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (isConnected && account) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isConnected, account]);

  // Auto-login when wallet connects
  useEffect(() => {
    if (isConnected && account && !user) {
      login();
    }
  }, [isConnected, account, user]);

  // Login with wallet signature
  const login = async () => {
    if (!account || !signMessage) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);

      // Get nonce from backend
      const nonceResponse = await api.post('/auth/nonce', { walletAddress: account });
      const { nonce, message } = nonceResponse.data;

      // Sign the message
      const signature = await signMessage(message);

      // Verify signature with backend
      const verifyResponse = await api.post('/auth/verify', {
        signature,
        message,
        walletAddress: account,
      });

      if (verifyResponse.data.success) {
        setUser(verifyResponse.data.user);
        
        // Set auth headers for future requests
        api.defaults.headers.common['signature'] = signature;
        api.defaults.headers.common['message'] = message;
        api.defaults.headers.common['walletAddress'] = account;
        
        toast.success('Login successful!');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      
      if (error.response?.status === 404) {
        // User not found, redirect to onboarding
        toast.error('Account not found. Please complete onboarding first.');
        // You could redirect to onboarding here
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    
    // Clear auth headers
    delete api.defaults.headers.common['signature'];
    delete api.defaults.headers.common['message'];
    delete api.defaults.headers.common['walletAddress'];
    
    toast.success('Logged out successfully');
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!account) return;

    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might be logged out
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
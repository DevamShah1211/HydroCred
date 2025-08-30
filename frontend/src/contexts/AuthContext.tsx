import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (walletAddress: string, signature: string, message: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!apiClient.getToken();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user:', error);
          apiClient.clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (walletAddress: string, signature: string, message: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login({
        walletAddress,
        signature,
        message,
      });
      
      setUser(response.user);
      toast.success(response.message || 'Login successful!');
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(userData);
      
      setUser(response.user);
      
      if (response.requiresVerification) {
        toast.success('Registration successful! Your account is pending verification.');
      } else {
        toast.success(response.message || 'Registration successful!');
      }
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      apiClient.clearToken();
      setIsLoading(false);
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getMe();
      setUser(response.user);
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await apiClient.updateProfile(data);
      setUser(response.user);
      toast.success(response.message || 'Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
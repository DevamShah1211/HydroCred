import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5055/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
api.interceptors.request.use(
  (config) => {
    // Add auth headers if they exist
    const signature = localStorage.getItem('signature');
    const message = localStorage.getItem('message');
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (signature && message && walletAddress) {
      config.headers.signature = signature;
      config.headers.message = message;
      config.headers.walletAddress = walletAddress;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, clear auth data
      localStorage.removeItem('signature');
      localStorage.removeItem('message');
      localStorage.removeItem('walletAddress');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // Get nonce for wallet authentication
  getNonce: (walletAddress: string) =>
    api.post('/auth/nonce', { walletAddress }),
  
  // Verify wallet signature
  verify: (data: { signature: string; message: string; walletAddress: string }) =>
    api.post('/auth/verify', data),
  
  // Create new account
  onboard: (data: {
    walletAddress: string;
    username: string;
    email?: string;
    role: string;
    country?: string;
    state?: string;
    city?: string;
    organization?: string;
  }) => api.post('/auth/onboard', data),
  
  // Get user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update user profile
  updateProfile: (data: { username?: string; email?: string; organization?: string }) =>
    api.put('/auth/profile', data),
};

export const adminAPI = {
  // Get admin dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Get users
  getUsers: (params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/users', { params }),
  
  // Verify user
  verifyUser: (userId: string) => api.post('/admin/verify-user', { userId }),
  
  // Revoke verification
  revokeVerification: (userId: string) => api.post('/admin/revoke-verification', { userId }),
  
  // Change user role
  changeRole: (userId: string, newRole: string) =>
    api.post('/admin/change-role', { userId, newRole }),
  
  // Get production requests
  getProductionRequests: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/production-requests', { params }),
  
  // Certify production
  certifyProduction: (requestId: string) =>
    api.post('/admin/certify-production', { requestId }),
  
  // Reject production
  rejectProduction: (requestId: string, reason: string) =>
    api.post('/admin/reject-production', { requestId, reason }),
};

export const producerAPI = {
  // Get producer dashboard
  getDashboard: () => api.get('/producer/dashboard'),
  
  // Submit production request
  submitRequest: (data: {
    amount: number;
    proofHash: string;
    proofDocuments?: string[];
  }) => api.post('/producer/submit-request', data),
  
  // Get production requests
  getRequests: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/producer/requests', { params }),
  
  // Get specific request
  getRequest: (id: string) => api.get(`/producer/requests/${id}`),
  
  // Update request
  updateRequest: (id: string, data: {
    amount?: number;
    proofHash?: string;
    proofDocuments?: string[];
  }) => api.put(`/producer/requests/${id}`, data),
  
  // Cancel request
  cancelRequest: (id: string) => api.delete(`/producer/requests/${id}`),
  
  // Get certified requests
  getCertifiedRequests: () => api.get('/producer/certified-requests'),
  
  // Mark tokens as minted
  markTokensMinted: (requestId: string, blockchainTxHash: string) =>
    api.post('/producer/mint-tokens', { requestId, blockchainTxHash }),
};

export const buyerAPI = {
  // Get buyer dashboard
  getDashboard: () => api.get('/buyer/dashboard'),
};

export const auditorAPI = {
  // Get auditor dashboard
  getDashboard: () => api.get('/audit/dashboard'),
  
  // Export audit data
  exportData: (params?: {
    format?: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
    type?: 'production' | 'users' | 'full';
  }) => api.get('/audit/export', { params }),
  
  // Get production requests for audit
  getProductionRequests: (params?: {
    status?: string;
    producer?: string;
    certifier?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit/production-requests', { params }),
  
  // Get users for audit
  getUsers: (params?: {
    role?: string;
    status?: string;
    country?: string;
    state?: string;
    city?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit/users', { params }),
};

export const marketplaceAPI = {
  // Get available credits
  getCredits: () => api.get('/marketplace/credits'),
  
  // Get credit sales
  getSales: () => api.get('/marketplace/sales'),
};

// Utility function to handle API errors
export const handleAPIError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Utility function to format API responses
export const formatAPIResponse = <T>(response: any): T => {
  return response.data;
};
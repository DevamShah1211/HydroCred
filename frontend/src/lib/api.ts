import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Initialize token from localStorage
    this.token = localStorage.getItem('hydrocred_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('hydrocred_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('hydrocred_token');
  }

  getToken(): string | null {
    return this.token;
  }

  // Generic request method
  private async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  // Auth endpoints
  async getNonce(walletAddress: string): Promise<{ nonce: string; timestamp: string; message: string }> {
    return this.request('GET', `/auth/nonce/${walletAddress}`);
  }

  async login(data: {
    walletAddress: string;
    signature: string;
    message: string;
  }): Promise<{ token: string; user: any; message: string }> {
    const response = await this.request('POST', '/auth/login', data);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(data: any): Promise<{ token: string; user: any; message: string }> {
    const response = await this.request('POST', '/auth/register', data);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getMe(): Promise<{ user: any }> {
    return this.request('GET', '/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request('POST', '/auth/logout');
    this.clearToken();
    return response;
  }

  async refreshToken(): Promise<{ token: string; message: string }> {
    const response = await this.request('POST', '/auth/refresh');
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  // User endpoints
  async getProfile(): Promise<{ user: any }> {
    return this.request('GET', '/users/profile');
  }

  async updateProfile(data: any): Promise<{ user: any; message: string }> {
    return this.request('PUT', '/users/profile', data);
  }

  async searchUsers(params: {
    role?: string;
    country?: string;
    state?: string;
    city?: string;
    verified?: boolean;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/users/search', undefined, { params });
  }

  async getUser(userId: string): Promise<{ user: any }> {
    return this.request('GET', `/users/${userId}`);
  }

  async verifyUser(userId: string): Promise<{ user: any; message: string }> {
    return this.request('POST', `/users/${userId}/verify`);
  }

  async suspendUser(userId: string, data: { reason: string; duration: number }): Promise<{ message: string }> {
    return this.request('POST', `/users/${userId}/suspend`, data);
  }

  async unsuspendUser(userId: string): Promise<{ user: any; message: string }> {
    return this.request('POST', `/users/${userId}/unsuspend`);
  }

  async getPendingVerifications(params?: { limit?: number; page?: number }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/users/pending-verification', undefined, { params });
  }

  // Production endpoints
  async submitProductionRequest(data: FormData): Promise<{
    requestId: string;
    transactionHash: string;
    amount: number;
    status: string;
    message: string;
  }> {
    return this.request('POST', '/production/request', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getProductionRequests(params?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/production/requests', undefined, { params });
  }

  async certifyProduction(requestId: string, signatureData: {
    message: string;
    signature: string;
  }): Promise<{
    requestId: string;
    certificationHash: string;
    certifier: string;
    amount: number;
    message: string;
  }> {
    return this.request('POST', `/production/certify/${requestId}`, signatureData);
  }

  async mintCredits(requestId: string): Promise<{
    requestId: string;
    mintingHash: string;
    amount: number;
    recipient: string;
    message: string;
  }> {
    return this.request('POST', `/production/mint/${requestId}`);
  }

  async getProductionStats(params?: { period?: string }): Promise<any> {
    return this.request('GET', '/production/stats', undefined, { params });
  }

  // Marketplace endpoints
  async createMarketListing(data: {
    amount: number;
    pricePerToken: number;
  }): Promise<{
    listingId: number;
    transactionHash: string;
    amount: number;
    pricePerToken: string;
    totalValue: string;
    status: string;
    message: string;
  }> {
    return this.request('POST', '/marketplace/list', data);
  }

  async getMarketListings(params?: {
    active?: boolean;
    seller?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/marketplace/listings', undefined, { params });
  }

  async purchaseCredits(data: {
    listingId: number;
    amount: number;
  }): Promise<{
    transactionHash: string;
    listingId: number;
    amount: number;
    pricePerToken: string;
    totalCost: string;
    seller: string;
    message: string;
  }> {
    return this.request('POST', '/marketplace/purchase', data);
  }

  async retireCredits(data: {
    amount: number;
    reason: string;
  }): Promise<{
    transactionHash: string;
    amount: number;
    reason: string;
    retirementDate: string;
    message: string;
  }> {
    return this.request('POST', '/marketplace/retire', data);
  }

  async getMarketplaceStats(params?: { period?: string }): Promise<any> {
    return this.request('GET', '/marketplace/stats', undefined, { params });
  }

  // Transaction endpoints
  async getTransactions(params?: {
    type?: string;
    status?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/transactions', undefined, { params });
  }

  async getTransaction(txHash: string): Promise<{ transaction: any }> {
    return this.request('GET', `/transactions/${txHash}`);
  }

  // Audit endpoints
  async getAuditLogs(params?: {
    action?: string;
    actor?: string;
    riskLevel?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/audit/logs', undefined, { params });
  }

  async exportAuditLogs(params: {
    format?: 'json' | 'csv';
    dateFrom?: string;
    dateTo?: string;
    action?: string;
    walletAddress?: string;
    limit?: number;
  }): Promise<Blob> {
    const response = await this.client.get('/audit/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async getComplianceReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    action?: string;
    riskLevel?: string;
  }): Promise<any> {
    return this.request('GET', '/audit/compliance-report', undefined, { params });
  }

  async reviewAuditLog(logId: string, notes: string): Promise<{ message: string }> {
    return this.request('POST', `/audit/review/${logId}`, { notes });
  }

  // Admin endpoints
  async getAdminDashboard(params?: { period?: string }): Promise<any> {
    return this.request('GET', '/admin/dashboard', undefined, { params });
  }

  async grantRole(data: {
    userAddress: string;
    role: string;
  }): Promise<{
    transactionHash: string;
    user: {
      address: string;
      name: string;
      previousRole: string;
      newRole: string;
    };
    message: string;
  }> {
    return this.request('POST', '/admin/grant-role', data);
  }

  async getFraudAlerts(params?: { limit?: number; page?: number }): Promise<any> {
    return this.request('GET', '/admin/fraud-alerts', undefined, { params });
  }

  async getSystemHealth(): Promise<any> {
    return this.request('GET', '/admin/system-health');
  }

  // File upload helper
  createFormData(data: any, files?: { [key: string]: File[] }): FormData {
    const formData = new FormData();

    // Add regular fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Add files
    if (files) {
      Object.keys(files).forEach(key => {
        files[key].forEach(file => {
          formData.append(key, file);
        });
      });
    }

    return formData;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
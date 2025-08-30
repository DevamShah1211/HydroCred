export type UserRole = 
  | 'COUNTRY_ADMIN'
  | 'STATE_ADMIN'
  | 'CITY_ADMIN'
  | 'PRODUCER'
  | 'BUYER'
  | 'AUDITOR';

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  email?: string;
  role: UserRole;
  country?: string;
  state?: string;
  city?: string;
  organization?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface ProductionRequest {
  id: string;
  requestId: number;
  producer: string;
  producerWallet: string;
  amount: number;
  proofHash: string;
  proofDocuments?: string[];
  status: 'PENDING' | 'CERTIFIED' | 'REJECTED' | 'TOKENS_MINTED';
  certifiedBy?: string;
  certifiedByWallet?: string;
  certifiedAt?: Date;
  rejectionReason?: string;
  tokensMinted: boolean;
  mintedAt?: Date;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditSale {
  saleId: number;
  seller: string;
  amount: number;
  price: number;
  active: boolean;
  timestamp: Date;
}

export interface Transaction {
  txHash: string;
  type: 'MINT' | 'TRANSFER' | 'SALE' | 'RETIRE';
  from: string;
  to?: string;
  amount: number;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  confirmedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'USER' | 'PRODUCTION_REQUEST' | 'TRANSACTION' | 'SYSTEM';
  entityId?: string;
  userId?: string;
  userWallet?: string;
  userRole?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalUsers?: number;
  pendingVerifications?: number;
  totalProducers?: number;
  totalBuyers?: number;
  totalRequests?: number;
  pendingRequests?: number;
  certifiedRequests?: number;
  mintedRequests?: number;
  rejectedRequests?: number;
  totalProduction?: number;
}

export interface Location {
  country?: string;
  state?: string;
  city?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}
// User types
export interface User {
  _id: string;
  walletAddress: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  state?: string;
  city?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verificationDate?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  productionCapacity?: number;
  industryType?: string;
  annualHydrogenNeed?: number;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'country_admin' 
  | 'state_admin' 
  | 'city_admin' 
  | 'producer' 
  | 'buyer' 
  | 'auditor';

export type OrganizationType = 
  | 'government' 
  | 'private' 
  | 'ngo' 
  | 'research' 
  | 'other';

// Transaction types
export interface Transaction {
  _id: string;
  txHash: string;
  blockNumber: number;
  blockHash: string;
  type: TransactionType;
  from: string;
  to?: string;
  amount?: number;
  value: string;
  pricePerToken?: string;
  gasUsed: number;
  gasPrice: string;
  gasFee: string;
  status: TransactionStatus;
  confirmations: number;
  productionRequestId?: string;
  marketListingId?: number;
  productionData?: ProductionData;
  proofDocuments?: ProofDocument[];
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'production_request'
  | 'production_certification'
  | 'credit_minting'
  | 'market_listing'
  | 'market_purchase'
  | 'credit_retirement'
  | 'role_assignment';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface ProductionData {
  facilityId: string;
  productionMethod: ProductionMethod;
  energySource: EnergySource;
  productionDate: string;
  qualityMetrics?: {
    purity?: number;
    pressure?: number;
    temperature?: number;
  };
  certificationStandard?: CertificationStandard;
}

export type ProductionMethod = 
  | 'electrolysis' 
  | 'steam_reforming' 
  | 'biomass_gasification' 
  | 'other';

export type EnergySource = 
  | 'solar' 
  | 'wind' 
  | 'hydro' 
  | 'geothermal' 
  | 'nuclear' 
  | 'grid_renewable' 
  | 'other';

export type CertificationStandard = 
  | 'CertifHy' 
  | 'ISCC' 
  | 'TUV_SUD' 
  | 'other';

export interface ProofDocument {
  filename: string;
  hash: string;
  uploadDate: string;
  size: number;
  path?: string;
}

export interface TransactionMetadata {
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  [key: string]: any;
}

// Production Request types
export interface ProductionRequest {
  requestId: string;
  producer: string;
  amount: number;
  productionData: ProductionData;
  proofHash: string;
  certifier?: string;
  certified: boolean;
  minted: boolean;
  timestamp: number;
  transactionHash: string;
  status: 'pending_certification' | 'certified' | 'minted' | 'rejected';
}

// Marketplace types
export interface MarketListing {
  listingId: number;
  seller: string;
  amount: number;
  pricePerToken: string;
  totalValue: string;
  active: boolean;
  timestamp: number;
  transactionHash: string;
  sellerInfo?: {
    name: string;
    organizationName?: string;
  };
}

// Audit Log types
export interface AuditLog {
  _id: string;
  action: AuditAction;
  actor: {
    walletAddress: string;
    userId?: string;
    role: UserRole;
    name?: string;
  };
  target?: {
    walletAddress: string;
    userId?: string;
    role?: UserRole;
    name?: string;
  };
  details: {
    description: string;
    previousState?: any;
    newState?: any;
    metadata?: any;
  };
  security: {
    riskLevel: RiskLevel;
    flags?: string[];
    requiresReview?: boolean;
  };
  result: {
    status: 'success' | 'failure' | 'pending';
    errorCode?: string;
    errorMessage?: string;
    responseTime?: number;
  };
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  blockchain?: {
    transactionHash?: string;
    blockNumber?: number;
    contractAddress?: string;
  };
  createdAt: string;
}

export type AuditAction = 
  | 'user_registration'
  | 'user_verification'
  | 'role_change'
  | 'production_request'
  | 'production_certification'
  | 'credit_minting'
  | 'market_listing_created'
  | 'market_purchase'
  | 'credit_retirement'
  | 'admin_action'
  | 'system_event'
  | 'security_event'
  | 'data_export';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  users?: {
    total: number;
    verified: number;
    active: number;
    pendingVerifications: number;
    breakdown: Array<{
      _id: UserRole;
      count: number;
      verified: number;
      active: number;
    }>;
  };
  transactions?: {
    total: number;
    totalAmount: number;
    avgSuccessRate: number;
    breakdown: Array<{
      _id: TransactionType;
      count: number;
      totalAmount?: number;
      avgAmount?: number;
      successRate?: number;
    }>;
  };
  production?: {
    requests: {
      total: number;
      totalAmount: number;
      avgAmount: number;
    };
    certifications: {
      total: number;
      totalAmount: number;
      avgAmount: number;
    };
    minted: {
      total: number;
      totalAmount: number;
      avgAmount: number;
    };
  };
  marketplace?: {
    listings: {
      total: number;
      totalAmount: number;
      avgAmount: number;
    };
    purchases: {
      total: number;
      totalAmount: number;
      totalValue: number;
      avgAmount: number;
    };
    retirements: {
      total: number;
      totalAmount: number;
      avgAmount: number;
    };
  };
  security?: {
    recentEvents: number;
    criticalEvents: number;
    highRiskEvents: number;
    events: Array<{
      id: string;
      action: AuditAction;
      actor: string;
      riskLevel: RiskLevel;
      timestamp: string;
      description: string;
    }>;
  };
}

// Wallet types
export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

// Form types
export interface LoginFormData {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface RegisterFormData {
  walletAddress: string;
  signature: string;
  message: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  state?: string;
  city?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  productionCapacity?: number;
  industryType?: string;
  annualHydrogenNeed?: number;
  phoneNumber?: string;
}

export interface ProductionRequestFormData {
  amount: number;
  productionData: {
    facilityId: string;
    productionMethod: ProductionMethod;
    energySource: EnergySource;
    productionDate: string;
    qualityMetrics?: {
      purity?: number;
      pressure?: number;
      temperature?: number;
    };
    certificationStandard?: CertificationStandard;
  };
  proofDocuments: File[];
}

export interface MarketListingFormData {
  amount: number;
  pricePerToken: number;
}

export interface CreditRetirementFormData {
  amount: number;
  reason: string;
}

// System Health types
export interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    blockchain: {
      connected: boolean;
      blockNumber?: number;
      chainId?: number;
      networkName?: string;
      error?: string;
    };
    database: {
      connected: boolean;
      collections?: {
        users: number;
        transactions: number;
        auditLogs: number;
      };
      error?: string;
    };
  };
  performance: {
    pendingTransactions: number;
    recentFailures: number;
    avgResponseTime: number;
    errorRate: 'low' | 'medium' | 'high';
  };
  alerts: {
    critical: boolean;
    warnings: boolean;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: UserRole[];
  children?: NavItem[];
}
/*
 * KAHADE TYPE DEFINITIONS
 */

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  status: 'ACTIVE' | 'SUSPENDED';
  reputationScore: number;
  totalTransactions: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export type TransactionStatus = 
  | 'PENDING_ACCEPT'
  | 'ACCEPTED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED';

export type TransactionCategory =
  | 'ELECTRONICS'
  | 'FASHION'
  | 'SERVICES'
  | 'DIGITAL'
  | 'AUTOMOTIVE'
  | 'PROPERTY'
  | 'OTHER';

export interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  status: TransactionStatus;
  category: TransactionCategory;
  buyerId: string;
  buyer: User;
  sellerId: string;
  seller: User;
  feePaidBy: 'buyer' | 'seller' | 'split';
  terms?: string;
  createdAt: string;
  acceptedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface TransactionTimeline {
  status: TransactionStatus;
  timestamp: string;
  description: string;
  actor?: string;
}

// Wallet Types
export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT';
export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  status: WalletTransactionStatus;
  reference?: string;
  createdAt: string;
}

export interface Bank {
  code: string;
  name: string;
}

// Dispute Types
export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Dispute {
  id: string;
  transactionId: string;
  transaction: Transaction;
  reason: string;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  evidence: string[];
  resolution?: string;
  winner?: 'buyer' | 'seller' | 'split';
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

// Notification Types
export type NotificationType = 'TRANSACTION' | 'PAYMENT' | 'INFO' | 'ALERT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Rating Types
export interface Rating {
  id: string;
  transactionId: string;
  raterId: string;
  rater: User;
  ratedId: string;
  rated: User;
  score: number;
  comment?: string;
  createdAt: string;
}

// Audit Log Types
export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTERED'
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_ACCEPTED'
  | 'TRANSACTION_PAID'
  | 'TRANSACTION_COMPLETED'
  | 'TRANSACTION_CANCELLED'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_PROCESSED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_RESOLVED'
  | 'PAYMENT_RECEIVED'
  | 'SETTINGS_UPDATED';

export type ActorType = 'USER' | 'ADMIN' | 'SYSTEM';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor: string;
  actorType: ActorType;
  target: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  activeTransactions: number;
  totalVolume: number;
  activeDisputes: number;
  userGrowth: number;
  transactionGrowth: number;
  volumeGrowth: number;
  disputeChange: number;
}

// Platform Settings Types
export interface PlatformSettings {
  platformFee: number;
  minTransaction: number;
  maxTransaction: number;
  escrowDuration: number;
  disputeWindow: number;
  autoReleaseDays: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
}

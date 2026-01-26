// ============================================================================
// PRISMA TYPES SHIM - Production Ready
// Re-export Prisma types directly to avoid conflicts
// ============================================================================

// Re-export all enums from Prisma
export {
  InitiatorRole,
  OrderCategory,
  Currency,
  FeePayer,
  OrderStatus,
  EscrowHoldStatus,
  DisputeStatus,
  DisputeDecision,
  KYCStatus,
  WithdrawalStatus,
  PaymentStatus,
  PaymentMethod,
  JournalType,
  PaymentProvider,
  PaymentType,
  LedgerAccountType,
} from '@prisma/client';

// Re-export all model types from Prisma
export type {
  User,
  Order,
  Wallet,
  Dispute,
  EscrowHold,
  Withdrawal,
  Notification,
  Payment,
  Session,
  BankAccount,
  LedgerJournal,
  LedgerEntry,
  LedgerAccount,
  Rating,
  KYCSubmission,
  DeliveryProof,
  DisputeEvidence,
  DisputeTimeline,
  OrderSettlement,
  AuditLog,
  UserActivity,
  ReferralCode,
  ReferralUsage,
  ReferralReward,
  Promo,
  Voucher,
  VoucherUsage,
  OrderComment,
  WebhookEvent,
  SystemConfig,
  ScheduledJob,
  TransactionLimit,
  Deposit,
  WithdrawalApproval,
} from '@prisma/client';

// ============================================================================
// ADDITIONAL ENUMS NOT IN PRISMA
// ============================================================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ORDER_CREATE = 'ORDER_CREATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  WALLET_TOPUP = 'WALLET_TOPUP',
  WALLET_WITHDRAW = 'WALLET_WITHDRAW',
}

export enum NotificationType {
  TRANSACTION = 'TRANSACTION',
  DISPUTE = 'DISPUTE',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  WALLET = 'WALLET',
  KYC = 'KYC',
}

export enum WalletTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_LOCK = 'ESCROW_LOCK',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  REFUND = 'REFUND',
  FEE = 'FEE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum BankAccountType {
  SAVINGS = 'SAVINGS',
  CHECKING = 'CHECKING',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum ReferralRewardType {
  CASHBACK = 'CASHBACK',
  COMMISSION = 'COMMISSION',
}

export enum ReferralRewardStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
}

export enum VoucherType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum PromoTargetType {
  USER = 'USER',
  ORDER = 'ORDER',
}

export enum ScheduledJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface IOrderResponse {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  category: string;
  currency: string;
  amount: number;
  status: string;
  initiatorId: string;
  counterpartyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionResponse {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  category: string;
  currency: string;
  amount: number;
  status: string;
  initiatorId: string;
  counterpartyId?: string;
  initiatorRole?: string;
  platformFee?: number;
  feePayer?: string;
  terms?: string;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  acceptedAt?: Date;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  initiator?: any;
  counterparty?: any;
  escrowHold?: any;
  deliveryProof?: any;
  dispute?: any;
  ratings?: any[];
}

export interface JournalWithEntries {
  id: string;
  createdAt: Date;
  description: string;
  currency?: string;
  amountMinor: bigint;
  type: string;
  orderId: string | null;
  disputeId: string | null;
  entries: Array<{
    id: string;
    accountId: string;
    amountMinor: bigint;
    debitMinor?: bigint;
    creditMinor?: bigint;
  }>;
}

// ============================================================================
// LEGACY TYPE ALIASES
// ============================================================================

import type { Order, EscrowHold as EscrowHoldPrisma, Wallet as WalletPrisma } from '@prisma/client';
export type Transaction = Order;
export type WalletTransaction = any;
export type KYCDocument = any;
export type Referral = any;
export type Activity = any;
export type WebhookLog = any;

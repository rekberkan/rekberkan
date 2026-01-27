/**
 * Prisma Types Shim
 * 
 * This file provides type definitions that mirror Prisma-generated types.
 * It allows the application to compile even when Prisma client hasn't been generated yet.
 * Once Prisma is properly set up, these types should be imported from @prisma/client.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum Currency {
  IDR = 'IDR',
  USD = 'USD',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum OrderStatus {
  WAITING_COUNTERPARTY = 'WAITING_COUNTERPARTY',
  PENDING_ACCEPT = 'PENDING_ACCEPT',
  ACCEPTED = 'ACCEPTED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum InitiatorRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
}

export enum OrderCategory {
  ELECTRONICS = 'ELECTRONICS',
  SERVICES = 'SERVICES',
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
  OTHER = 'OTHER',
}

export enum FeePayer {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  SPLIT = 'SPLIT',
  FIFTY_FIFTY = 'FIFTY_FIFTY',
}

export enum EscrowStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  E_WALLET = 'E_WALLET',
  QRIS = 'QRIS',
  CREDIT_CARD = 'CREDIT_CARD',
  RETAIL_OUTLET = 'RETAIL_OUTLET',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_BUYER = 'RESOLVED_BUYER',
  RESOLVED_SELLER = 'RESOLVED_SELLER',
  RESOLVED_SPLIT = 'RESOLVED_SPLIT',
  CLOSED = 'CLOSED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_LOCK = 'ESCROW_LOCK',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  PROMO_CREDIT = 'PROMO_CREDIT',
}

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum NotificationType {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  ESCROW = 'ESCROW',
  DISPUTE = 'DISPUTE',
  SYSTEM = 'SYSTEM',
  PROMO = 'PROMO',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: UserStatus;
  role: UserRole;
  kycStatus: KycStatus;
  mfaEnabled: boolean;
  mfaSecret?: string | null;
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  reputationScore: number;
  totalTransactions: number;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  initiatorId: string;
  counterpartyId?: string | null;
  initiatorRole: InitiatorRole;
  title: string;
  description: string;
  category: OrderCategory;
  currency: Currency;
  amountMinor: bigint;
  feePayer: FeePayer;
  platformFeeMinor: bigint;
  holdingPeriodDays: number;
  customTerms?: string | null;
  status: OrderStatus;
  inviteToken: string;
  inviteExpiresAt: Date;
  acceptedAt?: Date | null;
  paidAt?: Date | null;
  autoReleaseAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  deletedByUserId?: string | null;
  // Relations
  initiator?: User;
  counterparty?: User | null;
  escrowHold?: EscrowHold | null;
  dispute?: Dispute | null;
  ratings?: Rating[];
  comments?: OrderComment[];
}

export interface EscrowHold {
  id: string;
  orderId: string;
  buyerUserId: string;
  sellerUserId?: string | null;
  amountMinor: bigint;
  currency: Currency;
  status: EscrowStatus;
  timeoutAt?: Date | null;
  extensionCount: number;
  releasedAt?: Date | null;
  refundedAt?: Date | null;
  disputedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  order?: Order;
  buyer?: User;
  seller?: User | null;
}

export interface Payment {
  id: string;
  reference: string;
  userId: string;
  amountMinor: bigint;
  feeMinor: bigint;
  totalMinor: bigint;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  externalId?: string | null;
  paymentUrl?: string | null;
  expiresAt?: Date | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  cancelledAt?: Date | null;
  expiredAt?: Date | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: User;
}

export interface Withdrawal {
  id: string;
  reference: string;
  userId: string;
  amountMinor: bigint;
  feeMinor: bigint;
  netAmountMinor: bigint;
  currency: Currency;
  bankAccountId: string;
  status: WithdrawalStatus;
  processedAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: User;
  bankAccount?: BankAccount;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Relations
  user?: User;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: Currency;
  balanceMinor: bigint;
  lockedMinor: bigint;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: User;
}

export interface Dispute {
  id: string;
  orderId: string;
  initiatorId: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string | null;
  resolvedAt?: Date | null;
  resolvedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  order?: Order;
  initiator?: User;
  resolvedBy?: User | null;
}

export interface Rating {
  id: string;
  orderId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  order?: Order;
  fromUser?: User;
  toUser?: User;
}

export interface OrderComment {
  id: string;
  orderId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  deletedByUserId?: string | null;
  // Relations
  order?: Order;
  user?: User;
  parent?: OrderComment | null;
  replies?: OrderComment[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountMinor: bigint;
  currency: Currency;
  referenceId?: string | null;
  referenceType?: string | null;
  description?: string | null;
  balanceBefore: bigint;
  balanceAfter: bigint;
  createdAt: Date;
  // Relations
  user?: User;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  entryType: LedgerEntryType;
  amountMinor: bigint;
  currency: Currency;
  referenceId?: string | null;
  referenceType?: string | null;
  description?: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  // Relations
  user?: User;
}

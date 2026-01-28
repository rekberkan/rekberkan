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
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// Alias for backward compatibility
export { KycStatus as KYCStatus };

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
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESPONDED = 'RESPONDED',
  ESCALATED = 'ESCALATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  UNDER_ARBITRATION = 'UNDER_ARBITRATION',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  DECIDED = 'DECIDED',
  APPEALED = 'APPEALED',
  RESOLVED = 'RESOLVED',
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

export enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
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
  username: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  passwordUpdatedAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  lastLoginAt?: Date | null;
  lastFailedLoginAt?: Date | null;
  failedLoginCount: number;
  lockedUntil?: Date | null;
  suspendedAt?: Date | null;
  suspendedUntil?: Date | null;
  suspendReason?: string | null;
  mfaEnabled: boolean;
  totpSecretEnc?: string | null;
  backupCodesHash?: any | null;
  emailVerifiedAt?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  kycStatus: KycStatus;
  reputationScore: number;
  totalTransactions: number;
  isAdmin: boolean;
  avatarUrl?: string | null;
  notificationSettings?: any | null;
  deletedAt?: Date | null;
  deletedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  buyerWalletId: string;
  sellerWalletId?: string | null;
  amountMinor: bigint;
  currency: Currency;
  status: EscrowHoldStatus;
  timeoutAt?: Date | null;
  timeoutJobId?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
  // Relations
  order?: Order;
  buyerWallet?: Wallet;
  sellerWallet?: Wallet | null;
}

export enum EscrowHoldStatus {
  ACTIVE = 'ACTIVE',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  ADJUSTED = 'ADJUSTED',
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
  walletId: string;
  userId: string;
  bankAccountId: string;
  currency: Currency;
  amountMinor: bigint;
  status: WithdrawalStatus;
  reviewedBy?: string | null;
  reviewStartedAt?: Date | null;
  reviewNotes?: string | null;
  adminNotes?: string | null;
  riskHoldUntil?: Date | null;
  requiresMultipleApprovals: boolean;
  approvalCount: number;
  requiredApprovals: number;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  providerDisbursementId?: string | null;
  providerResponse?: any | null;
  requestedAt: Date;
  processedAt?: Date | null;
  completedAt?: Date | null;
  idempotencyKey?: string | null;
  velocityScore?: number | null;
  isFlaggedBySystem: boolean;
  flagReason?: string | null;
  coolingPeriodEndsAt?: Date | null;
  canProcessAfter?: Date | null;
  // Relations
  user?: User;
  bankAccount?: BankAccount;
  wallet?: Wallet;
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
  lastReconciledAt?: Date | null;
  reconciliationHash?: string | null;
  version: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: User;
}

export interface Dispute {
  id: string;
  orderId: string;
  openedBy: string;
  reason: string;
  status: DisputeStatus;
  responseDeadline?: Date | null;
  escalatedAt?: Date | null;
  escalatedTo?: string | null;
  arbitratorId?: string | null;
  decision: DisputeDecision;
  sellerAmountMinor?: bigint | null;
  buyerRefundMinor?: bigint | null;
  adminNotes?: string | null;
  resolutionNotes?: string | null;
  canAppeal: boolean;
  appealDeadline?: Date | null;
  appealCount: number;
  openedAt: Date;
  decidedAt?: Date | null;
  // Relations
  order?: Order;
  opener?: User;
  arbitrator?: User | null;
}

export enum DisputeDecision {
  NONE = 'NONE',
  BUYER_WINS = 'BUYER_WINS',
  SELLER_WINS = 'SELLER_WINS',
  SPLIT = 'SPLIT',
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

// Transaction is an alias for Order in this codebase (transaction.repository uses prisma.order)
export interface Transaction {
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
  type: string;
  title: string;
  message: string;
  metadata?: any | null;
  readAt?: Date | null;
  createdAt: Date;
  // Relations
  user?: User;
}

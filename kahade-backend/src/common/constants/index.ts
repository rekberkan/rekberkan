export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MODERATOR: 'MODERATOR',
} as const;

export const TRANSACTION_STATUS = {
  PENDING_ACCEPT: 'PENDING_ACCEPT',
  ACCEPTED: 'ACCEPTED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const DISPUTE_STATUS = {
  OPEN: 'OPEN',
  RESPONDED: 'RESPONDED',
  ESCALATED: 'ESCALATED',
  UNDER_ARBITRATION: 'UNDER_ARBITRATION',
  DECIDED: 'DECIDED',
  APPEALED: 'APPEALED',
  CLOSED: 'CLOSED',
} as const;

export const NOTIFICATION_TYPES = {
  TRANSACTION: 'TRANSACTION',
  DISPUTE: 'DISPUTE',
  PAYMENT: 'PAYMENT',
  WITHDRAWAL: 'WITHDRAWAL',
  KYC: 'KYC',
  SYSTEM: 'SYSTEM',
} as const;

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  PAYMENT: 'payment',
  WITHDRAWAL: 'withdrawal',
  ESCROW: 'escrow',
} as const;

export * from './queue.constants';
export * from './fees';
export * from './limits';
export * from './banks';

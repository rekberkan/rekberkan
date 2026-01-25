export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  WITHDRAWAL: 'withdrawal',
  ESCROW: 'escrow',
} as const;

export const QUEUE_JOBS = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome-email',
    SEND_VERIFICATION: 'send-verification-email',
    SEND_TRANSACTION_CREATED: 'send-transaction-created-email',
    SEND_PAYMENT_CONFIRMED: 'send-payment-confirmed-email',
    SEND_DISPUTE_CREATED: 'send-dispute-created-email',
    SEND_PASSWORD_RESET: 'send-password-reset-email',
    SEND_WITHDRAWAL_APPROVED: 'send-withdrawal-approved-email',
    SEND_WITHDRAWAL_REJECTED: 'send-withdrawal-rejected-email',
  },
  NOTIFICATION: {
    CREATE: 'create-notification',
    SEND_PUSH: 'send-push-notification',
    SEND_IN_APP: 'send-in-app-notification',
  },
  WITHDRAWAL: {
    PROCESS: 'process-withdrawal',
    DISBURSE: 'disburse-withdrawal',
  },
  ESCROW: {
    AUTO_RELEASE: 'auto-release-escrow',
    CHECK_TIMEOUT: 'check-escrow-timeout',
  },
} as const;

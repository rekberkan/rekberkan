/*
 * KAHADE API SERVICE
 * Centralized API client for backend communication
 *
 * SECURITY IMPROVEMENTS:
 * - Tokens are now managed via httpOnly cookies (set by backend)
 * - No sensitive data stored in localStorage
 * - CSRF protection via double-submit cookie pattern
 * - Automatic credential inclusion for cross-subdomain auth
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_URLS } from '@/config/app.config';
import { SecureStorage } from '@/lib/secure-storage';

// Base API URL - from centralized config
const API_BASE_URL = APP_URLS.api;

// Request timeout
const REQUEST_TIMEOUT = 30000;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // CRITICAL: Enable cookies for httpOnly token and CSRF
});

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Request interceptor to add security headers
api.interceptors.request.use(
  (config) => {
    // Add CSRF token from session storage
    const csrfToken = SecureStorage.getCsrfToken();
    if (csrfToken) {
      config.headers['x-xsrf-token'] = csrfToken;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    // Add idempotency key for POST/PUT/PATCH requests (financial operations)
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
      const isFinancialEndpoint =
        config.url?.includes('/wallet/') ||
        config.url?.includes('/transactions/') ||
        config.url?.includes('/withdraw') ||
        config.url?.includes('/topup');

      if (isFinancialEndpoint && !config.headers['X-Idempotency-Key']) {
        config.headers['X-Idempotency-Key'] = generateRequestId();
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling and CSRF token extraction
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract and store CSRF token from response header
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      SecureStorage.setCsrfToken(csrfToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Try to refresh token if not already retrying
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh - cookies are sent automatically
          const refreshResponse = await authApi.refreshToken();

          // If refresh successful, retry original request
          if (refreshResponse.status === 200) {
            return api(originalRequest);
          }
        } catch {
          // Refresh failed, redirect to login
          redirectToLogin();
        }
      } else {
        // Already retried, redirect to login
        redirectToLogin();
      }
    }

    // Handle other errors silently (logging removed for security)
    return Promise.reject(error);
  },
);

// Helper function to redirect to login
function redirectToLogin(): void {
  // Clear any cached data
  SecureStorage.clearAll();
  sessionStorage.removeItem('kahade_user_cache');

  const loginUrl = `${APP_URLS.landing}/login`;
  if (
    !window.location.pathname.includes('/login') &&
    !window.location.pathname.includes('/register')
  ) {
    window.location.href = loginUrl;
  }
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string; mfaCode?: string }) =>
    api.post('/auth/login', data),

  register: (data: { email: string; password: string; username: string; phone?: string }) =>
    api.post('/auth/register', data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  resendVerification: () => api.post('/auth/resend-verification'),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  logoutAll: () => api.post('/auth/logout-all'),

  refreshToken: () => api.post('/auth/refresh'),

  // 2FA
  enable2FA: () => api.post('/auth/2fa/enable'),

  disable2FA: (data: { password: string; code: string }) => api.post('/auth/2fa/disable', data),

  verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),

  // Sessions
  getSessions: () => api.get('/auth/sessions'),

  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),

  revokeAllSessions: () => api.delete('/auth/sessions'),
};

// User API
export const userApi = {
  getProfile: () => api.get('/user/profile'),

  updateProfile: (data: { username?: string; phone?: string }) =>
    api.patch('/user/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/user/change-password', data),

  uploadAvatar: (data: FormData) =>
    api.post('/user/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadKYC: (data: FormData) =>
    api.post('/kyc/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getKYCStatus: () => api.get('/kyc/status'),

  getStats: () => api.get('/user/stats'),

  updateNotificationSettings: (data: {
    email?: boolean;
    push?: boolean;
    transaction?: boolean;
    marketing?: boolean;
  }) => api.patch('/user/notification-settings', data),

  getPublicProfile: (userId: string) => api.get(`/users/${userId}`),

  getRatings: (userId: string) => api.get(`/users/${userId}/ratings`),
};

// Transaction API
export const transactionApi = {
  list: (params?: { status?: string; role?: string; page?: number; limit?: number }) =>
    api.get('/transactions', { params }),

  get: (id: string) => api.get(`/transactions/${id}`),

  create: (data: {
    counterpartyEmail?: string;
    counterpartyId?: string;
    role: 'buyer' | 'seller';
    title: string;
    description: string;
    category: string;
    amount: number;
    feePaidBy: 'buyer' | 'seller' | 'split';
    terms?: string;
  }) => api.post('/transactions', data),

  accept: (id: string) => api.post(`/transactions/${id}/accept`),

  reject: (id: string, reason?: string) => api.post(`/transactions/${id}/reject`, { reason }),

  pay: (id: string) => api.post(`/transactions/${id}/pay`),

  confirmDelivery: (id: string, proofUrl?: string) =>
    api.post(`/transactions/${id}/deliver`, { proofUrl }),

  confirmReceipt: (id: string) => api.post(`/transactions/${id}/complete`),

  dispute: (id: string, data: { reason: string; description: string }) =>
    api.post(`/transactions/${id}/dispute`, data),

  cancel: (id: string, reason?: string) => api.post(`/transactions/${id}/cancel`, { reason }),

  getTimeline: (id: string) => api.get(`/transactions/${id}/timeline`),

  addMessage: (id: string, message: string) =>
    api.post(`/transactions/${id}/messages`, { message }),

  getMessages: (id: string) => api.get(`/transactions/${id}/messages`),
};

// Wallet API
export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),

  getDetailedBalance: () => api.get('/wallet/balance/detailed'),

  getTransactions: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/wallet/transactions', { params }),

  topUp: (data: { amount: number; method: string }) => api.post('/wallet/topup', data),

  withdraw: (data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) => api.post('/wallet/withdraw', data),

  getBanks: () => api.get('/wallet/banks'),

  getWithdrawals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/wallet/withdrawals', { params }),

  cancelWithdrawal: (id: string) => api.post(`/wallet/withdrawals/${id}/cancel`),
};

// Notification API
export const notificationApi = {
  list: (params?: { read?: boolean; page?: number; limit?: number }) =>
    api.get('/notifications', { params }),

  getUnreadCount: () => api.get('/notifications/unread/count'),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Bank Account API
export const bankApi = {
  list: () => api.get('/bank/accounts'),

  get: (id: string) => api.get(`/bank/accounts/${id}`),

  add: (data: { bankCode: string; accountNumber: string; accountName: string }) =>
    api.post('/bank/accounts', data),

  setDefault: (id: string) => api.patch(`/bank/accounts/${id}/default`),

  delete: (id: string) => api.delete(`/bank/accounts/${id}`),
};

// Dispute API
export const disputeApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/disputes', { params }),

  get: (id: string) => api.get(`/disputes/${id}`),

  create: (data: { orderId: string; reason: string; description: string }) =>
    api.post('/disputes', data),

  submitEvidence: (id: string, data: FormData) =>
    api.post(`/disputes/${id}/evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMessages: (id: string) => api.get(`/disputes/${id}/messages`),

  sendMessage: (id: string, message: string) =>
    api.post(`/disputes/${id}/messages`, { message }),

  accept: (id: string) => api.post(`/disputes/${id}/accept`),

  appeal: (id: string, data: { reason: string }) => api.post(`/disputes/${id}/appeal`, data),
};

// Rating API
export const ratingApi = {
  create: (data: { orderId: string; score: number; comment?: string }) =>
    api.post('/ratings', data),

  get: (orderId: string) => api.get(`/ratings/order/${orderId}`),

  getUserRatings: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/ratings/user/${userId}`, { params }),
};

// Voucher API
export const voucherApi = {
  // Validate voucher code before applying
  validate: (data: { code: string; amountMinor: number; category?: string }) =>
    api.post('/vouchers/validate', data),

  // Apply voucher to order
  apply: (data: {
    code: string;
    amountMinor: number;
    orderId?: string;
    idempotencyKey?: string;
  }) => api.post('/vouchers/apply', data),
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Users
  getUsers: (params?: { status?: string; kycStatus?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  getUser: (id: string) => api.get(`/admin/users/${id}`),

  suspendUser: (id: string, reason: string) => api.post(`/admin/users/${id}/suspend`, { reason }),

  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),

  approveKYC: (id: string) => api.post(`/admin/users/${id}/kyc/approve`),

  rejectKYC: (id: string, reason: string) => api.post(`/admin/users/${id}/kyc/reject`, { reason }),

  // Transactions
  getTransactions: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/transactions', { params }),

  getTransaction: (id: string) => api.get(`/admin/transactions/${id}`),

  forceCompleteTransaction: (id: string, reason: string) =>
    api.post(`/admin/transactions/${id}/force-complete`, { reason }),

  forceCancelTransaction: (id: string, reason: string) =>
    api.post(`/admin/transactions/${id}/force-cancel`, { reason }),

  // Disputes
  getDisputes: (params?: { status?: string; priority?: string; page?: number; limit?: number }) =>
    api.get('/admin/disputes', { params }),

  getDispute: (id: string) => api.get(`/admin/disputes/${id}`),

  startReview: (id: string) => api.post(`/admin/disputes/${id}/review`),

  assignArbitrator: (id: string, arbitratorId: string) =>
    api.post(`/admin/disputes/${id}/assign`, { arbitratorId }),

  resolveDispute: (
    id: string,
    data: {
      decision:
        | 'RELEASE_ALL_TO_SELLER'
        | 'REFUND_ALL_TO_BUYER'
        | 'SPLIT_SETTLEMENT'
        | 'CANCEL_VOID';
      resolutionNotes: string;
      buyerRefundMinor?: string;
      sellerAmountMinor?: string;
    },
  ) => api.post(`/admin/disputes/${id}/resolve`, data),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; actorType?: string; page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }),

  // Settings
  getSettings: () => api.get('/admin/settings'),

  updateSettings: (data: Record<string, unknown>) => api.patch('/admin/settings', data),

  // Withdrawals
  getPendingWithdrawals: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/withdrawals/pending', { params }),

  approveWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/approve`),

  rejectWithdrawal: (id: string, reason: string) =>
    api.post(`/admin/withdrawals/${id}/reject`, { reason }),

  // Reports
  getRevenueReport: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/reports/revenue', { params }),

  getTransactionReport: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/reports/transactions', { params }),

  getUserReport: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/reports/users', { params }),

  // Promos
  getPromos: (params?: { isActive?: boolean; page?: number; limit?: number }) =>
    api.get('/admin/promos', { params }),

  getPromo: (id: string) => api.get(`/admin/promos/${id}`),

  createPromo: (data: {
    code: string;
    name: string;
    description?: string;
    targetType: string;
    discountType: string;
    discountValue?: number;
    discountPercent?: number;
    maxDiscountMinor?: number;
    maxTotalUsages?: number;
    maxUsagePerUser?: number;
    minPurchaseMinor?: number;
    applicableCategories?: string[];
    validFrom: string;
    validUntil: string;
  }) => api.post('/admin/promos', data),

  updatePromo: (id: string, data: Record<string, unknown>) => api.patch(`/admin/promos/${id}`, data),

  deactivatePromo: (id: string) => api.delete(`/admin/promos/${id}`),

  assignPromoToUser: (promoId: string, userId: string) =>
    api.post(`/admin/promos/${promoId}/assign`, { userId }),

  // Vouchers
  getVouchers: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/vouchers', { params }),

  getVoucher: (id: string) => api.get(`/admin/vouchers/${id}`),

  createVoucher: (data: {
    promoId?: string;
    code: string;
    voucherType: string;
    discountMinor?: number;
    discountPercent?: number;
    maxDiscountMinor?: number;
    maxUsages?: number;
    minPurchaseMinor?: number;
    applicableCategories?: string[];
    validFrom: string;
    validUntil: string;
    assignedToUserId?: string;
  }) => api.post('/admin/vouchers', data),

  deactivateVoucher: (id: string) => api.delete(`/admin/vouchers/${id}`),
};

export default api;

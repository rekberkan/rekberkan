/*
 * KAHADE API SERVICE
 * Centralized API client for backend communication
 * SECURITY: Implements secure token handling, request validation, and error handling
 * MULTI-SUBDOMAIN: Supports cross-subdomain authentication via shared cookies
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_URLS } from '@/config/app.config';
import { SecureStorage } from '@/lib/secure-storage';

// Base API URL - from centralized config
const API_BASE_URL = APP_URLS.api;

// Request timeout
const REQUEST_TIMEOUT = 30000;

// Token storage keys
const TOKEN_KEY = 'kahade_token';
const USER_KEY = 'kahade_user';
const REFRESH_TOKEN_KEY = 'kahade_refresh_token';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // Enable cookies for CSRF and cross-subdomain auth
});

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Request interceptor to add auth token and security headers
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
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
      if (!originalRequest._retry && localStorage.getItem(TOKEN_KEY)) {
        originalRequest._retry = true;
        
        try {
          if (!localStorage.getItem(REFRESH_TOKEN_KEY)) {
            throw new Error('Refresh token missing');
          }
          const refreshResponse = await authApi.refreshToken();
          const newToken = refreshResponse.data.accessToken || refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;
          
          if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            if (newRefreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect
          clearAuth();
          redirectToLogin();
        }
      } else {
        clearAuth();
        redirectToLogin();
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please wait before trying again.');
    }

    // Handle 500 Internal Server Error
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Helper functions
function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin(): void {
  const loginUrl = `${APP_URLS.landing}/login`;
  if (!window.location.pathname.includes('/login') && 
      !window.location.pathname.includes('/register')) {
    window.location.href = loginUrl;
  }
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string; mfaCode?: string }) =>
    api.post('/auth/login', data),
  
  register: (data: { email: string; password: string; username: string; phone?: string }) =>
    api.post('/auth/register', data),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  
  resendVerification: () =>
    api.post('/auth/resend-verification'),
  
  me: () => api.get('/auth/me'),
  
  logout: () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },
  
  logoutAll: () => api.post('/auth/logout-all'),
  
  refreshToken: () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return Promise.reject(new Error('Refresh token missing'));
    }
    return api.post('/auth/refresh', { refreshToken });
  },
  
  // 2FA
  enable2FA: () => api.post('/auth/2fa/enable'),
  
  disable2FA: (data: { password: string; code: string }) => 
    api.post('/auth/2fa/disable', data),
  
  verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),
  
  // Sessions
  getSessions: () => api.get('/auth/sessions'),
  
  revokeSession: (sessionId: string) => 
    api.delete(`/auth/sessions/${sessionId}`),
  
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
  
  reject: (id: string, reason?: string) =>
    api.post(`/transactions/${id}/reject`, { reason }),
  
  pay: (id: string) => api.post(`/transactions/${id}/pay`),
  
  confirmDelivery: (id: string, proofUrl?: string) =>
    api.post(`/transactions/${id}/deliver`, { proofUrl }),
  
  confirmReceipt: (id: string) =>
    api.post(`/transactions/${id}/complete`),
  
  dispute: (id: string, data: { reason: string; description: string }) =>
    api.post(`/transactions/${id}/dispute`, data),
  
  cancel: (id: string, reason?: string) =>
    api.post(`/transactions/${id}/cancel`, { reason }),
  
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
  
  topUp: (data: { amount: number; method: string }) =>
    api.post('/wallet/topup', data),
  
  withdraw: (data: { amount: number; bankCode: string; accountNumber: string; accountName: string }) =>
    api.post('/wallet/withdraw', data),
  
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
  
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllRead: () => api.patch('/notifications/read-all'),
  
  delete: (id: string) => api.delete(`/notifications/${id}`),
  
  deleteAll: () => api.delete('/notifications'),
};

// Rating API
export const ratingApi = {
  create: (transactionId: string, data: { score: number; comment?: string }) =>
    api.post(`/transactions/${transactionId}/rating`, data),
  
  getUserRatings: (userId: string) => api.get(`/users/${userId}/ratings`),
};

// Dispute API
export const disputeApi = {
  getList: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/disputes', { params }),
  
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/disputes', { params }),
  
  get: (id: string) => api.get(`/disputes/${id}`),
  
  getDetail: (id: string) => api.get(`/disputes/${id}`),
  
  sendMessage: (id: string, data: { content: string }) =>
    api.post(`/disputes/${id}/messages`, { message: data.content }),
  
  respond: (id: string, response: string) =>
    api.post(`/disputes/${id}/respond`, { response }),
  
  // Fixed: Backend expects { type, fileUrl } not { fileUrls[], description }
  addEvidence: (id: string, data: { type: string; fileUrl: string; description?: string }) =>
    api.post(`/disputes/${id}/evidence`, data),
  
  // Batch add evidence (multiple files)
  addEvidenceBatch: async (id: string, files: { type: string; fileUrl: string; description?: string }[]) => {
    const results = [];
    for (const file of files) {
      const result = await api.post(`/disputes/${id}/evidence`, file);
      results.push(result);
    }
    return results;
  },
  
  addMessage: (id: string, message: string) =>
    api.post(`/disputes/${id}/messages`, { message }),
};

// Voucher API
export const voucherApi = {
  // Get available vouchers for current user
  getAvailable: () => api.get('/vouchers'),
  
  // Get user's voucher usage history
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/vouchers/history', { params }),
  
  // Validate voucher code before applying
  validate: (data: { code: string; amountMinor: number; category?: string }) =>
    api.post('/vouchers/validate', data),
  
  // Apply voucher to order
  apply: (data: { code: string; amountMinor: number; orderId?: string; idempotencyKey?: string }) =>
    api.post('/vouchers/apply', data),
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params?: { status?: string; kycStatus?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  suspendUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/suspend`, { reason }),
  
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  
  approveKYC: (id: string) => api.post(`/admin/users/${id}/kyc/approve`),
  
  rejectKYC: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/kyc/reject`, { reason }),
  
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
  
  resolveDispute: (id: string, data: { 
    decision: 'RELEASE_ALL_TO_SELLER' | 'REFUND_ALL_TO_BUYER' | 'SPLIT_SETTLEMENT' | 'CANCEL_VOID';
    resolutionNotes: string;
    buyerRefundMinor?: string;
    sellerAmountMinor?: string;
  }) => api.post(`/admin/disputes/${id}/resolve`, data),
  
  // Audit Logs
  getAuditLogs: (params?: { action?: string; actorType?: string; page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  
  updateSettings: (data: Record<string, any>) =>
    api.patch('/admin/settings', data),
  
  // Withdrawals
  getPendingWithdrawals: (params?: { page?: number; limit?: number }) => 
    api.get('/admin/withdrawals/pending', { params }),
  
  approveWithdrawal: (id: string) =>
    api.post(`/admin/withdrawals/${id}/approve`),
  
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
  
  updatePromo: (id: string, data: Record<string, any>) =>
    api.patch(`/admin/promos/${id}`, data),
  
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
  
  // KYC Management
  getKYCSubmissions: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/kyc', { params }),
};

// Bank Account API
export const bankApi = {
  getAccounts: () => api.get('/bank-accounts'),
  
  getSupportedBanks: () => api.get('/bank-accounts/banks'),
  
  addAccount: (data: { bankCode: string; accountNumber: string; accountHolderName: string }) =>
    api.post('/bank-accounts', data),
  
  setDefault: (id: string) => api.post(`/bank-accounts/${id}/default`),
  
  deleteAccount: (id: string) => api.delete(`/bank-accounts/${id}`),
  
  verifyAccount: (id: string) => api.post(`/bank-accounts/${id}/verify`),
};

// KYC API
export const kycApi = {
  getStatus: () => api.get('/kyc/status'),
  
  submit: (data: FormData) =>
    api.post('/kyc/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getDocuments: () => api.get('/kyc/documents'),
};

// Referral API
export const referralApi = {
  getStats: () => api.get('/referrals/stats'),
  
  getList: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/referrals', { params }),
  
  getCode: () => api.get('/referrals/code'),
  
  applyCode: (code: string) => api.post('/referrals/apply', { code }),
};

// Activity API
export const activityApi = {
  getList: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/activities', { params }),
  
  getRecent: (limit?: number) => api.get('/activities/recent', { params: { limit } }),
};

export default api;

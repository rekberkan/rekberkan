/*
 * KAHADE API SERVICE - SECURITY ENHANCED
 * 
 * SECURITY FIX [C-01]: Migrated from localStorage to HttpOnly cookies
 * - JWT tokens are now stored in HttpOnly cookies (set by backend)
 * - Frontend no longer handles or stores authentication tokens
 * - CSRF protection via double-submit cookie pattern
 * - XSS attacks cannot steal authentication tokens
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_URLS } from '@/config/app.config';
import { SecureStorage } from '@/lib/secure-storage';

// Base API URL - from centralized config
const API_BASE_URL = APP_URLS.api;

// Request timeout - reduced from 30s to 15s for better UX
const REQUEST_TIMEOUT = 15000;

// SECURITY FIX [C-01]: Removed token storage keys - tokens now in HttpOnly cookies
const USER_CACHE_KEY = 'rekberkan_user_cache';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // SECURITY FIX [C-01]: Enable cookies for HttpOnly token handling
});

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Request interceptor to add security headers
api.interceptors.request.use(
  (config) => {
    // SECURITY FIX [C-01]: Removed Authorization header handling
    // Tokens are now sent automatically via HttpOnly cookies

    // Add CSRF token for protection against CSRF attacks
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
    // SECURITY FIX [C-01]: Store CSRF token from response header
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
      // SECURITY FIX [C-01]: Try to refresh token via API call
      // Backend will handle token refresh via HttpOnly cookies
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the session
          await authApi.refreshToken();
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear cached data and redirect
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

// SECURITY FIX [C-01]: Clear only cached user data (tokens are in HttpOnly cookies)
function clearAuth(): void {
  sessionStorage.removeItem(USER_CACHE_KEY);
  SecureStorage.clearAll();
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
  
  validateResetToken: (token: string) =>
    api.get(`/auth/reset-password/validate?token=${token}`),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  
  resendVerification: () =>
    api.post('/auth/resend-verification'),
  
  me: () => api.get('/auth/me'),
  
  // SECURITY FIX [C-01]: Logout now handled via API call
  // Backend will clear HttpOnly cookies
  logout: () => api.post('/auth/logout'),
  
  logoutAll: () => api.post('/auth/logout-all'),
  
  // SECURITY FIX [C-01]: Token refresh handled via HttpOnly cookies
  refreshToken: () => api.post('/auth/refresh'),
  
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
  
  requestDataExport: () => api.post('/user/data-export'),
  
  deleteAccount: (password: string) => api.delete('/user/account', { data: { password } }),
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
    
  getDeposits: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/wallet/deposits', { params }),
};

// Bank Account API
export const bankAccountApi = {
  list: () => api.get('/bank-accounts'),
  
  create: (data: { bankCode: string; accountNumber: string; accountName: string }) =>
    api.post('/bank-accounts', data),
  
  delete: (id: string) => api.delete(`/bank-accounts/${id}`),
  
  setDefault: (id: string) => api.patch(`/bank-accounts/${id}/default`),
  
  verify: (id: string) => api.post(`/bank-accounts/${id}/verify`),
};

// Notification API
export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Dispute API
export const disputeApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/disputes', { params }),
  
  get: (id: string) => api.get(`/disputes/${id}`),
  
  create: (data: { orderId: string; reason: string; description: string; evidence?: string[] }) =>
    api.post('/disputes', data),
  
  addMessage: (id: string, message: string, attachments?: string[]) =>
    api.post(`/disputes/${id}/messages`, { message, attachments }),
  
  getMessages: (id: string) => api.get(`/disputes/${id}/messages`),
  
  uploadEvidence: (id: string, data: FormData) =>
    api.post(`/disputes/${id}/evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Rating API
export const ratingApi = {
  create: (data: { orderId: string; rating: number; comment?: string }) =>
    api.post('/ratings', data),
  
  getForOrder: (orderId: string) => api.get(`/ratings/order/${orderId}`),
  
  getForUser: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/ratings/user/${userId}`, { params }),
};

// Referral API
export const referralApi = {
  getCode: () => api.get('/referrals/code'),
  
  getStats: () => api.get('/referrals/stats'),
  
  getReferrals: (params?: { page?: number; limit?: number }) =>
    api.get('/referrals', { params }),
  
  claimReward: (referralId: string) => api.post(`/referrals/${referralId}/claim`),
};

// Activity API
export const activityApi = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/activity', { params }),
};

// Promo/Voucher API
export const promoApi = {
  validate: (code: string, orderAmount: number) =>
    api.post('/promo/validate', { code, orderAmount }),
  
  apply: (code: string, orderId: string) =>
    api.post('/promo/apply', { code, orderId }),
  
  getAvailable: () => api.get('/promo/available'),
};

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/users', { params }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  
  suspendUser: (id: string, reason: string, until?: string) =>
    api.post(`/admin/users/${id}/suspend`, { reason, until }),
  
  unsuspendUser: (id: string) => api.post(`/admin/users/${id}/unsuspend`),
  
  // Transactions
  getTransactions: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/transactions', { params }),
  
  getTransaction: (id: string) => api.get(`/admin/transactions/${id}`),
  
  // Disputes
  getDisputes: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/disputes', { params }),
  
  getDispute: (id: string) => api.get(`/admin/disputes/${id}`),
  
  resolveDispute: (id: string, data: { resolution: string; refundBuyer: boolean; refundAmount?: number }) =>
    api.post(`/admin/disputes/${id}/resolve`, data),
  
  // KYC
  getKYCRequests: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/kyc', { params }),
  
  getKYCRequest: (id: string) => api.get(`/admin/kyc/${id}`),
  
  approveKYC: (id: string) => api.post(`/admin/kyc/${id}/approve`),
  
  rejectKYC: (id: string, reason: string) => api.post(`/admin/kyc/${id}/reject`, { reason }),
  
  // Withdrawals
  getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/withdrawals', { params }),
  
  approveWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/approve`),
  
  rejectWithdrawal: (id: string, reason: string) =>
    api.post(`/admin/withdrawals/${id}/reject`, { reason }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  
  updateSettings: (data: any) => api.patch('/admin/settings', data),
  
  // Analytics
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/analytics', { params }),
  
  // Promos
  getPromos: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/promos', { params }),
  
  createPromo: (data: any) => api.post('/admin/promos', data),
  
  updatePromo: (id: string, data: any) => api.patch(`/admin/promos/${id}`, data),
  
  deletePromo: (id: string) => api.delete(`/admin/promos/${id}`),
};

export default api;

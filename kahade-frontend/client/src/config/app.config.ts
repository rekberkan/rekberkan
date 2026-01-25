/**
 * KAHADE APPLICATION CONFIGURATION
 * Centralized configuration for multi-subdomain deployment
 */

// Application modes
export type AppMode = 'landing' | 'app' | 'admin';

// Get current app mode from environment or detect from hostname
export function getAppMode(): AppMode {
  // First check environment variable
  const envMode = import.meta.env.VITE_APP_MODE as AppMode;
  if (envMode && ['landing', 'app', 'admin'].includes(envMode)) {
    return envMode;
  }

  // Auto-detect from hostname
  const hostname = window.location.hostname;
  
  if (hostname.startsWith('admin.')) {
    return 'admin';
  }
  if (hostname.startsWith('app.')) {
    return 'app';
  }
  
  // Default to landing for main domain or localhost
  return 'landing';
}

// Application URLs
export const APP_URLS = {
  landing: import.meta.env.VITE_LANDING_URL || 'http://localhost:5000',
  app: import.meta.env.VITE_APP_URL || 'http://localhost:5001',
  admin: import.meta.env.VITE_ADMIN_URL || 'http://localhost:5002',
  api: import.meta.env.VITE_API_URL || '/api/v1',
};

// Cookie configuration
export const COOKIE_CONFIG = {
  domain: import.meta.env.VITE_COOKIE_DOMAIN || 'localhost',
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
};

// Feature flags
export const FEATURES = {
  debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

// Route configuration per app mode
export const ROUTES_CONFIG = {
  landing: {
    home: '/',
    about: '/about',
    howItWorks: '/how-it-works',
    contact: '/contact',
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
  },
  app: {
    dashboard: '/',
    transactions: '/transactions',
    newTransaction: '/transactions/new',
    transactionDetail: '/transactions/:id',
    wallet: '/wallet',
    notifications: '/notifications',
    profile: '/profile',
    settings: '/settings',
  },
  admin: {
    dashboard: '/',
    users: '/users',
    transactions: '/transactions',
    disputes: '/disputes',
    auditLogs: '/audit-logs',
    settings: '/settings',
  },
};

// Navigation helper - redirect to correct subdomain
export function navigateToApp(path: string = '/'): void {
  window.location.href = `${APP_URLS.app}${path}`;
}

export function navigateToAdmin(path: string = '/'): void {
  window.location.href = `${APP_URLS.admin}${path}`;
}

export function navigateToLanding(path: string = '/'): void {
  window.location.href = `${APP_URLS.landing}${path}`;
}

// Check if current user has access to admin
export function canAccessAdmin(user: { role?: string; isAdmin?: boolean } | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.isAdmin === true;
}

export default {
  getAppMode,
  APP_URLS,
  COOKIE_CONFIG,
  FEATURES,
  ROUTES_CONFIG,
  navigateToApp,
  navigateToAdmin,
  navigateToLanding,
  canAccessAdmin,
};

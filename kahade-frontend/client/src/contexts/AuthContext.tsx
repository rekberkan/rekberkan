/**
 * REKBERKAN AUTH CONTEXT - SECURITY ENHANCED
 * 
 * SECURITY FIX [C-01]: Migrated from localStorage to HttpOnly cookies
 * - Tokens are now stored in HttpOnly cookies (set by backend)
 * - Frontend only stores non-sensitive user data for UI purposes
 * - CSRF protection via double-submit cookie pattern
 * - XSS attacks cannot steal authentication tokens
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { APP_URLS, getAppMode, navigateToApp, navigateToAdmin, canAccessAdmin } from '@/config/app.config';
import { SecureStorage } from '@/lib/secure-storage';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  isAdmin: boolean;
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  reputationScore: number;
  totalTransactions: number;
  emailVerifiedAt?: string;
  avatarUrl?: string;
  mfaEnabled?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SECURITY FIX [C-01]: Use sessionStorage for non-sensitive user data only
// Tokens are now handled via HttpOnly cookies
const USER_CACHE_KEY = 'rekberkan_user_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapUserData = (userData: any, defaultUsername?: string): User => {
    return {
      id: userData.id,
      username: userData.username || userData.name || defaultUsername || userData.email?.split('@')[0],
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'USER',
      isAdmin: userData.role === 'ADMIN' || userData.isAdmin === true,
      kycStatus: userData.kycStatus || 'NONE',
      reputationScore: userData.reputationScore || 0,
      totalTransactions: userData.totalTransactions || 0,
      emailVerifiedAt: userData.emailVerifiedAt,
      avatarUrl: userData.avatarUrl,
      mfaEnabled: userData.mfaEnabled || false,
      createdAt: userData.createdAt,
    };
  };

  const fetchCurrentUser = async () => {
    try {
      // SECURITY FIX [C-01]: API calls now use cookies automatically (withCredentials: true)
      const response = await authApi.me();
      const userData = response.data.user || response.data;
      const mappedUser = mapUserData(userData);
      setUser(mappedUser);
      // Cache user data in sessionStorage (non-sensitive, for UI only)
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      // SECURITY FIX [C-01]: Clear cached user data on auth failure
      sessionStorage.removeItem(USER_CACHE_KEY);
      SecureStorage.clearAll();
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // SECURITY FIX [C-01]: Check cached user data for faster initial render
      // Actual authentication is verified via HttpOnly cookie on API call
      const cachedUser = sessionStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          sessionStorage.removeItem(USER_CACHE_KEY);
        }
      }
      
      // SECURITY FIX [C-01]: Verify authentication via API call
      // The HttpOnly cookie will be sent automatically
      try {
        await fetchCurrentUser();
      } catch (error) {
        // User is not authenticated or session expired
        console.debug('Auth check: User not authenticated');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // SECURITY FIX [C-01]: Backend now sets tokens in HttpOnly cookies
      // Response only contains user data, not tokens
      const response = await authApi.login({ email, password });
      const { user: userData } = response.data;
      
      let mappedUser: User;
      if (userData) {
        mappedUser = mapUserData(userData, email.split('@')[0]);
        setUser(mappedUser);
        // Cache user data in sessionStorage (non-sensitive, for UI only)
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      } else {
        mappedUser = await fetchCurrentUser();
      }
      
      // Redirect based on app mode and user role
      const appMode = getAppMode();
      if (appMode === 'landing') {
        // After login on landing, redirect to appropriate app
        if (canAccessAdmin(mappedUser)) {
          navigateToAdmin();
        } else {
          navigateToApp();
        }
      }
      
      return mappedUser;
    } catch (error: any) {
      // SECURITY FIX [C-01]: Clear any cached data on login failure
      sessionStorage.removeItem(USER_CACHE_KEY);
      SecureStorage.clearAll();
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // SECURITY FIX [C-01]: Backend now sets tokens in HttpOnly cookies
      const response = await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        phone: data.phone,
      });
      
      const { user: userData } = response.data;
      
      if (userData) {
        const mappedUser = mapUserData(userData, data.username);
        mappedUser.phone = data.phone;
        setUser(mappedUser);
        // Cache user data in sessionStorage (non-sensitive, for UI only)
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(mappedUser));
      } else {
        await fetchCurrentUser();
      }
      
      // Redirect to app after registration
      const appMode = getAppMode();
      if (appMode === 'landing') {
        navigateToApp();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // SECURITY FIX [C-01]: Backend will clear HttpOnly cookies
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // SECURITY FIX [C-01]: Clear all cached data
      sessionStorage.removeItem(USER_CACHE_KEY);
      SecureStorage.clearAll();
      
      setUser(null);
      
      // Redirect to landing page after logout
      const appMode = getAppMode();
      if (appMode !== 'landing') {
        window.location.href = APP_URLS.landing;
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Cache updated user data in sessionStorage (non-sensitive, for UI only)
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

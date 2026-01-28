import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { APP_URLS, getAppMode, navigateToApp, navigateToAdmin, canAccessAdmin } from '@/config/app.config';
import { SecureStorage } from '@/lib/secure-storage';

/**
 * SECURITY IMPROVEMENT:
 * - User data is now stored in sessionStorage (cleared when browser closes)
 * - Tokens are managed via httpOnly cookies (set by backend)
 * - localStorage is no longer used for sensitive data
 * - CSRF token is stored in sessionStorage via SecureStorage
 */

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

// Storage keys - using sessionStorage for security
const USER_STORAGE_KEY = 'kahade_user_cache';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  /**
   * Store user data in sessionStorage (more secure than localStorage)
   * Session storage is cleared when browser/tab is closed
   */
  const storeUserData = (userData: User) => {
    try {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // Silently fail if storage is not available
    }
  };

  /**
   * Get cached user data from sessionStorage
   */
  const getCachedUser = (): User | null => {
    try {
      const cached = sessionStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  /**
   * Clear all user data from storage
   */
  const clearUserData = () => {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    SecureStorage.clearAll();
    
    // Also clear any legacy localStorage data (migration cleanup)
    try {
      localStorage.removeItem('kahade_token');
      localStorage.removeItem('kahade_user');
      localStorage.removeItem('kahade_refresh_token');
    } catch {
      // Ignore errors during cleanup
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.me();
      const userData = response.data.user || response.data;
      const mappedUser = mapUserData(userData);
      setUser(mappedUser);
      storeUserData(mappedUser);
      return mappedUser;
    } catch {
      clearUserData();
      setUser(null);
      throw new Error('Failed to fetch user data');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Check for cached user data for faster initial render
      const cachedUser = getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
      
      // Always verify with server (cookies are sent automatically)
      try {
        await fetchCurrentUser();
      } catch {
        // User is not authenticated or session expired
        clearUserData();
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    // Migrate from localStorage if needed (one-time cleanup)
    SecureStorage.migrateFromLocalStorage();
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user: userData } = response.data;
      
      // Note: Tokens are now set as httpOnly cookies by the backend
      // We only store non-sensitive user data in sessionStorage
      
      let mappedUser: User;
      if (userData) {
        mappedUser = mapUserData(userData, email.split('@')[0]);
        setUser(mappedUser);
        storeUserData(mappedUser);
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
      clearUserData();
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        phone: data.phone,
      });
      
      const { user: userData } = response.data;
      
      // Note: Tokens are now set as httpOnly cookies by the backend
      if (userData) {
        const mappedUser = mapUserData(userData, data.username);
        mappedUser.phone = data.phone;
        setUser(mappedUser);
        storeUserData(mappedUser);
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
      // Call logout API - this will clear httpOnly cookies on the server
      await authApi.logout();
    } catch {
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear all stored data
      clearUserData();
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
    storeUserData(updatedUser);
  };

  const refreshUser = async () => {
    try {
      await fetchCurrentUser();
    } catch {
      // Failed to refresh - user may need to re-login
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

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
      const response = await authApi.me();
      const userData = response.data.user || response.data;
      const mappedUser = mapUserData(userData);
      setUser(mappedUser);
      localStorage.setItem('rekberkan_user', JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      localStorage.removeItem('rekberkan_token');
      localStorage.removeItem('rekberkan_user');
      localStorage.removeItem('rekberkan_refresh_token');
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('rekberkan_token');
      
      // Also check for cached user data for faster initial render
      const cachedUser = localStorage.getItem('rekberkan_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          localStorage.removeItem('rekberkan_user');
        }
      }
      
      if (token) {
        try {
          await fetchCurrentUser();
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { accessToken, token, refreshToken, user: userData } = response.data;
      
      const authToken = accessToken || token;
      localStorage.setItem('rekberkan_token', authToken);
      if (refreshToken) {
        localStorage.setItem('rekberkan_refresh_token', refreshToken);
      }
      
      let mappedUser: User;
      if (userData) {
        mappedUser = mapUserData(userData, email.split('@')[0]);
        setUser(mappedUser);
        localStorage.setItem('rekberkan_user', JSON.stringify(mappedUser));
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
      localStorage.removeItem('rekberkan_token');
      localStorage.removeItem('rekberkan_user');
      localStorage.removeItem('rekberkan_refresh_token');
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
      
      const { accessToken, token, refreshToken, user: userData } = response.data;
      
      if (accessToken || token) {
        localStorage.setItem('rekberkan_token', accessToken || token);
        if (refreshToken) {
          localStorage.setItem('rekberkan_refresh_token', refreshToken);
        }
        
        if (userData) {
          const mappedUser = mapUserData(userData, data.username);
          mappedUser.phone = data.phone;
          setUser(mappedUser);
          localStorage.setItem('rekberkan_user', JSON.stringify(mappedUser));
        } else {
          await fetchCurrentUser();
        }
        
        // Redirect to app after registration
        const appMode = getAppMode();
        if (appMode === 'landing') {
          navigateToApp();
        }
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all stored tokens and data
      localStorage.removeItem('rekberkan_token');
      localStorage.removeItem('rekberkan_user');
      localStorage.removeItem('rekberkan_refresh_token');
      
      // Clear CSRF token from session storage
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
    localStorage.setItem('rekberkan_user', JSON.stringify(updatedUser));
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

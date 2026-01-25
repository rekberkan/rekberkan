import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

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
      username: userData.username || defaultUsername || userData.email?.split('@')[0],
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'USER',
      isAdmin: userData.role === 'ADMIN' || userData.isAdmin,
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
      localStorage.setItem('kahade_user', JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      localStorage.removeItem('kahade_token');
      localStorage.removeItem('kahade_user');
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('kahade_token');
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
      const { accessToken, token, user: userData } = response.data;
      
      const authToken = accessToken || token;
      localStorage.setItem('kahade_token', authToken);
      
      let mappedUser: User;
      if (userData) {
        mappedUser = mapUserData(userData, email.split('@')[0]);
        setUser(mappedUser);
        localStorage.setItem('kahade_user', JSON.stringify(mappedUser));
      } else {
        mappedUser = await fetchCurrentUser();
      }
      return mappedUser;
    } catch (error: any) {
      localStorage.removeItem('kahade_token');
      localStorage.removeItem('kahade_user');
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
      });
      
      const { accessToken, token, user: userData } = response.data;
      
      if (accessToken || token) {
        localStorage.setItem('kahade_token', accessToken || token);
        
        if (userData) {
          const mappedUser = mapUserData(userData, data.username);
          mappedUser.phone = data.phone;
          setUser(mappedUser);
          localStorage.setItem('kahade_user', JSON.stringify(mappedUser));
        } else {
          await fetchCurrentUser();
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
      localStorage.removeItem('kahade_token');
      localStorage.removeItem('kahade_user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('kahade_user', JSON.stringify(updatedUser));
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

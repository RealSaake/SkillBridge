import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  name?: string;
  profile?: UserProfile;
  skills?: UserSkill[];
  createdAt: string;
}

interface UserProfile {
  id: string;
  currentRole?: string;
  targetRole?: string;
  experienceLevel?: string;
  careerGoals: string[];
  bio?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
}

interface UserSkill {
  id: string;
  skillName: string;
  proficiencyLevel: number;
  lastAssessed: string;
  isVerified: boolean;
  source: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token management
  const getAccessToken = () => localStorage.getItem('accessToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');
  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };
  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // API call helper with automatic token refresh
  const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const accessToken = getAccessToken();
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    });

    // If token expired, try to refresh
    if (response.status === 401 && accessToken) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry the original request with new token
        const newAccessToken = getAccessToken();
        return fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newAccessToken && { Authorization: `Bearer ${newAccessToken}` }),
            ...options.headers,
          },
        });
      }
    }

    return response;
  };

  // Fetch current user
  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await apiCall('/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else if (response.status === 401) {
        // Token invalid, try refresh
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          // Retry fetching user
          const retryResponse = await apiCall('/auth/me');
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  // Login function
  const login = async (accessToken: string, refreshTokenValue: string): Promise<void> => {
    setTokens(accessToken, refreshTokenValue);
    
    const userData = await fetchUser();
    if (userData) {
      setUser(userData);
    } else {
      clearTokens();
      throw new Error('Failed to fetch user data');
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (refreshTokenValue) {
        await apiCall('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        return true;
      } else {
        clearTokens();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      setUser(null);
      return false;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();

      if (accessToken && refreshTokenValue) {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
        } else {
          clearTokens();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await refreshToken();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
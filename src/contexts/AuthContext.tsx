import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { userDataIsolation, type GitHubUserData } from '../utils/userDataIsolation';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  name?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  profile?: UserProfile;
  skills?: UserSkill[];
  createdAt: string;
  githubCreatedAt?: string;
  githubUpdatedAt?: string;
}

interface UserProfile {
  id: string;
  currentRole?: string;
  targetRole?: string;
  experienceLevel?: string;
  careerGoals: string[];
  primaryGoals?: string[];
  techStack?: string[];
  learningStyle?: string;
  timeCommitment?: string;
  completedOnboarding?: boolean;
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';

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

  // Fetch current user with secure data isolation
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();
      
      if (!accessToken || !refreshTokenValue) {
        return null;
      }

      // Initialize secure session
      const sessionInitialized = userDataIsolation.initializeSession(accessToken, refreshTokenValue);
      if (!sessionInitialized) {
        console.warn('Failed to initialize secure session');
        clearTokens();
        return null;
      }

      // Validate session integrity
      if (!userDataIsolation.validateSessionIntegrity()) {
        console.warn('Session integrity check failed');
        clearTokens();
        return null;
      }

      // Fetch user profile through secure isolation layer
      const githubUserData = await userDataIsolation.fetchUserProfile();
      
      if (!githubUserData) {
        console.warn('No GitHub user data returned');
        clearTokens();
        return null;
      }
      
      // Convert GitHub data to our User format
      const userData: User = {
        id: githubUserData.id.toString(),
        username: githubUserData.login,
        email: githubUserData.email || `${githubUserData.login}@github.local`,
        name: githubUserData.name || githubUserData.login,
        avatarUrl: githubUserData.avatar_url,
        bio: githubUserData.bio || undefined,
        location: githubUserData.location || undefined,
        company: githubUserData.company || undefined,
        blog: githubUserData.blog || undefined,
        publicRepos: githubUserData.public_repos,
        followers: githubUserData.followers,
        following: githubUserData.following,
        profile: undefined, // Will be loaded separately
        skills: [],
        createdAt: githubUserData.created_at,
        githubCreatedAt: githubUserData.created_at,
        githubUpdatedAt: githubUserData.updated_at
      };

      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
      
      // Clear session on any error to prevent data contamination
      userDataIsolation.clearSession();
      clearTokens();
      
      return null;
    }
  }, []);

  // Login function with secure session initialization
  const login = async (accessToken: string, refreshTokenValue: string): Promise<void> => {
    try {
      // Validate token format before storing
      if (!accessToken || !refreshTokenValue) {
        throw new Error('Missing authentication tokens');
      }
      
      if (!accessToken.startsWith('github_') || !refreshTokenValue.startsWith('refresh_')) {
        throw new Error('Invalid token format');
      }

      setTokens(accessToken, refreshTokenValue);
      
      const userData = await fetchUser();
      if (userData) {
        setUser(userData);
        console.log('✅ User login successful:', userData.username);
      } else {
        clearTokens();
        userDataIsolation.clearSession();
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      clearTokens();
      userDataIsolation.clearSession();
      throw error;
    }
  };

  // Logout function with secure session cleanup
  const logout = async (): Promise<void> => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (refreshTokenValue) {
        await apiCall('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all session data securely
      userDataIsolation.clearSession();
      clearTokens();
      setUser(null);
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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
  }, []);

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
  }, [fetchUser]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await refreshToken();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

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
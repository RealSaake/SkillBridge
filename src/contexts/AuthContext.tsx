import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  githubId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  publicRepos: number;
  followers: number;
  following: number;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface Profile {
  userId: string;
  currentRole?: string;
  targetRole?: string;
  experienceLevel?: string;
  techStack: string[];
  careerGoal?: string;
  completedOnboarding: boolean;
  roadmapProgress?: {
    [roadmapId: string]: {
      completedSteps: string[];
      lastUpdated: string;
      progressPercentage: number;
    }
  };
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    publicProfile: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateProgress: (roadmapId: string, completedSteps: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // API call helper
  const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const accessToken = getAccessToken();
    
    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    });
  };

  // Fetch current user and profile data
  const fetchUserAndProfile = useCallback(async (): Promise<{ user: User | null; profile: Profile | null }> => {
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        return { user: null, profile: null };
      }

      const response = await apiCall('/api');
      
      if (!response.ok) {
        if (response.status === 401) {
          clearTokens();
        }
        return { user: null, profile: null };
      }

      const data = await response.json();
      
      return {
        user: data.profile ? data : null, // User data is in the root
        profile: data.profile || null     // Profile data is nested
      };
    } catch (error) {
      console.error('Error fetching user and profile:', error);
      clearTokens();
      return { user: null, profile: null };
    }
  }, []);

  // Login function
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
      
      const { user: userData, profile: profileData } = await fetchUserAndProfile();
      if (userData) {
        setUser(userData);
        setProfile(profileData);
        console.log('✅ User login successful:', userData.username);
      } else {
        clearTokens();
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      clearTokens();
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await apiCall('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all session data
      clearTokens();
      setUser(null);
      setProfile(null);
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  // Update profile data
  const updateProfile = async (data: Partial<Profile>): Promise<void> => {
    try {
      const response = await apiCall('/profilesMe', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      setProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  // Update roadmap progress
  const updateProgress = async (roadmapId: string, completedSteps: string[]): Promise<void> => {
    try {
      const response = await apiCall('/profilesProgress', {
        method: 'PUT',
        body: JSON.stringify({ roadmapId, completedSteps }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        
        const updatedProgress = {
          ...prev.roadmapProgress,
          [roadmapId]: {
            completedSteps,
            lastUpdated: new Date().toISOString(),
            progressPercentage: Math.round((completedSteps.length / 10) * 100)
          }
        };

        return {
          ...prev,
          roadmapProgress: updatedProgress,
          updatedAt: new Date().toISOString()
        };
      });

      console.log('✅ Progress updated successfully');
    } catch (error) {
      console.error('❌ Progress update error:', error);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();

      if (accessToken && refreshTokenValue) {
        const { user: userData, profile: profileData } = await fetchUserAndProfile();
        if (userData) {
          setUser(userData);
          setProfile(profileData);
        } else {
          clearTokens();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUserAndProfile]);

  // Computed properties
  const isAuthenticated = !!user;
  const hasCompletedOnboarding = !!profile?.completedOnboarding;

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated,
    isLoading,
    hasCompletedOnboarding,
    login,
    logout,
    updateProfile,
    updateProgress,
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
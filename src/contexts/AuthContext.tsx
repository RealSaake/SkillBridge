import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { offlineSupport } from '../utils/offlineSupport';

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
  refreshUserData: () => Promise<void>;
  exportUserData: () => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
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

  // API call helper with retry logic
  const apiCall = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
    const accessToken = getAccessToken();
    
    const makeRequest = async (): Promise<Response> => {
      return fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...options.headers,
        },
      });
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await makeRequest();
        
        // If successful or client error (4xx), return immediately
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        // If server error (5xx) and we have retries left, continue
        if (attempt < retries) {
          console.warn(`API call failed (attempt ${attempt + 1}/${retries + 1}):`, response.status);
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return response;
      } catch (error) {
        // Network error
        if (attempt < retries) {
          console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}):`, error);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded');
  };

  // Fetch current user and profile data
  const fetchUserAndProfile = useCallback(async (): Promise<{ user: User | null; profile: Profile | null }> => {
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        // Check for cached user data when offline
        if (!offlineSupport.isOnline()) {
          const cachedData = offlineSupport.getCachedData('user_profile');
          if (cachedData) {
            return {
              user: cachedData.user || null,
              profile: cachedData.profile || null
            };
          }
        }
        return { user: null, profile: null };
      }

      const response = await apiCall('/api');
      
      if (!response.ok) {
        if (response.status === 401) {
          clearTokens();
        }
        
        // Try cached data on error
        const cachedData = offlineSupport.getCachedData('user_profile');
        if (cachedData) {
          console.warn('Using cached user data due to API error');
          return {
            user: cachedData.user || null,
            profile: cachedData.profile || null
          };
        }
        
        return { user: null, profile: null };
      }

      const data = await response.json();
      
      // Cache the successful response
      const userData = {
        user: data.id ? data : null,
        profile: data.profile || null
      };
      
      offlineSupport.cacheData('user_profile', userData);
      
      return userData;
    } catch (error) {
      console.error('Error fetching user and profile:', error);
      
      // Try cached data on network error
      const cachedData = offlineSupport.getCachedData('user_profile');
      if (cachedData) {
        console.warn('Using cached user data due to network error');
        return {
          user: cachedData.user || null,
          profile: cachedData.profile || null
        };
      }
      
      clearTokens();
      return { user: null, profile: null };
    }
  }, []);

  // Login function - ATOMIC SESSION MANAGEMENT
  const login = async (accessToken: string, refreshTokenValue: string): Promise<void> => {
    console.log('🔐 LOGIN: Starting atomic session initialization');
    
    try {
      // Validate token format before storing
      if (!accessToken || !refreshTokenValue) {
        throw new Error('Missing authentication tokens');
      }
      
      if (!accessToken.startsWith('github_') || !refreshTokenValue.startsWith('refresh_')) {
        throw new Error('Invalid token format');
      }

      console.log('🔐 LOGIN: Tokens validated, storing in localStorage');
      setTokens(accessToken, refreshTokenValue);
      
      // CRITICAL: Initialize userDataIsolation session IMMEDIATELY
      const { userDataIsolation } = await import('../utils/userDataIsolation');
      const sessionInitialized = userDataIsolation.initializeSession(accessToken, refreshTokenValue);
      
      if (!sessionInitialized) {
        console.error('❌ LOGIN: Failed to initialize userDataIsolation session');
        clearTokens();
        throw new Error('Failed to initialize secure session');
      }
      
      console.log('✅ LOGIN: UserDataIsolation session initialized successfully');
      
      // Fetch user and profile data
      console.log('🔐 LOGIN: Fetching user and profile data');
      const { user: userData, profile: profileData } = await fetchUserAndProfile();
      
      if (userData) {
        console.log('🔐 LOGIN: Setting user and profile state atomically');
        setUser(userData);
        setProfile(profileData);
        console.log('✅ LOGIN: User login successful:', userData.username);
        console.log('✅ LOGIN: Profile status:', profileData ? 'EXISTS' : 'NEEDS_ONBOARDING');
      } else {
        console.error('❌ LOGIN: Failed to fetch user data');
        clearTokens();
        userDataIsolation.clearSession();
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('❌ LOGIN: Login error:', error);
      clearTokens();
      // Clear userDataIsolation session on failure
      try {
        const { userDataIsolation } = await import('../utils/userDataIsolation');
        userDataIsolation.clearSession();
      } catch (importError) {
        console.error('❌ LOGIN: Failed to clear userDataIsolation session:', importError);
      }
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

  // Refresh user data (useful after profile creation) - ATOMIC REFRESH
  const refreshUserData = async (): Promise<void> => {
    console.log('🔄 REFRESH: Starting atomic user data refresh');
    
    try {
      // Ensure userDataIsolation session is still valid
      const { userDataIsolation } = await import('../utils/userDataIsolation');
      const currentSession = userDataIsolation.getCurrentSession();
      
      if (!currentSession) {
        console.error('❌ REFRESH: No valid userDataIsolation session found');
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        
        if (accessToken && refreshToken) {
          console.log('🔄 REFRESH: Reinitializing userDataIsolation session');
          const sessionInitialized = userDataIsolation.initializeSession(accessToken, refreshToken);
          if (!sessionInitialized) {
            throw new Error('Failed to reinitialize secure session');
          }
        } else {
          throw new Error('No valid tokens for session reinitialization');
        }
      }
      
      console.log('🔄 REFRESH: Fetching fresh user and profile data');
      const { user: userData, profile: profileData } = await fetchUserAndProfile();
      
      console.log('🔄 REFRESH: Setting refreshed state atomically');
      setUser(userData);
      setProfile(profileData);
      
      console.log('✅ REFRESH: User data refreshed successfully');
      console.log('✅ REFRESH: Profile status:', profileData ? 'EXISTS' : 'NEEDS_ONBOARDING');
    } catch (error) {
      console.error('❌ REFRESH: Error refreshing user data:', error);
      throw error;
    }
  };

  // Export user data
  const exportUserData = async (): Promise<void> => {
    try {
      const response = await apiCall('/exportUserData', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export user data');
      }

      // Create and download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillbridge-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ User data exported successfully');
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async (confirmation: string): Promise<void> => {
    try {
      const response = await apiCall('/deleteAccount', {
        method: 'DELETE',
        body: JSON.stringify({ confirmDeletion: confirmation }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Clear all local data
      clearTokens();
      offlineSupport.clearAllCache();
      setUser(null);
      setProfile(null);
      
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();

      console.log('✅ Account deleted successfully');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Error deleting account:', error);
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
    refreshUserData,
    exportUserData,
    deleteAccount,
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
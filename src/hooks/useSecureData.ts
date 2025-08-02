/**
 * Secure Data Hook
 * 
 * This hook provides a secure way to fetch and manage user data with proper
 * isolation, validation, and error handling. It ensures that components
 * can only access data that belongs to the current authenticated user.
 */

import { useState, useEffect, useCallback } from 'react';
import { userDataIsolation, type GitHubUserData, type GitHubRepository } from '../utils/userDataIsolation';
import { useAuth } from '../contexts/AuthContext';

interface UseSecureDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface SecureDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useSecureGitHubProfile(options: UseSecureDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const { user, logout } = useAuth();
  const [state, setState] = useState<SecureDataState<GitHubUserData>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchProfile = useCallback(async () => {
    console.log('📊 SECURE_DATA: Starting GitHub profile fetch');
    
    if (!user) {
      console.log('📊 SECURE_DATA: No user found, clearing profile data');
      setState(prev => ({ ...prev, data: null, loading: false, error: null }));
      return;
    }

    console.log('📊 SECURE_DATA: User found, starting profile fetch for:', user.username);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get access token for validation
      const accessToken = localStorage.getItem('accessToken');
      console.log('📊 SECURE_DATA: Access token check:', {
        hasToken: !!accessToken,
        tokenPrefix: accessToken?.substring(0, 10) + '...'
      });

      if (!accessToken) {
        throw new Error('Authentication Missing: No access token found');
      }

      // Validate session integrity with detailed logging
      console.log('📊 SECURE_DATA: Validating session integrity');
      if (!userDataIsolation.validateSessionIntegrity()) {
        throw new Error('Session integrity check failed');
      }

      console.log('✅ SECURE_DATA: Session integrity validated, fetching profile data');
      const profileData = await userDataIsolation.fetchUserProfile();
      
      console.log('✅ SECURE_DATA: Profile data fetched successfully:', {
        username: profileData?.login,
        publicRepos: profileData?.public_repos
      });
      
      setState({
        data: profileData,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

      return profileData;
    } catch (error: any) {
      console.error('❌ SECURE_DATA: Error fetching GitHub profile:', error);
      
      let errorMessage = 'Failed to fetch profile data';
      
      if (error.message.includes('Authentication Missing')) {
        errorMessage = 'Authentication Missing: Please sign in again';
        console.error('❌ SECURE_DATA: Authentication missing - logging out user');
        await logout();
      } else if (error.message.includes('token expired') || error.message.includes('invalid')) {
        errorMessage = 'Authentication expired. Please log in again.';
        console.error('❌ SECURE_DATA: Token expired - logging out user');
        await logout();
      } else if (error.message.includes('validation failed')) {
        errorMessage = 'Data validation failed. Session compromised.';
        console.error('❌ SECURE_DATA: Data validation failed - logging out user');
        await logout();
      } else if (error.message.includes('integrity check failed')) {
        errorMessage = 'Session security check failed. Please log in again.';
        console.error('❌ SECURE_DATA: Session integrity failed - logging out user');
        await logout();
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
        lastUpdated: null
      });

      throw error;
    }
  }, [user, logout]);

  const refresh = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (autoFetch && user) {
      fetchProfile();
    }
  }, [autoFetch, user, fetchProfile]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (user && !state.loading) {
          fetchProfile();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, user, state.loading, fetchProfile]);

  return {
    ...state,
    refresh,
    fetchProfile
  };
}

export function useSecureGitHubRepositories(options: UseSecureDataOptions & { 
  page?: number; 
  perPage?: number; 
} = {}) {
  const { autoFetch = true, refreshInterval, page = 1, perPage = 30 } = options;
  const { user, logout } = useAuth();
  const [state, setState] = useState<SecureDataState<GitHubRepository[]>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchRepositories = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, data: null, loading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Validate session integrity
      if (!userDataIsolation.validateSessionIntegrity()) {
        throw new Error('Session integrity check failed');
      }

      const repositories = await userDataIsolation.fetchUserRepositories(page, perPage);
      
      setState({
        data: repositories,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

      return repositories;
    } catch (error: any) {
      console.error('Error fetching GitHub repositories:', error);
      
      let errorMessage = 'Failed to fetch repositories';
      
      if (error.message.includes('token expired') || error.message.includes('invalid')) {
        errorMessage = 'Authentication expired. Please log in again.';
        await logout();
      } else if (error.message.includes('validation failed')) {
        errorMessage = 'Data validation failed. Session compromised.';
        await logout();
      } else if (error.message.includes('integrity check failed')) {
        errorMessage = 'Session security check failed. Please log in again.';
        await logout();
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
        lastUpdated: null
      });

      throw error;
    }
  }, [user, logout, page, perPage]);

  const refresh = useCallback(() => {
    return fetchRepositories();
  }, [fetchRepositories]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch && user) {
      fetchRepositories();
    }
  }, [autoFetch, user, page, perPage, fetchRepositories]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (user && !state.loading) {
          fetchRepositories();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, user, state.loading, fetchRepositories]);

  return {
    ...state,
    refresh,
    fetchRepositories
  };
}

export function useSecureUserStats(options: UseSecureDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const { user, logout } = useAuth();
  const [state, setState] = useState<SecureDataState<{
    totalRepos: number;
    languages: { [key: string]: number };
    totalStars: number;
    totalForks: number;
  }>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchStats = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, data: null, loading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Validate session integrity
      if (!userDataIsolation.validateSessionIntegrity()) {
        throw new Error('Session integrity check failed');
      }

      const stats = await userDataIsolation.getUserStats();
      
      setState({
        data: stats,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

      return stats;
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      
      let errorMessage = 'Failed to fetch user statistics';
      
      if (error.message.includes('token expired') || error.message.includes('invalid')) {
        errorMessage = 'Authentication expired. Please log in again.';
        await logout();
      } else if (error.message.includes('validation failed')) {
        errorMessage = 'Data validation failed. Session compromised.';
        await logout();
      } else if (error.message.includes('integrity check failed')) {
        errorMessage = 'Session security check failed. Please log in again.';
        await logout();
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
        lastUpdated: null
      });

      throw error;
    }
  }, [user, logout]);

  const refresh = useCallback(() => {
    return fetchStats();
  }, [fetchStats]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (autoFetch && user) {
      fetchStats();
    }
  }, [autoFetch, user, fetchStats]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (user && !state.loading) {
          fetchStats();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, user, state.loading, fetchStats]);

  return {
    ...state,
    refresh,
    fetchStats
  };
}

/**
 * Generic secure API call hook
 */
export function useSecureApiCall() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secureApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Validate session integrity
      if (!userDataIsolation.validateSessionIntegrity()) {
        throw new Error('Session integrity check failed');
      }

      const response = await userDataIsolation.secureApiCall(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (error: any) {
      console.error('Secure API call error:', error);
      
      let errorMessage = 'API call failed';
      
      if (error.message.includes('Authentication failed') || 
          error.message.includes('token expired') || 
          error.message.includes('invalid')) {
        errorMessage = 'Authentication expired. Please log in again.';
        await logout();
      } else if (error.message.includes('integrity check failed')) {
        errorMessage = 'Session security check failed. Please log in again.';
        await logout();
      }

      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [logout]);

  return {
    secureApiCall,
    loading,
    error
  };
}

/**
 * Session validation hook
 */
export function useSessionValidation() {
  const { user, logout } = useAuth();
  const [isValid, setIsValid] = useState(true);

  const validateSession = useCallback(async () => {
    if (!user) {
      setIsValid(false);
      return false;
    }

    try {
      const valid = userDataIsolation.validateSessionIntegrity();
      setIsValid(valid);
      
      if (!valid) {
        console.warn('Session validation failed - logging out user');
        await logout();
      }
      
      return valid;
    } catch (error) {
      console.error('Session validation error:', error);
      setIsValid(false);
      await logout();
      return false;
    }
  }, [user, logout]);

  // Validate session periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(validateSession, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user, validateSession]);

  return {
    isValid,
    validateSession
  };
}
/**
 * GitHub Data Hook
 * 
 * Custom hook for managing GitHub data fetching, caching, and synchronization
 * with comprehensive error handling and user feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logError, logInfo, logDebug, generateTraceId } from '../utils/logger';

// Types for GitHub data
interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
  topics?: string[];
}

interface GitHubStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  languages: Record<string, number>;
  skillAnalysis: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    primaryLanguages: string[];
  };
  recentActivity: {
    reposUpdatedThisMonth: number;
    lastPushDate: string | null;
  };
  mostStarredRepo: string | null;
}

interface SyncProgress {
  stage: string;
  current: number;
  total: number;
}

interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
}

interface UseGitHubDataOptions {
  autoFetchProfile?: boolean;
  autoFetchRepositories?: boolean;
  autoCalculateStats?: boolean;
  autoSync?: boolean;
  maxRetries?: number;
  enablePolling?: boolean;
  pollingInterval?: number;
  logErrors?: boolean;
}

interface GitHubDataState {
  // Data
  userProfile: GitHubUser | null;
  repositories: GitHubRepository[] | null;
  stats: GitHubStats | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingRepositories: boolean;
  isLoadingStats: boolean;
  isSyncing: boolean;
  
  // Error states
  error: string | null;
  profileError: string | null;
  repositoriesError: string | null;
  statsError: string | null;
  
  // Sync info
  syncProgress: SyncProgress;
  lastSyncAt: string | null;
  
  // Retry info
  retryCount: number;
  canRetry: boolean;
  
  // Rate limit info
  rateLimitInfo: RateLimitInfo | null;
}

interface GitHubDataActions {
  fetchUserProfile: () => Promise<void>;
  fetchAllRepositories: () => Promise<void>;
  calculateStats: () => Promise<void>;
  refreshData: () => Promise<void>;
  retry: () => Promise<void>;
  clearErrors: () => void;
}

const useGitHubData = (options: UseGitHubDataOptions = {}): [GitHubDataState, GitHubDataActions] => {
  const {
    autoFetchProfile = true,
    autoFetchRepositories = true,
    autoCalculateStats = true,
    autoSync = false,
    maxRetries = 3,
    enablePolling = false,
    pollingInterval = 5 * 60 * 1000, // 5 minutes
    logErrors = true
  } = options;

  // State
  const [state, setState] = useState<GitHubDataState>({
    userProfile: null,
    repositories: null,
    stats: null,
    isLoading: false,
    isLoadingProfile: false,
    isLoadingRepositories: false,
    isLoadingStats: false,
    isSyncing: false,
    error: null,
    profileError: null,
    repositoriesError: null,
    statsError: null,
    syncProgress: { stage: '', current: 0, total: 100 },
    lastSyncAt: null,
    retryCount: 0,
    canRetry: true,
    rateLimitInfo: null
  });

  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Update sync progress
   */
  const updateSyncProgress = useCallback((stage: string, current: number) => {
    setState(prev => ({
      ...prev,
      syncProgress: { stage, current, total: 100 }
    }));
  }, []);

  /**
   * Mock fetch user profile (replace with real GitHub API call)
   */
  const fetchUserProfile = useCallback(async () => {
    const traceId = generateTraceId();
    
    try {
      setState(prev => ({ ...prev, isLoadingProfile: true, profileError: null }));
      
      logDebug('Fetching user profile', { traceId }, 'useGitHubData');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with real GitHub API call
      const mockProfile: GitHubUser = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://github.com/identicons/testuser.png',
        bio: 'Full-stack developer passionate about open source',
        location: 'San Francisco, CA',
        company: 'Tech Corp',
        blog: 'https://testuser.dev',
        public_repos: 25,
        followers: 150,
        following: 75,
        created_at: '2020-01-15T10:30:00Z',
        updated_at: new Date().toISOString()
      };
      
      setState(prev => ({
        ...prev,
        userProfile: mockProfile,
        isLoadingProfile: false,
        profileError: null
      }));
      
      logInfo('User profile fetched successfully', { 
        traceId,
        username: mockProfile.login 
      }, 'useGitHubData');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user profile';
      
      setState(prev => ({
        ...prev,
        isLoadingProfile: false,
        profileError: errorMessage
      }));
      
      if (logErrors) {
        logError('Failed to fetch user profile', error as Error, { traceId }, 'useGitHubData');
      }
    }
  }, [logErrors]);

  /**
   * Mock fetch repositories (replace with real GitHub API call)
   */
  const fetchAllRepositories = useCallback(async () => {
    const traceId = generateTraceId();
    
    try {
      setState(prev => ({ ...prev, isLoadingRepositories: true, repositoriesError: null }));
      
      logDebug('Fetching repositories', { traceId }, 'useGitHubData');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - replace with real GitHub API call
      const mockRepositories: GitHubRepository[] = [
        {
          id: 1,
          name: 'awesome-project',
          full_name: 'testuser/awesome-project',
          description: 'An awesome full-stack web application',
          language: 'TypeScript',
          stargazers_count: 42,
          forks_count: 8,
          updated_at: '2024-01-20T15:30:00Z',
          html_url: 'https://github.com/testuser/awesome-project',
          private: false,
          topics: ['react', 'typescript', 'nodejs']
        },
        {
          id: 2,
          name: 'data-analysis-tool',
          full_name: 'testuser/data-analysis-tool',
          description: 'Python tool for data analysis and visualization',
          language: 'Python',
          stargazers_count: 23,
          forks_count: 5,
          updated_at: '2024-01-18T09:15:00Z',
          html_url: 'https://github.com/testuser/data-analysis-tool',
          private: false,
          topics: ['python', 'data-science', 'visualization']
        },
        {
          id: 3,
          name: 'mobile-app',
          full_name: 'testuser/mobile-app',
          description: 'Cross-platform mobile application',
          language: 'JavaScript',
          stargazers_count: 15,
          forks_count: 3,
          updated_at: '2024-01-15T12:45:00Z',
          html_url: 'https://github.com/testuser/mobile-app',
          private: false,
          topics: ['react-native', 'mobile', 'javascript']
        }
      ];
      
      setState(prev => ({
        ...prev,
        repositories: mockRepositories,
        isLoadingRepositories: false,
        repositoriesError: null
      }));
      
      logInfo('Repositories fetched successfully', { 
        traceId,
        count: mockRepositories.length 
      }, 'useGitHubData');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repositories';
      
      setState(prev => ({
        ...prev,
        isLoadingRepositories: false,
        repositoriesError: errorMessage
      }));
      
      if (logErrors) {
        logError('Failed to fetch repositories', error as Error, { traceId }, 'useGitHubData');
      }
    }
  }, [logErrors]);

  /**
   * Calculate statistics from repositories
   */
  const calculateStats = useCallback(async () => {
    const traceId = generateTraceId();
    
    try {
      setState(prev => ({ ...prev, isLoadingStats: true, statsError: null }));
      
      logDebug('Calculating statistics', { traceId }, 'useGitHubData');
      
      // Get current repositories
      const repositories = state.repositories;
      if (!repositories || repositories.length === 0) {
        throw new Error('No repositories available for statistics calculation');
      }
      
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Calculate stats
      const totalRepos = repositories.length;
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
      
      // Language analysis
      const languages: Record<string, number> = {};
      repositories.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });
      
      // Primary languages (top 3)
      const primaryLanguages = Object.entries(languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([lang]) => lang);
      
      // Experience level based on repos and stars
      let experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
      if (totalRepos >= 20 && totalStars >= 100) {
        experienceLevel = 'expert';
      } else if (totalRepos >= 10 && totalStars >= 50) {
        experienceLevel = 'advanced';
      } else if (totalRepos >= 5 && totalStars >= 10) {
        experienceLevel = 'intermediate';
      }
      
      // Recent activity
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const reposUpdatedThisMonth = repositories.filter(
        repo => new Date(repo.updated_at) > oneMonthAgo
      ).length;
      
      const lastPushDate = repositories
        .map(repo => repo.updated_at)
        .sort()
        .reverse()[0] || null;
      
      // Most starred repo
      const mostStarredRepo = repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)[0]?.name || null;
      
      const stats: GitHubStats = {
        totalRepos,
        totalStars,
        totalForks,
        languages,
        skillAnalysis: {
          experienceLevel,
          primaryLanguages
        },
        recentActivity: {
          reposUpdatedThisMonth,
          lastPushDate
        },
        mostStarredRepo
      };
      
      setState(prev => ({
        ...prev,
        stats,
        isLoadingStats: false,
        statsError: null
      }));
      
      logInfo('Statistics calculated successfully', { 
        traceId,
        stats: {
          totalRepos,
          totalStars,
          experienceLevel,
          primaryLanguages
        }
      }, 'useGitHubData');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate statistics';
      
      setState(prev => ({
        ...prev,
        isLoadingStats: false,
        statsError: errorMessage
      }));
      
      if (logErrors) {
        logError('Failed to calculate statistics', error as Error, { traceId }, 'useGitHubData');
      }
    }
  }, [state.repositories, logErrors]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    const traceId = generateTraceId();
    
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      logInfo('Starting data refresh', { traceId }, 'useGitHubData');
      
      // Fetch profile
      if (autoFetchProfile) {
        updateSyncProgress('Fetching profile...', 20);
        await fetchUserProfile();
      }
      
      // Fetch repositories
      if (autoFetchRepositories) {
        updateSyncProgress('Fetching repositories...', 60);
        await fetchAllRepositories();
      }
      
      // Calculate stats
      if (autoCalculateStats) {
        updateSyncProgress('Calculating statistics...', 90);
        await calculateStats();
      }
      
      updateSyncProgress('Complete', 100);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        retryCount: 0
      }));
      
      logInfo('Data refresh completed successfully', { traceId }, 'useGitHubData');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage
      }));
      
      if (logErrors) {
        logError('Data refresh failed', error as Error, { traceId }, 'useGitHubData');
      }
    }
  }, [autoFetchProfile, autoFetchRepositories, autoCalculateStats, fetchUserProfile, fetchAllRepositories, calculateStats, updateSyncProgress, logErrors]);

  /**
   * Retry failed operations
   */
  const retry = useCallback(async () => {
    if (state.retryCount >= maxRetries) {
      logError('Maximum retry attempts reached', new Error('Max retries exceeded'), {
        retryCount: state.retryCount,
        maxRetries
      }, 'useGitHubData');
      return;
    }
    
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      canRetry: prev.retryCount + 1 < maxRetries
    }));
    
    await refreshData();
  }, [state.retryCount, maxRetries, refreshData]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      profileError: null,
      repositoriesError: null,
      statsError: null,
      retryCount: 0,
      canRetry: true
    }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoSync) {
      refreshData();
    } else {
      if (autoFetchProfile) fetchUserProfile();
      if (autoFetchRepositories) fetchAllRepositories();
    }
  }, [autoSync, autoFetchProfile, autoFetchRepositories, refreshData, fetchUserProfile, fetchAllRepositories]);

  // Auto-calculate stats when repositories change
  useEffect(() => {
    if (autoCalculateStats && state.repositories && state.repositories.length > 0 && !state.stats) {
      calculateStats();
    }
  }, [autoCalculateStats, state.repositories, state.stats, calculateStats]);

  // Polling setup
  useEffect(() => {
    if (enablePolling && pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        refreshData();
      }, pollingInterval);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enablePolling, pollingInterval, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const actions: GitHubDataActions = {
    fetchUserProfile,
    fetchAllRepositories,
    calculateStats,
    refreshData,
    retry,
    clearErrors
  };

  return [state, actions];
};

export default useGitHubData;
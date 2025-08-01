/**
 * GitHub Data Display Component
 * 
 * This component provides a comprehensive display of GitHub data with:
 * - Real-time data synchronization
 * - Error boundaries and graceful error handling
 * - Loading states and progress indicators
 * - User-friendly error messages with retry options
 * - Responsive design and accessibility
 */

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  GitHubErrorBoundary,
  ComponentErrorBoundary 
} from './ErrorBoundary';
import useGitHubData from '../hooks/useGitHubData';
import {
  logUserAction,
  logError,
  logInfo,
  generateTraceId
} from '../utils/logger';
import {
  User,
  GitBranch,
  Star,
  GitFork,
  Calendar,
  MapPin,
  Building,
  Link as LinkIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Code,
  Award,
  Activity
} from 'lucide-react';

interface GitHubDataDisplayProps {
  className?: string;
  showStats?: boolean;
  showRepositories?: boolean;
  showProfile?: boolean;
  maxRepositories?: number;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

const GitHubDataDisplay: React.FC<GitHubDataDisplayProps> = ({
  className = '',
  showStats = true,
  showRepositories = true,
  showProfile = true,
  maxRepositories = 10,
  enableAutoRefresh = false,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const traceId = generateTraceId();
  
  const [githubData, githubActions] = useGitHubData({
    autoFetchProfile: showProfile,
    autoFetchRepositories: showRepositories,
    autoCalculateStats: showStats,
    autoSync: true,
    maxRetries: 3,
    enablePolling: enableAutoRefresh,
    pollingInterval: refreshInterval,
    logErrors: true
  });

  /**
   * Handle manual refresh with user feedback
   */
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      logUserAction('manual_refresh_github_data', {
        traceId,
        hasProfile: !!githubData.userProfile,
        repositoryCount: githubData.repositories?.length || 0,
        hasStats: !!githubData.stats
      });
      
      await githubActions.refreshData();
      
      logInfo('Manual refresh completed successfully', {
        traceId
      }, 'GitHubDataDisplay');
      
    } catch (error) {
      logError('Manual refresh failed', error as Error, {
        traceId
      }, 'GitHubDataDisplay');
    } finally {
      setRefreshing(false);
    }
  }, [githubActions, githubData, traceId]);

  /**
   * Handle retry with user feedback
   */
  const handleRetry = useCallback(async () => {
    logUserAction('retry_github_data', {
      traceId,
      retryCount: githubData.retryCount,
      error: githubData.error
    });
    
    await githubActions.retry();
  }, [githubActions, githubData.retryCount, githubData.error, traceId]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Get experience level color
   */
  const getExperienceLevelColor = (level: string): string => {
    switch (level) {
      case 'expert': return 'text-purple-600 bg-purple-100';
      case 'advanced': return 'text-blue-600 bg-blue-100';
      case 'intermediate': return 'text-green-600 bg-green-100';
      case 'beginner': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Render loading state
   */
  const renderLoadingState = (message: string = 'Loading...') => (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );

  /**
   * Render error state with retry option
   */
  const renderErrorState = (error: string, onRetry?: () => void) => (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && githubData.canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );

  /**
   * Render sync progress
   */
  const renderSyncProgress = () => {
    if (!githubData.isSyncing) return null;
    
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800">
              {githubData.syncProgress.stage}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${githubData.syncProgress.current}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-blue-600">
            {githubData.syncProgress.current}%
          </span>
        </div>
      </div>
    );
  };

  /**
   * Render user profile section
   */
  const renderUserProfile = () => {
    if (!showProfile) return null;
    
    if (githubData.isLoadingProfile) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>GitHub Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderLoadingState('Loading profile...')}
          </CardContent>
        </Card>
      );
    }
    
    if (githubData.profileError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>GitHub Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderErrorState(githubData.profileError, githubActions.fetchUserProfile)}
          </CardContent>
        </Card>
      );
    }
    
    if (!githubData.userProfile) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>GitHub Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 text-gray-500">
              No profile data available
            </div>
          </CardContent>
        </Card>
      );
    }
    
    const profile = githubData.userProfile;
    
    return (
      <ComponentErrorBoundary componentName="GitHubProfile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>GitHub Profile</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || githubData.isLoading}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <img
                src={profile.avatar_url}
                alt={`${profile.login}'s avatar`}
                className="w-16 h-16 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.name || profile.login}
                  </h3>
                  <p className="text-gray-600">@{profile.login}</p>
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.company && (
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                  
                  {profile.blog && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-4 h-4" />
                      <a 
                        href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {profile.blog}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formatNumber(profile.public_repos)}</span>
                    <span className="text-gray-600">repositories</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formatNumber(profile.followers)}</span>
                    <span className="text-gray-600">followers</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formatNumber(profile.following)}</span>
                    <span className="text-gray-600">following</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ComponentErrorBoundary>
    );
  };

  // For now, return a simple loading state since we need to create the missing hooks
  return (
    <GitHubErrorBoundary operation="DataDisplay">
      <div className={`space-y-6 ${className}`}>
        {renderUserProfile()}
        
        {/* Placeholder for other sections */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 text-gray-500">
              GitHub data integration in progress...
            </div>
          </CardContent>
        </Card>
      </div>
    </GitHubErrorBoundary>
  );
};

export default GitHubDataDisplay;
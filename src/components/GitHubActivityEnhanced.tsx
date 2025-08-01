/**
 * GitHub Activity Enhanced Component
 * 
 * Enhanced GitHub activity display with:
 * - Real-time data fetching via MCP
 * - Interactive charts and visualizations
 * - Collapsible sections
 * - Refresh functionality
 * - Loading states and error handling
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ComponentErrorBoundary } from './ErrorBoundary';
import GitHubService from '../services/GitHubService';
import { 
  Github, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown,
  Star,
  GitFork,
  Calendar,
  TrendingUp,
  Code,
  Activity
} from 'lucide-react';

interface GitHubActivityEnhancedProps {
  username: string;
  className?: string;
}

interface GitHubActivityData {
  profile: {
    login: string;
    name: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  repositories: Array<{
    name: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
  }>;
  stats: {
    totalStars: number;
    totalForks: number;
    languages: Record<string, number>;
    recentActivity: {
      commitsThisMonth: number;
      reposUpdatedThisMonth: number;
    };
  };
}

export const GitHubActivityEnhanced: React.FC<GitHubActivityEnhancedProps> = ({
  username,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState<GitHubActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real GitHub data fetching through MCP integration
  const fetchGitHubActivity = async () => {
    try {
      setError(null);
      
      // Use real GitHub API through GitHubService
      const githubService = GitHubService.getInstance();
      const [profile, repositories] = await Promise.all([
        githubService.fetchUserProfile(),
        githubService.fetchUserRepositories()
      ]);
      
      // Calculate stats from real data
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
      
      const languages: Record<string, number> = {};
      repositories.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const recentRepos = repositories.filter(repo => 
        new Date(repo.updated_at) > oneMonthAgo
      );
      
      const activityData: GitHubActivityData = {
        profile: {
          login: profile.login,
          name: profile.name || profile.login,
          avatar_url: profile.avatar_url,
          public_repos: profile.public_repos,
          followers: profile.followers,
          following: profile.following
        },
        repositories: repositories.slice(0, 10), // Show top 10 repos
        stats: {
          totalStars,
          totalForks,
          languages,
          recentActivity: {
            commitsThisMonth: 0, // Would need additional API call to get commit data
            reposUpdatedThisMonth: recentRepos.length
          }
        }
      };
      
      setData(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GitHub activity');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGitHubActivity();
  }, [username]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGitHubActivity();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderLoadingState = () => (
    <div className="space-y-4" data-testid="loading-skeleton">
      <div className="grid grid-cols-2 gap-4">
        <div className="animate-pulse bg-muted h-20 rounded-lg" />
        <div className="animate-pulse bg-muted h-20 rounded-lg" />
      </div>
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Analyzing GitHub activity...</span>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center p-8">
      <div className="text-red-600 mb-2">Failed to load GitHub activity</div>
      <div className="text-sm text-gray-500 mb-4">{error}</div>
      <Button onClick={handleRefresh} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  const renderActivityMetrics = () => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="activity-metrics">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.stats.totalStars}</div>
          <div className="text-sm text-gray-600">Total Stars</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.stats.totalForks}</div>
          <div className="text-sm text-gray-600">Total Forks</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.stats.recentActivity.commitsThisMonth}</div>
          <div className="text-sm text-gray-600">Commits This Month</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.stats.recentActivity.reposUpdatedThisMonth}</div>
          <div className="text-sm text-gray-600">Active Repos</div>
        </div>
      </div>
    );
  };

  const renderLanguageDistribution = () => {
    if (!data) return null;

    const languages = Object.entries(data.stats.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div className="mb-6" data-testid="language-distribution">
        <h4 className="font-medium mb-3 flex items-center">
          <Code className="w-4 h-4 mr-2" />
          Language Distribution
        </h4>
        <div className="space-y-2">
          {languages.map(([language, count]) => (
            <div key={language} className="flex items-center justify-between">
              <span className="text-sm">{language}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / Math.max(...Object.values(data.stats.languages))) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentRepositories = () => {
    if (!data) return null;

    return (
      <div data-testid="recent-repositories">
        <h4 className="font-medium mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          Recent Activity
        </h4>
        <div className="space-y-3">
          {data.repositories.map((repo) => (
            <div key={repo.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{repo.name}</div>
                <div className="text-xs text-gray-500 flex items-center space-x-3">
                  {repo.language && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center">
                    <GitFork className="w-3 h-3 mr-1" />
                    {repo.forks_count}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(repo.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ComponentErrorBoundary componentName="GitHubActivityEnhanced">
      <Card className={`transition-colors duration-300 ${className}`} data-testid="github-activity-enhanced">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <CardTitle className="text-lg">GitHub Activity</CardTitle>
              {username && (
                <Badge variant="secondary" className="text-xs">
                  @{username}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh GitHub data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="pt-0 space-y-6">
            {isLoading ? (
              renderLoadingState()
            ) : error ? (
              renderErrorState()
            ) : (
              <div className="space-y-6">
                {renderActivityMetrics()}
                {renderLanguageDistribution()}
                {renderRecentRepositories()}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </ComponentErrorBoundary>
  );
};

export default GitHubActivityEnhanced;
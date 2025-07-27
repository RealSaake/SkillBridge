import React, { useState } from 'react';
import { Github, GitCommit, GitPullRequest, Star, ChevronDown, ChevronUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from '../App';
import { useGitHubActivity, useGitHubRepos } from '../hooks/useMCP';

interface GitHubActivityEnhancedProps {
  username?: string;
  targetRole?: string;
}

export function GitHubActivityEnhanced({ 
  username = 'octocat', 
  targetRole = 'fullstack' 
}: GitHubActivityEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme } = useTheme();
  
  // 🔌 Real MCP data hooks
  const { 
    data: activityData, 
    loading: activityLoading, 
    error: activityError, 
    refetch: refetchActivity 
  } = useGitHubActivity(username, targetRole);
  
  const { 
    data: reposData, 
    loading: reposLoading, 
    error: reposError 
  } = useGitHubRepos(username);

  const isLoading = activityLoading || reposLoading;
  const hasError = activityError || reposError;

  // Language distribution calculation
  const getLanguageDistribution = () => {
    if (!reposData) return [];
    
    const languageCount: Record<string, number> = {};
    let totalRepos = 0;
    
    reposData.forEach((repo: any) => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
        totalRepos++;
      }
    });
    
    return Object.entries(languageCount)
      .map(([language, count]) => ({
        language,
        percentage: Math.round((count / totalRepos) * 100),
        color: getLanguageColor(language)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5); // Top 5 languages
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      JavaScript: '#f7df1e',
      TypeScript: '#3178c6',
      Python: '#3776ab',
      Java: '#ed8b00',
      'C++': '#00599c',
      HTML: '#e34c26',
      CSS: '#1572b6',
      Ruby: '#cc342d',
      Go: '#00add8',
      Rust: '#dea584'
    };
    return colors[language] || '#6b7280';
  };

  const getTopRepositories = () => {
    if (!reposData) return [];
    
    return reposData
      .filter((repo: any) => !repo.fork) // Exclude forks
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3)
      .map((repo: any) => ({
        name: repo.name,
        language: repo.language,
        stars: repo.stargazers_count,
        lastCommit: new Date(repo.updated_at).toLocaleDateString(),
        description: repo.description
      }));
  };

  const handleRefresh = () => {
    refetchActivity();
  };

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <CardTitle className="text-lg">GitHub Activity</CardTitle>
            {activityData && (
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
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Analyzing GitHub activity...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load GitHub data for @{username}. Please check the username and try again.
                <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          {!isLoading && !hasError && activityData && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <GitCommit className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Total Stars</span>
                  </div>
                  <p className="text-2xl mt-1">{activityData.activity.totalStars}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Across all repositories
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <GitPullRequest className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Active Repos</span>
                  </div>
                  <p className="text-2xl mt-1">{activityData.activity.recentlyActiveRepos}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Recently updated
                  </p>
                </div>
              </div>

              {/* Profile Insights */}
              <div className={`p-4 rounded-lg border-l-4 ${
                activityData.insights.roleAlignment >= 80 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : activityData.insights.roleAlignment >= 60
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Role Alignment ({targetRole})</h4>
                  <span className="text-lg font-semibold">
                    {activityData.insights.roleAlignment}%
                  </span>
                </div>
                <Progress value={activityData.insights.roleAlignment} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs">
                  <span>Experience: {activityData.insights.experienceLevel}</span>
                  <span>Activity: {activityData.insights.activityLevel}</span>
                </div>
              </div>

              {/* Language Distribution */}
              <div>
                <h4 className="text-sm mb-3">Language Distribution</h4>
                <div className="space-y-2">
                  {getLanguageDistribution().length > 0 ? (
                    getLanguageDistribution().map(({ language, percentage, color }) => (
                      <div key={language} className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-sm flex-1">{language}</span>
                        <span className="text-sm">{percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p className="text-sm">No language data available</p>
                      <p className="text-xs">Push some code to see language distribution</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Repositories */}
              <div>
                <h4 className="text-sm mb-3">Top Repositories</h4>
                <div className="space-y-3">
                  {getTopRepositories().length > 0 ? (
                    getTopRepositories().map((repo) => (
                      <div key={repo.name} className={`p-3 rounded-lg border ${
                        theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium">{repo.name}</h5>
                            {repo.description && (
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {repo.description.length > 60 
                                  ? `${repo.description.substring(0, 60)}...` 
                                  : repo.description
                                }
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              {repo.language && (
                                <Badge variant="secondary" className="text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3" />
                                <span className="text-xs">{repo.stars}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {repo.lastCommit}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Github className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No repositories found</p>
                      <p className="text-xs">Start coding to see your activity here!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution Streak */}
              {activityData.activity.contributionStreak > 0 && (
                <div className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'border-green-600 bg-green-900/20' : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">
                      🔥 {activityData.activity.contributionStreak} day contribution streak!
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
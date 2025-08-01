import React, { useState } from 'react';
import { Github, GitCommit, GitPullRequest, Star, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useSecureGitHubRepositories, useSecureUserStats } from '../hooks/useSecureData';

interface GitHubStats {
  commits: number;
  pullRequests: number;
  stars: number;
  contributions: number;
}

export function GitHubActivity() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();
  
  // Use secure data hooks
  const { 
    data: githubRepos, 
    loading: reposLoading, 
    error: reposError
  } = useSecureGitHubRepositories({ 
    autoFetch: true,
    page: 1,
    perPage: 3
  });

  const { 
    data: userStats, 
    loading: statsLoading, 
    error: statsError
  } = useSecureUserStats({ 
    autoFetch: true
  });

  const isLoading = reposLoading || statsLoading;
  const error = reposError || statsError;

  // Calculate stats from real data
  const stats: GitHubStats = {
    commits: userStats?.totalRepos || 0,
    pullRequests: Math.floor((userStats?.totalRepos || 0) * 0.3), // Estimate
    stars: userStats?.totalStars || 0,
    contributions: userStats?.totalRepos || 0
  };

  // Calculate top languages
  const topLanguages = React.useMemo(() => {
    if (!userStats?.languages) return [];
    return Object.entries(userStats.languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([language, count], index) => ({
        language,
        percentage: Math.round((count / Object.values(userStats.languages).reduce((a, b) => a + b, 0)) * 100),
        color: index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-blue-500' : 'bg-green-500'
      }));
  }, [userStats]);

  return (
    <Card className="transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <CardTitle className="text-lg">GitHub Activity</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 rounded-lg bg-muted animate-pulse" />
                <div className="h-20 rounded-lg bg-muted animate-pulse" />
              </div>
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Analyzing GitHub activity...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mr-2" />
              <div className="flex-1">
                <p className="text-sm text-destructive">
                  Unable to load GitHub data. Please check your connection and try again.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Retry
              </Button>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <GitCommit className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Repositories</span>
                  </div>
                  <p className="text-2xl mt-1">{stats.commits}</p>
                  <p className="text-xs text-muted-foreground">
                    Total public
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Stars</span>
                  </div>
                  <p className="text-2xl mt-1">{stats.stars}</p>
                  <p className="text-xs text-muted-foreground">
                    Total earned
                  </p>
                </div>
              </div>

              {/* Language Distribution */}
              <div>
                <h4 className="text-sm mb-3">Language Distribution</h4>
                <div className="space-y-2">
                  {topLanguages.length > 0 ? (
                    topLanguages.map((lang, index) => (
                      <div key={lang.language} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${lang.color}`}></div>
                        <span className="text-sm flex-1">{lang.language}</span>
                        <span className="text-sm">{lang.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No language data available</p>
                      <p className="text-xs">Push some code to see language distribution</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Repositories */}
              <div>
                <h4 className="text-sm mb-3">Recent Repositories</h4>
                <div className="space-y-3">
                  {githubRepos && githubRepos.length > 0 ? (
                    githubRepos.slice(0, 2).map((repo) => (
                      <div key={repo.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium">{repo.name}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              {repo.language && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                  {repo.language}
                                </span>
                              )}
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3" />
                                <span className="text-xs">{repo.stargazers_count}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Github className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No repositories found</p>
                      <p className="text-xs">Start coding to see your activity here!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Repository Goal</h4>
                  <span className="text-sm">{stats.commits}/50</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.commits / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {Math.max(50 - stats.commits, 0)} repositories to reach your goal
                </p>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
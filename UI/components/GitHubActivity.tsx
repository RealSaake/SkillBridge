import React, { useState } from 'react';
import { Github, GitCommit, GitPullRequest, Star, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from '../App';

interface GitHubStats {
  commits: number;
  pullRequests: number;
  stars: number;
  contributions: number;
}

interface Repository {
  name: string;
  language: string;
  stars: number;
  lastCommit: string;
}

export function GitHubActivity() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  // Data binding - these will be populated by MCP server calls
  const stats = {
    commits: 156,
    pullRequests: 23,
    stars: 89,
    contributions: 234
  };

  const repositories = [
    // Loading state: Show skeleton cards while fetching
    // Error state: "Unable to load repositories. Check GitHub connection."
    // Empty state: "No repositories found. Start coding to see activity here!"
  ];

  const languageStats = [
    // Data from {{github.languageDistribution}}
    // Each item: { language: string, percentage: number, color: string }
  ];

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
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
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load GitHub data. Please check your connection and try again.
                <Button variant="outline" size="sm" className="ml-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <GitCommit className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Commits</span>
                  </div>
                  <p className="text-2xl mt-1">{stats.commits}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    This year
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <GitPullRequest className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Pull Requests</span>
                  </div>
                  <p className="text-2xl mt-1">{stats.pullRequests}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total opened
                  </p>
                </div>
              </div>

              {/* Language Distribution */}
              <div>
                <h4 className="text-sm mb-3">Language Distribution</h4>
                <div className="space-y-2">
                  {/* Data binding: will be populated by MCP server */}
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm flex-1">JavaScript</span>
                    <span className="text-sm">45%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm flex-1">TypeScript</span>
                    <span className="text-sm">30%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm flex-1">Python</span>
                    <span className="text-sm">20%</span>
                  </div>
                  {/* Empty state */}
                  <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm">No language data available</p>
                    <p className="text-xs">Push some code to see language distribution</p>
                  </div>
                </div>
              </div>

              {/* Recent Repositories */}
              <div>
                <h4 className="text-sm mb-3">Recent Repositories</h4>
                <div className="space-y-3">
                  {/* Data binding: will be populated by MCP server */}
                  <div className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm">react-portfolio</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            TypeScript
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span className="text-xs">12</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        2 hours ago
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm">api-gateway</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Node.js
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span className="text-xs">8</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        1 day ago
                      </span>
                    </div>
                  </div>
                  
                  {/* Empty state */}
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Github className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No repositories found</p>
                    <p className="text-xs">Start coding to see your activity here!</p>
                  </div>
                </div>
              </div>

              {/* Contribution Goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Yearly Contribution Goal</h4>
                  <span className="text-sm">{stats.contributions}/365</span>
                </div>
                <Progress value={(stats.contributions / 365) * 100} className="h-2" />
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {365 - stats.contributions} contributions to reach your goal
                </p>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
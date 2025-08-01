import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSecureGitHubRepositories, useSecureUserStats } from '../hooks/useSecureData';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Star, 
  GitFork, 
  Code, 
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Activity,
  PieChart
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Use secure data hooks
  const { 
    data: githubRepos, 
    loading: reposLoading, 
    error: reposError,
    refresh: refreshRepos
  } = useSecureGitHubRepositories({ 
    autoFetch: true,
    page: 1,
    perPage: 10
  });

  const { 
    data: userStats, 
    loading: statsLoading, 
    error: statsError,
    refresh: refreshStats
  } = useSecureUserStats({ 
    autoFetch: true
  });

  const loading = reposLoading || statsLoading;
  const error = reposError || statsError;

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      await Promise.all([refreshRepos(), refreshStats()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate top languages
  const topLanguages = React.useMemo(() => {
    if (!userStats?.languages) return [];
    return Object.entries(userStats.languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  }, [userStats]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-card border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {user.avatarUrl && (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name || user.username}
                  className="w-10 h-10 rounded-full border-2 border-primary/20"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {user.name || user.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Developer Dashboard
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Repos</p>
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.totalRepos || user.publicRepos || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Code className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stars</p>
                  <p className="text-2xl font-bold text-primary">
                    {userStats?.totalStars || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Languages</p>
                  <p className="text-2xl font-bold text-primary">
                    {topLanguages.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Primary</p>
                  <p className="text-lg font-bold text-primary">
                    {topLanguages[0]?.[0] || 'None'}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Repository List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Repositories
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href={`https://github.com/${user.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      Try Again
                    </Button>
                  </div>
                ) : githubRepos && githubRepos.length > 0 ? (
                  <div className="space-y-4">
                    {githubRepos.map((repo) => (
                      <div key={repo.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">
                              {repo.name}
                            </h4>
                            {repo.language && (
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {repo.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              {repo.forks_count}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No repositories found</p>
                    <Button variant="outline" asChild>
                      <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                        Create Repository
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Language Distribution */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Language Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topLanguages.length > 0 ? (
                  <div className="space-y-4">
                    {topLanguages.map(([language, count], index) => (
                      <div key={language} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-chart-1' :
                            index === 1 ? 'bg-chart-2' : 'bg-chart-3'
                          }`} />
                          <span className="text-sm font-medium">{language}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} repos
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No language data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
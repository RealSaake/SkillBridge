import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics, usePageView } from '../hooks/useAnalytics';
import { useTheme } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GitHubConnectionRequired } from './GitHubConnectionRequired';
import { DashboardErrorBoundary } from './ErrorBoundary';
import { GitHubApiErrorBoundary } from './ApiErrorBoundary';
import GitHubDataDisplay from './GitHubDataDisplay';
import { useSecureGitHubRepositories, useSecureUserStats, useSessionValidation } from '../hooks/useSecureData';
import { useCareerInsights } from '../hooks/useCareerInsights';
import { AhaMomentCard } from './AhaMomentCard';
import GrowthDashboard from './GrowthDashboard';
import {
  logUserAction,
  logInfo,
  logError,
  generateTraceId
} from '../utils/logger';
import {
  TrendingUp,
  Star,
  GitFork,
  Code,
  Calendar,
  Target,
  Award,
  BookOpen,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Trophy,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  LogOut,
  Share2,
  Eye
} from 'lucide-react';

// Using GitHubRepository type from userDataIsolation

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { trackEvent } = useAnalytics();
  
  // Track page view
  usePageView('dashboard', { 
    hasProfile: !!user?.profile,
    profileComplete: !!user?.profile?.targetRole 
  });
  const { theme, toggleTheme } = useTheme();
  const traceId = generateTraceId();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'growth' | 'roadmap' | 'insights'>('overview');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use secure data hooks with proper isolation
  const { 
    data: githubRepos, 
    loading: reposLoading, 
    error: reposError,
    refresh: refreshRepos
  } = useSecureGitHubRepositories({ 
    autoFetch: true,
    page: 1,
    perPage: 20
  });

  const { 
    data: userStats, 
    loading: statsLoading, 
    error: statsError,
    refresh: refreshStats
  } = useSecureUserStats({ 
    autoFetch: true,
    refreshInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  // Get career insights
  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    fetchInsights
  } = useCareerInsights();

  // Validate session integrity
  const { isValid: sessionValid } = useSessionValidation();

  const loading = reposLoading || statsLoading;
  const error = reposError || statsError;

  const handleLogout = async () => {
    try {
      logUserAction('dashboard_logout', {
        userId: user?.id,
        traceId
      });
      
      await logout();
      
      logInfo('User logged out successfully from dashboard', {
        userId: user?.id,
        traceId
      }, 'Dashboard');
    } catch (error) {
      logError('Dashboard logout error', error as Error, {
        userId: user?.id,
        traceId
      }, 'Dashboard');
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      logUserAction('dashboard_refresh', {
        userId: user?.id,
        traceId
      });
      
      await Promise.all([
        refreshRepos(), 
        refreshStats(),
        fetchInsights()
      ]);
      
      logInfo('Dashboard data refreshed successfully', {
        userId: user?.id,
        traceId
      }, 'Dashboard');
    } catch (error) {
      logError('Dashboard refresh error', error as Error, {
        userId: user?.id,
        traceId
      }, 'Dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate dashboard metrics
  const dashboardMetrics = React.useMemo(() => {
    if (!userStats || !githubRepos) return null;

    const topLanguages = Object.entries(userStats.languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const recentActivity = githubRepos
      .filter(repo => {
        const lastUpdate = new Date(repo.updated_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastUpdate > thirtyDaysAgo;
      }).length;

    const averageStars = userStats.totalRepos > 0 ? userStats.totalStars / userStats.totalRepos : 0;
    const skillLevel = averageStars > 10 ? 'Advanced' :
                      averageStars > 5 ? 'Intermediate' : 'Beginner';

    return {
      topLanguages,
      recentActivity,
      skillLevel,
      totalContributions: userStats.totalRepos + userStats.totalStars + userStats.totalForks,
      growthRate: recentActivity > 0 ? '+' + Math.round((recentActivity / userStats.totalRepos) * 100) + '%' : '0%'
    };
  }, [userStats, githubRepos]);

  if (!user) {
    return null; // This should be handled by ProtectedRoute
  }

  // If session is invalid, show connection required screen
  if (!sessionValid) {
    return <GitHubConnectionRequired error="Session security check failed. Please reconnect your account." />;
  }

  // If user doesn't have GitHub data, show connection required screen
  if (!user.username || !user.avatarUrl) {
    return <GitHubConnectionRequired error="GitHub profile data is missing. Please reconnect your account." />;
  }

  const targetRole = user.profile?.targetRole || 'Not set';
  const currentRole = user.profile?.currentRole || 'Not specified';

  return (
    <DashboardErrorBoundary>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Modern Header */}
        <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95`}>
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {user.avatarUrl && (
                  <div className="relative">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name || user.username}
                      className="w-12 h-12 rounded-full border-2 border-purple-200 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold">
                    {user.name || user.username}
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {targetRole !== 'Not set' 
                      ? `${targetRole.replace('-', ' ')} Developer`
                      : 'Complete profile for personalized insights'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="ghost"
                  size="sm"
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Syncing...' : 'Refresh'}
                </Button>
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  size="sm"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </Button>
                <div className="relative">
                  <Button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    variant="ghost"
                    size="sm"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  
                  {showSettingsMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSettingsMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate('/settings/profile');
                              setShowSettingsMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Profile Settings
                          </button>
                          <button
                            onClick={() => {
                              const profileUrl = `${window.location.origin}/profile/${user?.username}`;
                              window.open(profileUrl, '_blank');
                              setShowSettingsMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            View Public Profile
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/profile/${user?.username}`);
                              setShowSettingsMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Share2 className="w-4 h-4 mr-3" />
                            Share Profile
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowSettingsMenu(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-7xl" role="main">
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: PieChart },
                { id: 'growth', label: 'Growth', icon: Activity },
                { id: 'roadmap', label: 'Roadmap', icon: Target },
                { id: 'insights', label: 'AI Insights', icon: Zap }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Setup Reminder */}
              {!user.profile?.targetRole && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                          🚀 Complete Your Career Profile
                        </h3>
                        <p className="text-purple-700 dark:text-purple-300 mb-4">
                          Take our 2-minute quiz to unlock personalized learning roadmaps, skill analysis, and career insights powered by AI.
                        </p>
                        <Button 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          onClick={() => window.location.href = '/onboarding'}
                        >
                          Start Career Quiz
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Repositories</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {userStats?.totalRepos || user.publicRepos || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dashboardMetrics?.growthRate} this month
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stars</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {userStats?.totalStars || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Avg {userStats && userStats.totalRepos > 0 ? (userStats.totalStars / userStats.totalRepos).toFixed(1) : 0} per repo
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Languages</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {dashboardMetrics?.topLanguages?.length || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dashboardMetrics?.topLanguages?.[0]?.[0] || 'None'} most used
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Skill Level</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {dashboardMetrics?.skillLevel || 'Beginner'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Based on activity
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`https://github.com/${user.username}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          <span className="ml-3">Loading repositories...</span>
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <p className="text-red-600 mb-4">{error}</p>
                          <Button variant="outline" size="sm" onClick={handleRefresh}>
                            Try Again
                          </Button>
                        </div>
                      ) : githubRepos && githubRepos.length > 0 ? (
                        <div className="space-y-4">
                          {githubRepos.slice(0, 6).map((repo) => (
                            <div key={repo.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {repo.name}
                                  </h4>
                                  {repo.language && (
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                      {repo.language}
                                    </span>
                                  )}
                                  {repo.private && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                      Private
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                  {repo.description || 'No description available'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {repo.stargazers_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GitFork className="w-3 h-3" />
                                    {repo.forks_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
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
                          <Button variant="outline" className="w-full" asChild>
                            <a href={`https://github.com/${user.username}?tab=repositories`} target="_blank" rel="noopener noreferrer">
                              View All Repositories
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 mb-4">No repositories found</p>
                          <Button variant="outline" asChild>
                            <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                              Create Your First Repository
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* AI Insights Card */}
                  {user.profile?.targetRole && user.profile?.currentRole && (
                    <div className="mb-6">
                      <AhaMomentCard 
                        quizData={{
                          currentRole: user.profile.currentRole,
                          experienceLevel: user.profile.experienceLevel || 'intermediate',
                          targetRole: user.profile.targetRole,
                          primaryGoals: user.profile.careerGoals || [],
                          techStack: user.profile.techStack || [],
                          learningStyle: user.profile.learningStyle || 'mixed',
                          timeCommitment: user.profile.timeCommitment || '5-10 hours'
                        }}
                        onContinue={() => navigate('/dashboard')}
                      />
                    </div>
                  )}

                  {/* Top Languages */}
                  {dashboardMetrics?.topLanguages && dashboardMetrics.topLanguages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="w-5 h-5" />
                          Top Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dashboardMetrics.topLanguages.map(([language, count], index) => (
                            <div key={language} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  index === 0 ? 'bg-blue-500' :
                                  index === 1 ? 'bg-green-500' :
                                  index === 2 ? 'bg-yellow-500' :
                                  index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                                }`} />
                                <span className="text-sm font-medium">{language}</span>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {count} repos
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!user.profile?.targetRole ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => window.location.href = '/onboarding'}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Complete Profile
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" className="w-full justify-start">
                            <BookOpen className="w-4 h-4 mr-2" />
                            View Learning Path
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Award className="w-4 h-4 mr-2" />
                            Skill Assessment
                          </Button>
                        </>
                      )}
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={`https://github.com/${user.username}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          GitHub Profile
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Career Progress */}
                  {user.profile?.targetRole && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Career Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Current Level</span>
                            <span className="capitalize px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                              {user.profile?.experienceLevel || 'Beginner'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Target Role</span>
                            <span className="capitalize px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                              {targetRole.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Skills</span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                              {user.skills?.length || 0} identified
                            </span>
                          </div>
                          <div className="pt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(((user.skills?.length || 0) / 10) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              Profile {Math.min(((user.skills?.length || 0) / 10) * 100, 100).toFixed(0)}% complete
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    GitHub Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardErrorBoundary>
                    <GitHubApiErrorBoundary>
                      <GitHubDataDisplay 
                        showProfile={true}
                        showRepositories={true}
                        showStats={true}
                        maxRepositories={20}
                        enableAutoRefresh={true}
                        refreshInterval={5 * 60 * 1000}
                      />
                    </GitHubApiErrorBoundary>
                  </DashboardErrorBoundary>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Growth Tab */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              <GrowthDashboard />
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Learning Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.profile?.targetRole ? (
                    <div className="space-y-6">
                      <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <Target className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          {targetRole.replace('-', ' ')} Roadmap
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Personalized learning path based on your current skills and target role
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">Foundation</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Core concepts mastered</p>
                          </div>
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">In Progress</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Currently learning</p>
                          </div>
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">Next Steps</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming topics</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Create Your Learning Roadmap</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Complete your career profile to get a personalized learning roadmap
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => window.location.href = '/onboarding'}
                      >
                        Start Career Quiz
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {user.profile?.targetRole && user.profile?.currentRole ? (
                <AhaMomentCard 
                  quizData={{
                    currentRole: user.profile.currentRole,
                    experienceLevel: user.profile.experienceLevel || 'intermediate',
                    targetRole: user.profile.targetRole,
                    primaryGoals: user.profile.careerGoals || [],
                    techStack: user.profile.techStack || [],
                    learningStyle: user.profile.learningStyle || 'mixed',
                    timeCommitment: user.profile.timeCommitment || '5-10 hours'
                  }}
                  onContinue={() => navigate('/dashboard')}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Unlock AI Insights</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Complete your career profile to get personalized AI-powered insights about your development journey
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => window.location.href = '/onboarding'}
                      >
                        Start Career Quiz
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </DashboardErrorBoundary>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useViralMetrics, useAnalytics } from '../hooks/useAnalytics';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  Target, 
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award
} from 'lucide-react';

interface GrowthDashboardProps {
  className?: string;
}

const GrowthDashboard: React.FC<GrowthDashboardProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const { metrics, loading, error, refresh } = useViralMetrics(timeRange);
  const { trackEvent } = useAnalytics();

  const handleRefresh = async () => {
    await refresh();
    trackEvent('growth_dashboard_refresh', { timeRange });
  };

  const handleTimeRangeChange = (newRange: '24h' | '7d' | '30d') => {
    setTimeRange(newRange);
    trackEvent('growth_dashboard_time_range_change', { 
      oldRange: timeRange, 
      newRange 
    });
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Dashboard</h2>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Dashboard</h2>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Failed to load growth metrics</span>
            </div>
            <p className="text-red-500 dark:text-red-300 mt-2 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  const getViralCoefficientColor = (coefficient: number) => {
    if (coefficient >= 1.5) return 'text-green-600 dark:text-green-400';
    if (coefficient >= 1.2) return 'text-blue-600 dark:text-blue-400';
    if (coefficient >= 1.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getViralCoefficientStatus = (coefficient: number) => {
    if (coefficient >= 1.5) return 'Excellent';
    if (coefficient >= 1.2) return 'Good';
    if (coefficient >= 1.0) return 'Growing';
    return 'Needs Improvement';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track viral growth and user acquisition metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range === '24h' ? '24H' : range === '7d' ? '7D' : '30D'}
              </button>
            ))}
          </div>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +{metrics.newUsersThisWeek} this week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Viral Coefficient */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Viral Coefficient</p>
                <p className={`text-2xl font-bold ${getViralCoefficientColor(metrics.viralCoefficient)}`}>
                  {metrics.viralCoefficient.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getViralCoefficientStatus(metrics.viralCoefficient)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Views */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.profileViews.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {Math.round(metrics.profileViews / metrics.totalUsers)} avg per user
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Shares */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Shares</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.profileShares.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {Math.round((metrics.profileShares / metrics.profileViews) * 100)}% share rate
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Share2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate & Growth Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Conversion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {(metrics.conversionRate * 100).toFixed(1)}%
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Visitors who create profiles
              </p>
              
              {/* Conversion Rate Visualization */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(metrics.conversionRate * 100, 100)}%` }}
                />
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.conversionRate >= 0.25 ? 'Excellent conversion rate!' : 
                 metrics.conversionRate >= 0.15 ? 'Good conversion rate' : 
                 'Room for improvement'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Top Traffic Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topReferrers.map((referrer, index) => (
                <div key={referrer.source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-gold-100 text-gold-600' :
                      index === 1 ? 'bg-silver-100 text-silver-600' :
                      index === 2 ? 'bg-bronze-100 text-bronze-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {referrer.source}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {referrer.users} users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(referrer.conversionRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      conversion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Growth Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Viral Growth Status */}
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                metrics.viralCoefficient >= 1.2 ? 'bg-green-100 dark:bg-green-900/30' : 
                metrics.viralCoefficient >= 1.0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Award className={`w-8 h-8 ${
                  metrics.viralCoefficient >= 1.2 ? 'text-green-600 dark:text-green-400' : 
                  metrics.viralCoefficient >= 1.0 ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Viral Growth
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metrics.viralCoefficient >= 1.2 ? 
                  'Excellent! Each user brings 1.2+ new users' :
                  metrics.viralCoefficient >= 1.0 ?
                  'Growing! Close to viral threshold' :
                  'Focus on improving sharing and conversion'
                }
              </p>
            </div>

            {/* Daily Growth */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Daily Growth
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +{metrics.newUsersToday} new users today
                <br />
                {metrics.newUsersToday > 50 ? 'Strong growth!' : 'Steady progress'}
              </p>
            </div>

            {/* Sharing Performance */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <PieChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Sharing Rate
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((metrics.profileShares / metrics.profileViews) * 100)}% of profile views result in shares
                <br />
                {(metrics.profileShares / metrics.profileViews) > 0.15 ? 'Excellent sharing!' : 'Good engagement'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthDashboard;
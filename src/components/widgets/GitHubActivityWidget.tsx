import React, { useEffect, useState, useCallback } from 'react';
import { useWidgetState } from '../../hooks/useWidgetState';
import { ContributionGraph } from './github/ContributionGraph';
import { LanguageDistribution } from './github/LanguageDistribution';
import { RepositoryTimeline } from './github/RepositoryTimeline';
import { terminalLogger } from '../../utils/terminalLogger';

interface GitHubActivityWidgetProps {
  widgetId: string;
  username?: string;
  className?: string;
}

interface GitHubActivityData {
  contributions: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  languages: Array<{
    name: string;
    value: number;
    color: string;
    bytes: number;
    percentage: number;
    skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    trending?: 'up' | 'down' | 'stable';
  }>;
  timeline: Array<{
    id: string;
    type: 'commit' | 'pull_request' | 'release' | 'issue' | 'fork' | 'star';
    repository: string;
    title: string;
    description?: string;
    date: string;
    url: string;
    author: string;
    metadata?: {
      additions?: number;
      deletions?: number;
      files_changed?: number;
      language?: string;
      stars?: number;
      forks?: number;
    };
  }>;
  profile: {
    username: string;
    name: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  stats: {
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalStars: number;
    currentStreak: number;
    longestStreak: number;
  };
}

type ViewMode = 'overview' | 'contributions' | 'languages' | 'timeline';

export const GitHubActivityWidget: React.FC<GitHubActivityWidgetProps> = ({
  widgetId,
  username,
  className = ''
}) => {
  const { isLoading, error, data, updateData } = useWidgetState(widgetId);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [githubData, setGithubData] = useState<GitHubActivityData | null>(null);

  const fetchGitHubData = useCallback(async (forceRefresh = false) => {
    if (!username) {
      terminalLogger.warn('GitHubActivityWidget', 'No username provided', { widgetId });
      return;
    }

    try {
      terminalLogger.info('GitHubActivityWidget', 'Fetching GitHub data', {
        widgetId,
        username,
        forceRefresh
      });

      // Simulate API calls - in real implementation, these would call MCP servers
      const mockData: GitHubActivityData = {
        contributions: generateMockContributions(),
        languages: generateMockLanguages(),
        timeline: generateMockTimeline(),
        profile: {
          username: username,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          avatar_url: `https://github.com/${username}.png`,
          public_repos: 42,
          followers: 128,
          following: 89
        },
        stats: {
          totalCommits: 1247,
          totalPRs: 89,
          totalIssues: 156,
          totalStars: 234,
          currentStreak: 12,
          longestStreak: 45
        }
      };

      setGithubData(mockData);
      updateData(mockData);

      terminalLogger.info('GitHubActivityWidget', 'GitHub data fetched successfully', {
        widgetId,
        username,
        contributionsCount: mockData.contributions.length,
        languagesCount: mockData.languages.length,
        timelineCount: mockData.timeline.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch GitHub data';
      terminalLogger.error('GitHubActivityWidget', 'Failed to fetch GitHub data', {
        widgetId,
        username,
        error: errorMessage
      });
      throw error;
    }
  }, [username, widgetId, updateData]);

  useEffect(() => {
    if (username && !githubData) {
      fetchGitHubData();
    }
  }, [username, githubData, fetchGitHubData]);

  const handleRefresh = useCallback(() => {
    terminalLogger.info('GitHubActivityWidget', 'Manual refresh triggered', { widgetId });
    fetchGitHubData(true);
  }, [fetchGitHubData, widgetId]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    terminalLogger.info('GitHubActivityWidget', 'View mode changed', {
      widgetId,
      previousMode: viewMode,
      newMode: mode
    });
  }, [viewMode, widgetId]);

  if (error) {
    return (
      <div className={`github-activity-widget ${className} p-4`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm font-medium">Failed to load GitHub data</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !githubData) {
    return (
      <div className={`github-activity-widget ${className} p-4`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`github-activity-widget ${className} bg-white rounded-lg border border-gray-200 shadow-sm`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={githubData.profile.avatar_url}
              alt={githubData.profile.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {githubData.profile.name}
              </h3>
              <div className="text-sm text-gray-500">
                @{githubData.profile.username} • {githubData.profile.public_repos} repos
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Refresh data"
          >
            🔄
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'contributions', label: 'Contributions', icon: '📈' },
            { key: 'languages', label: 'Languages', icon: '💻' },
            { key: 'timeline', label: 'Timeline', icon: '📅' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleViewModeChange(key as ViewMode)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                viewMode === key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{githubData.stats.totalCommits}</div>
                <div className="text-xs text-gray-500">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{githubData.stats.totalPRs}</div>
                <div className="text-xs text-gray-500">Pull Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{githubData.stats.currentStreak}</div>
                <div className="text-xs text-gray-500">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{githubData.stats.totalStars}</div>
                <div className="text-xs text-gray-500">Stars Earned</div>
              </div>
            </div>

            {/* Mini Contribution Graph */}
            <div className="h-32">
              <ContributionGraph
                data={githubData.contributions.slice(-365)} // Last year
                width={600}
                height={120}
              />
            </div>

            {/* Top Languages Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Top Languages</h5>
                <div className="space-y-1">
                  {githubData.languages.slice(0, 3).map((lang, index) => (
                    <div key={lang.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: lang.color }}
                        />
                        <span>{lang.name}</span>
                      </div>
                      <span className="text-gray-500">{lang.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h5>
                <div className="space-y-1">
                  {githubData.timeline.slice(0, 3).map((event) => (
                    <div key={event.id} className="text-sm text-gray-600">
                      <span className="font-medium">{event.type.replace('_', ' ')}</span> in{' '}
                      <span className="text-gray-900">{event.repository}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'contributions' && (
          <ContributionGraph
            data={githubData.contributions}
            width={700}
            height={180}
          />
        )}

        {viewMode === 'languages' && (
          <LanguageDistribution
            data={githubData.languages}
            width={400}
            height={300}
            showSkillLevels={true}
            showTrending={true}
          />
        )}

        {viewMode === 'timeline' && (
          <RepositoryTimeline
            events={githubData.timeline}
            maxEvents={20}
            showFilters={true}
          />
        )}
      </div>
    </div>
  );
};

// Mock data generators for development
function generateMockContributions() {
  const contributions = [];
  const today = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const count = Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0;
    contributions.push({
      date: date.toISOString().split('T')[0],
      count,
      level: count === 0 ? 0 : Math.min(Math.floor(count / 2) + 1, 4)
    });
  }
  
  return contributions;
}

function generateMockLanguages() {
  return [
    { name: 'TypeScript', value: 45000, color: '#2b7489', bytes: 45000, percentage: 35.2, skillLevel: 'Expert' as const, trending: 'up' as const },
    { name: 'JavaScript', value: 38000, color: '#f1e05a', bytes: 38000, percentage: 29.7, skillLevel: 'Expert' as const, trending: 'stable' as const },
    { name: 'Python', value: 25000, color: '#3572A5', bytes: 25000, percentage: 19.5, skillLevel: 'Advanced' as const, trending: 'up' as const },
    { name: 'CSS', value: 12000, color: '#1572B6', bytes: 12000, percentage: 9.4, skillLevel: 'Intermediate' as const, trending: 'stable' as const },
    { name: 'HTML', value: 8000, color: '#e34c26', bytes: 8000, percentage: 6.2, skillLevel: 'Advanced' as const, trending: 'down' as const }
  ];
}

function generateMockTimeline() {
  const events = [];
  const repos = ['skillbridge', 'portfolio-site', 'api-server', 'mobile-app'];
  const types = ['commit', 'pull_request', 'release', 'issue'] as const;
  
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const type = types[Math.floor(Math.random() * types.length)];
    const repo = repos[Math.floor(Math.random() * repos.length)];
    
    events.push({
      id: `event-${i}`,
      type,
      repository: repo,
      title: `${type === 'commit' ? 'Updated' : type === 'pull_request' ? 'Merged' : 'Created'} ${repo} feature`,
      description: `Sample ${type} description for ${repo}`,
      date: date.toISOString(),
      url: `https://github.com/user/${repo}`,
      author: 'user',
      metadata: {
        additions: Math.floor(Math.random() * 100),
        deletions: Math.floor(Math.random() * 50),
        files_changed: Math.floor(Math.random() * 10) + 1,
        language: 'TypeScript'
      }
    });
  }
  
  return events;
}
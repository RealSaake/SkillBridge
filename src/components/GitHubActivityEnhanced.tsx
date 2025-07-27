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
import { usePersonalizedGitHubAnalysis } from '../hooks/usePersonalizedMCP';
import { useAuth } from '../contexts/AuthContext';

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

    const { user } = useAuth();

    // 🔌 Enhanced MCP data hooks with user context
    const {
        data: personalizedAnalysis,
        loading: personalizedLoading,
        error: personalizedError,
        refetch: refetchPersonalized
    } = usePersonalizedGitHubAnalysis(username);

    // Fallback to original hooks for compatibility
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

    // Use personalized data if available, otherwise fallback to original
    const finalActivityData = personalizedAnalysis?.activity || activityData;
    const finalReposData = personalizedAnalysis?.repositories || reposData;
    const personalizedInsights = personalizedAnalysis?.personalizedInsights;

    const isLoading = personalizedLoading || activityLoading || reposLoading;
    const hasError = personalizedError || activityError || reposError;

    // Language distribution calculation
    const getLanguageDistribution = () => {
        if (!finalReposData) return [];

        const languageCount: Record<string, number> = {};
        let totalRepos = 0;

        finalReposData.forEach((repo: any) => {
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
        if (!finalReposData) return [];

        return finalReposData
            .filter((repo: any) => !repo.fork) // Exclude forks
            .sort((a: any, b: any) => (b.stargazers_count || b.stars || 0) - (a.stargazers_count || a.stars || 0))
            .slice(0, 3)
            .map((repo: any) => ({
                name: repo.name,
                language: repo.language,
                stars: repo.stargazers_count || repo.stars || 0,
                lastCommit: repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'Unknown',
                description: repo.description
            }));
    };

    const handleRefresh = () => {
        refetchPersonalized();
        refetchActivity();
    };

    return (
        <Card className={`transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                    {!isLoading && !hasError && finalActivityData && (
                        <>
                            {/* Personalized Insights Banner */}
                            {personalizedInsights && user && (
                                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-blue-600 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Personalized for {user.name || user.username}</span>
                                    </div>
                                    <p className="text-sm mb-2">{personalizedInsights.roleAlignment}</p>
                                    <p className="text-xs text-gray-600">{personalizedInsights.experienceMatch}</p>
                                    
                                    {personalizedInsights.skillGaps && personalizedInsights.skillGaps.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium mb-1">Skills to explore:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {personalizedInsights.skillGaps.slice(0, 3).map((skill: string) => (
                                                    <Badge key={skill} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-2">
                                        <GitCommit className="w-4 h-4 text-green-500" />
                                        <span className="text-sm">Total Stars</span>
                                    </div>
                                    <p className="text-2xl mt-1">{finalActivityData.activity?.totalStars || 0}</p>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Across all repositories
                                    </p>
                                </div>

                                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-2">
                                        <GitPullRequest className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm">Active Repos</span>
                                    </div>
                                    <p className="text-2xl mt-1">{finalActivityData.activity?.recentlyActiveRepos || 0}</p>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Recently updated
                                    </p>
                                </div>
                            </div>

                            {/* Profile Insights */}
                            {finalActivityData.insights && (
                                <div className={`p-4 rounded-lg border-l-4 ${finalActivityData.insights.roleAlignment >= 80
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : finalActivityData.insights.roleAlignment >= 60
                                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm">Role Alignment ({targetRole})</h4>
                                        <span className="text-lg font-semibold">
                                            {finalActivityData.insights.roleAlignment}%
                                        </span>
                                    </div>
                                    <Progress value={finalActivityData.insights.roleAlignment} className="h-2 mb-2" />
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Experience: {finalActivityData.insights.experienceLevel}</span>
                                        <span>Activity: {finalActivityData.insights.activityLevel}</span>
                                    </div>
                                </div>
                            )}

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
                                            <div key={repo.name} className={`p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
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
                            {finalActivityData.activity?.contributionStreak > 0 && (
                                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'border-green-600 bg-green-900/20' : 'border-green-200 bg-green-50'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm">
                                            🔥 {finalActivityData.activity.contributionStreak} day contribution streak!
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Personalized Recommendations */}
                            {personalizedInsights?.recommendations && personalizedInsights.recommendations.length > 0 && (
                                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-purple-600 bg-purple-900/20' : 'border-purple-200 bg-purple-50'}`}>
                                    <h4 className="text-sm font-medium mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                        Personalized Recommendations
                                    </h4>
                                    <div className="space-y-2">
                                        {personalizedInsights.recommendations.slice(0, 3).map((rec: string, index: number) => (
                                            <div key={index} className="flex items-start space-x-2">
                                                <div className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs">{rec}</p>
                                            </div>
                                        ))}
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
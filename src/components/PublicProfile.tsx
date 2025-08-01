import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Linkedin, 
  Star, 
  GitFork, 
  Calendar,
  TrendingUp,
  Award,
  Share2,
  ExternalLink,
  Code,
  BookOpen,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { logUserAction, logError } from '../utils/logger';

interface PublicProfileData {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  avatarUrl?: string;
  publicRepos: number;
  followers: number;
  following: number;
  githubCreatedAt: string;
  
  // Profile data
  currentRole?: string;
  targetRole?: string;
  experienceLevel?: string;
  careerGoals: string[];
  techStack: string[];
  
  // Skills data
  topSkills: Array<{
    name: string;
    proficiency: number;
    verified: boolean;
  }>;
  
  // GitHub insights
  topLanguages: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  
  // Featured repositories
  featuredRepos: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    url: string;
    topics: string[];
  }>;
  
  // Career insights
  careerInsights: Array<{
    title: string;
    description: string;
    category: 'skill' | 'growth' | 'opportunity';
  }>;
  
  // Profile settings
  isPublic: boolean;
  showEmail: boolean;
  showLocation: boolean;
  showCompany: boolean;
  showGitHubStats: boolean;
  showSkills: boolean;
  showRepositories: boolean;
  showCareerGoals: boolean;
  
  // Analytics
  profileViews: number;
  lastUpdated: string;
}

interface PublicProfileProps {
  username?: string; // If provided, fetch by username; otherwise use URL params
  embedded?: boolean; // For embedding in other pages
  compact?: boolean; // Compact view for previews
}

const PublicProfile: React.FC<PublicProfileProps> = ({ 
  username: propUsername, 
  embedded = false, 
  compact = false 
}) => {
  const { username: urlUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const username = propUsername || urlUsername;
  
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  
  const traceId = React.useMemo(() => 
    `public-profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  useEffect(() => {
    if (username) {
      fetchPublicProfile(username);
    }
  }, [username]);

  const fetchPublicProfile = async (profileUsername: string) => {
    try {
      setLoading(true);
      setError(null);
      
      logUserAction('public_profile_view', {
        username: profileUsername,
        traceId,
        embedded,
        compact
      });

      // In a real implementation, this would call your API
      // For now, we'll simulate the API call
      const response = await fetch(`/api/public-profiles/${profileUsername}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found or not public');
        }
        throw new Error('Failed to load profile');
      }
      
      const data = await response.json();
      setProfileData(data);
      
      // Track profile view analytics
      await trackProfileView(profileUsername);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logError('Failed to fetch public profile', err as Error, {
        username: profileUsername,
        traceId
      }, 'PublicProfile');
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (profileUsername: string) => {
    try {
      await fetch('/api/analytics/profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileUsername,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          userAgent: navigator.userAgent
        })
      });
    } catch (err) {
      // Analytics failure shouldn't break the page
      console.warn('Failed to track profile view:', err);
    }
  };

  const handleShare = async () => {
    if (!profileData) return;
    
    setSharing(true);
    try {
      const shareData = {
        title: `${profileData.name || profileData.username}'s Developer Profile`,
        text: `Check out ${profileData.name || profileData.username}'s skills and projects on SkillBridge`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        logUserAction('profile_shared_native', { username: profileData.username, traceId });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        logUserAction('profile_shared_clipboard', { username: profileData.username, traceId });
        // You could show a toast notification here
      }
    } catch (err) {
      logError('Failed to share profile', err as Error, {
        username: profileData.username,
        traceId
      }, 'PublicProfile');
    } finally {
      setSharing(false);
    }
  };

  const getExperienceLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'expert': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33'
    };
    return colors[language] || '#6b7280';
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'}`}>
        <div className={`${compact ? '' : 'max-w-6xl mx-auto px-4'}`}>
          <div className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-300 rounded w-48"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'}`}>
        <div className={`${compact ? '' : 'max-w-6xl mx-auto px-4'}`}>
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              {!embedded && (
                <Button onClick={() => navigate('/')} variant="outline">
                  Back to Home
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className={`${compact ? 'space-y-4' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'}`}>
      <div className={`${compact ? '' : 'max-w-6xl mx-auto px-4'}`}>
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <img
                  src={profileData.avatarUrl}
                  alt={`${profileData.username}'s avatar`}
                  className="w-20 h-20 rounded-full border-4 border-purple-200 dark:border-purple-800"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profileData.name || profileData.username}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    @{profileData.username}
                  </p>
                  {profileData.currentRole && (
                    <p className="text-purple-600 dark:text-purple-400 font-medium">
                      {profileData.currentRole}
                    </p>
                  )}
                </div>
              </div>
              
              {!embedded && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleShare}
                    disabled={sharing}
                    variant="outline"
                    size="sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {sharing ? 'Sharing...' : 'Share'}
                  </Button>
                  <Button
                    onClick={() => window.open(`https://github.com/${profileData.username}`, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              )}
            </div>

            {profileData.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">
                {profileData.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {profileData.showLocation && profileData.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profileData.location}</span>
                </div>
              )}
              {profileData.showCompany && profileData.company && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{profileData.company}</span>
                </div>
              )}
              {profileData.blog && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="w-4 h-4" />
                  <a 
                    href={profileData.blog} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {profileData.blog}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profileData.githubCreatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Experience Level and Target Role */}
            <div className="flex flex-wrap gap-2 mt-4">
              {profileData.experienceLevel && (
                <Badge className={getExperienceLevelColor(profileData.experienceLevel)}>
                  {profileData.experienceLevel}
                </Badge>
              )}
              {profileData.targetRole && (
                <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                  <Target className="w-3 h-3 mr-1" />
                  Target: {profileData.targetRole}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* GitHub Stats */}
            {profileData.showGitHubStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Github className="w-5 h-5" />
                    <span>GitHub Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {profileData.publicRepos}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profileData.followers}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {profileData.following}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                    </div>
                  </div>

                  {/* Top Languages */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Languages</h4>
                    <div className="space-y-2">
                      {profileData.topLanguages.slice(0, 5).map((lang) => (
                        <div key={lang.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getLanguageColor(lang.name) }}
                            />
                            <span className="text-sm font-medium">{lang.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {lang.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Repositories */}
            {profileData.showRepositories && profileData.featuredRepos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>Featured Projects</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.featuredRepos.slice(0, compact ? 2 : 6).map((repo) => (
                      <div key={repo.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                                {repo.name}
                              </a>
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {repo.description}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            {repo.language && (
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                                />
                                <span>{repo.language}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>{repo.stars}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GitFork className="w-3 h-3" />
                              <span>{repo.forks}</span>
                            </div>
                          </div>
                        </div>
                        
                        {repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {repo.topics.slice(0, 5).map((topic) => (
                              <Badge key={topic} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skills */}
            {profileData.showSkills && profileData.topSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Top Skills</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profileData.topSkills.slice(0, compact ? 5 : 10).map((skill) => (
                      <div key={skill.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{skill.name}</span>
                          {skill.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${skill.proficiency * 10}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-6">
                            {skill.proficiency}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Career Goals */}
            {profileData.showCareerGoals && profileData.careerGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Career Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profileData.careerGoals.map((goal, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tech Stack */}
            {profileData.techStack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Tech Stack</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profileData.techStack.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Career Insights */}
            {profileData.careerInsights.length > 0 && !compact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Career Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profileData.careerInsights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-3">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        {!embedded && (
          <div className="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your own developer profile
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Get Started with SkillBridge
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
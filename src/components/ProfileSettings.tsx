import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Share2, 
  Copy, 
  ExternalLink,
  Save,
  RefreshCw,
  Globe,
  Lock,
  User,
  Github,
  Award,
  Target,
  MapPin,
  Building,
  Link as LinkIcon,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { logUserAction, logError } from '../utils/logger';

interface ProfileVisibilitySettings {
  isPublic: boolean;
  showEmail: boolean;
  showLocation: boolean;
  showCompany: boolean;
  showGitHubStats: boolean;
  showSkills: boolean;
  showRepositories: boolean;
  showCareerGoals: boolean;
  showBio: boolean;
  showTechStack: boolean;
  showCareerInsights: boolean;
}

interface ProfileCustomization {
  customBio?: string;
  customTitle?: string;
  featuredRepos: string[]; // Repository names to feature
  customUrl?: string; // Custom URL slug
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState<ProfileVisibilitySettings>({
    isPublic: false,
    showEmail: false,
    showLocation: true,
    showCompany: true,
    showGitHubStats: true,
    showSkills: true,
    showRepositories: true,
    showCareerGoals: true,
    showBio: true,
    showTechStack: true,
    showCareerInsights: true
  });
  
  const [customization, setCustomization] = useState<ProfileCustomization>({
    featuredRepos: [],
    socialLinks: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<Array<{
    name: string;
    description: string;
    stars: number;
    language: string;
  }>>([]);
  
  const traceId = React.useMemo(() => 
    `profile-settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  useEffect(() => {
    loadProfileSettings();
    loadAvailableRepos();
  }, []);

  const loadProfileSettings = async () => {
    try {
      setLoading(true);
      
      // Load existing settings from API
      const response = await fetch('/api/profile/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.visibility || settings);
        setCustomization(data.customization || customization);
      }
    } catch (error) {
      logError('Failed to load profile settings', error as Error, {
        userId: user?.id,
        traceId
      }, 'ProfileSettings');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRepos = async () => {
    try {
      // Load user's repositories for featuring
      const response = await fetch('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const repos = await response.json();
        setAvailableRepos(repos.slice(0, 20)); // Top 20 repos
      }
    } catch (error) {
      console.warn('Failed to load repositories:', error);
    }
  };

  const handleSettingChange = (key: keyof ProfileVisibilitySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomizationChange = (key: keyof ProfileCustomization, value: any) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const toggleFeaturedRepo = (repoName: string) => {
    setCustomization(prev => ({
      ...prev,
      featuredRepos: prev.featuredRepos.includes(repoName)
        ? prev.featuredRepos.filter(name => name !== repoName)
        : [...prev.featuredRepos, repoName].slice(0, 6) // Max 6 featured repos
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const payload = {
        visibility: settings,
        customization: customization
      };
      
      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      logUserAction('profile_settings_saved', {
        userId: user?.id,
        isPublic: settings.isPublic,
        visibleSections: Object.entries(settings).filter(([_, value]) => value).length,
        traceId
      });
      
      // Show success message (you could use a toast here)
      console.log('Settings saved successfully');
      
    } catch (error) {
      logError('Failed to save profile settings', error as Error, {
        userId: user?.id,
        traceId
      }, 'ProfileSettings');
    } finally {
      setSaving(false);
    }
  };

  const copyProfileUrl = async () => {
    const profileUrl = `${window.location.origin}/profile/${user?.username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      logUserAction('profile_url_copied', {
        userId: user?.id,
        traceId
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const openProfilePreview = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.username}`;
    window.open(profileUrl, '_blank');
    
    logUserAction('profile_preview_opened', {
      userId: user?.id,
      traceId
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-48 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/profile/${user?.username}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control what others can see on your public profile
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={openProfilePreview}
            variant="outline"
            disabled={!settings.isPublic}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Public Profile Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Public Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Make profile public
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow others to view your profile and share it on social media
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => handleSettingChange('isPublic', checked)}
            />
          </div>
          
          {settings.isPublic && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Your profile is public
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                    {profileUrl}
                  </p>
                </div>
                <Button
                  onClick={copyProfileUrl}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy URL'}
                </Button>
              </div>
            </div>
          )}
          
          {!settings.isPublic && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Your profile is private</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Customization */}
      {settings.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Customization</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Title
              </label>
              <Input
                placeholder="e.g., Full Stack Developer, Data Scientist"
                value={customization.customTitle || ''}
                onChange={(e) => handleCustomizationChange('customTitle', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Bio
              </label>
              <Textarea
                placeholder="Tell visitors about yourself, your interests, and what you're working on..."
                value={customization.customBio || ''}
                onChange={(e) => handleCustomizationChange('customBio', e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom URL Slug
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">skillbridge.dev/</span>
                <Input
                  placeholder={user?.username}
                  value={customization.customUrl || ''}
                  onChange={(e) => handleCustomizationChange('customUrl', e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use your username
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {settings.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LinkIcon className="w-5 h-5" />
              <span>Social Links</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LinkedIn
              </label>
              <Input
                placeholder="https://linkedin.com/in/username"
                value={customization.socialLinks.linkedin || ''}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Twitter
              </label>
              <Input
                placeholder="https://twitter.com/username"
                value={customization.socialLinks.twitter || ''}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Website
              </label>
              <Input
                placeholder="https://yourwebsite.com"
                value={customization.socialLinks.website || ''}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Repositories */}
      {settings.isPublic && settings.showRepositories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>Featured Repositories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select up to 6 repositories to feature on your public profile
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRepos.map((repo) => (
                <div
                  key={repo.name}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    customization.featuredRepos.includes(repo.name)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleFeaturedRepo(repo.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                        {repo.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        {repo.language && (
                          <span>{repo.language}</span>
                        )}
                        <span>⭐ {repo.stars}</span>
                      </div>
                    </div>
                    {customization.featuredRepos.includes(repo.name) && (
                      <Badge variant="secondary" className="ml-2">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Selected: {customization.featuredRepos.length}/6
            </p>
          </CardContent>
        </Card>
      )}

      {/* Visibility Settings */}
      {settings.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Visibility Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'showBio', label: 'Bio and Description', icon: User },
                { key: 'showLocation', label: 'Location', icon: MapPin },
                { key: 'showCompany', label: 'Company', icon: Building },
                { key: 'showGitHubStats', label: 'GitHub Statistics', icon: Github },
                { key: 'showSkills', label: 'Skills and Proficiency', icon: Award },
                { key: 'showRepositories', label: 'Featured Repositories', icon: Github },
                { key: 'showCareerGoals', label: 'Career Goals', icon: Target },
                { key: 'showTechStack', label: 'Tech Stack', icon: Settings },
                { key: 'showCareerInsights', label: 'Career Insights', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <Switch
                    checked={settings[key as keyof ProfileVisibilitySettings]}
                    onCheckedChange={(checked) => 
                      handleSettingChange(key as keyof ProfileVisibilitySettings, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Analytics Preview */}
      {settings.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Profile Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Profile Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Shares</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  0
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Clicks</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Analytics will appear once your profile is public and receiving views
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileSettings;
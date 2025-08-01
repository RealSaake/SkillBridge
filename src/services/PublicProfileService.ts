import { logError, logUserAction } from '../utils/logger';

export interface PublicProfileData {
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

export interface ProfileVisibilitySettings {
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

export interface ProfileCustomization {
  customBio?: string;
  customTitle?: string;
  featuredRepos: string[];
  customUrl?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface ProfileAnalytics {
  totalViews: number;
  uniqueViews: number;
  shares: number;
  clicks: number;
  viewsByDate: Array<{
    date: string;
    views: number;
  }>;
  topReferrers: Array<{
    source: string;
    views: number;
  }>;
  geographicData: Array<{
    country: string;
    views: number;
  }>;
}

class PublicProfileService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    requireAuth = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (requireAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError('API request failed', error as Error, {
        endpoint,
        method: options.method || 'GET'
      }, 'PublicProfileService');
      throw error;
    }
  }

  /**
   * Fetch a public profile by username
   */
  async getPublicProfile(username: string): Promise<PublicProfileData> {
    try {
      const profile = await this.makeRequest<PublicProfileData>(
        `/api/public-profiles/${username}`
      );
      
      // Track profile view
      this.trackProfileView(username);
      
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Profile not found or not public');
      }
      throw error;
    }
  }

  /**
   * Get current user's profile settings
   */
  async getProfileSettings(): Promise<{
    visibility: ProfileVisibilitySettings;
    customization: ProfileCustomization;
  }> {
    return this.makeRequest('/api/profile/settings', {}, true);
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(settings: {
    visibility: ProfileVisibilitySettings;
    customization: ProfileCustomization;
  }): Promise<void> {
    await this.makeRequest('/api/profile/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }, true);
    
    logUserAction('profile_settings_updated', {
      isPublic: settings.visibility.isPublic,
      visibleSections: Object.entries(settings.visibility).filter(([_, value]) => value).length
    });
  }

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ProfileAnalytics> {
    return this.makeRequest(`/api/profile/analytics?range=${timeRange}`, {}, true);
  }

  /**
   * Track profile view (fire and forget)
   */
  private async trackProfileView(username: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/analytics/profile-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Analytics failure shouldn't break the app
      console.warn('Failed to track profile view:', error);
    }
  }

  /**
   * Generate shareable profile URL
   */
  generateProfileUrl(username: string, customUrl?: string): string {
    const slug = customUrl || username;
    return `${window.location.origin}/profile/${slug}`;
  }

  /**
   * Generate social media preview data
   */
  generateSocialPreview(profile: PublicProfileData): {
    title: string;
    description: string;
    image: string;
    url: string;
  } {
    const title = `${profile.name || profile.username}'s Developer Profile`;
    const description = profile.bio || 
      `${profile.currentRole || 'Developer'} with ${profile.topSkills.length} verified skills. ` +
      `Check out their projects and career journey on SkillBridge.`;
    
    return {
      title,
      description,
      image: profile.avatarUrl || `${window.location.origin}/default-avatar.png`,
      url: this.generateProfileUrl(profile.username)
    };
  }

  /**
   * Check if username is available for custom URL
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/profile/check-username/${username}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get featured repositories for selection
   */
  async getFeaturedRepositories(): Promise<Array<{
    name: string;
    description: string;
    stars: number;
    language: string;
    url: string;
  }>> {
    return this.makeRequest('/api/github/repositories/featured', {}, true);
  }


}

export const publicProfileService = new PublicProfileService();
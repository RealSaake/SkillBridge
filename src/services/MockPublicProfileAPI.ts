import { PublicProfileData, publicProfileService } from './PublicProfileService';

// Mock API implementation for development
class MockPublicProfileAPI {
  private profiles: Map<string, PublicProfileData> = new Map();

  constructor() {
    // Initialize with some mock profiles
    this.initializeMockProfiles();
  }

  private initializeMockProfiles() {
    const mockUsernames = ['johndoe', 'janedeveloper', 'alexcoder', 'sarahtech'];
    
    mockUsernames.forEach(username => {
      const profile = publicProfileService.generateMockProfile(username);
      this.profiles.set(username, profile);
    });
  }

  async getPublicProfile(username: string): Promise<PublicProfileData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const profile = this.profiles.get(username);
    if (!profile) {
      throw new Error('Profile not found or not public');
    }
    
    return profile;
  }

  async updateProfileSettings(username: string, settings: any): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const profile = this.profiles.get(username);
    if (profile) {
      // Update profile with new settings
      Object.assign(profile, settings.visibility);
      this.profiles.set(username, profile);
    }
  }

  async getProfileAnalytics(username: string): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      totalViews: Math.floor(Math.random() * 1000) + 100,
      uniqueViews: Math.floor(Math.random() * 800) + 80,
      shares: Math.floor(Math.random() * 50) + 5,
      clicks: Math.floor(Math.random() * 200) + 20,
      viewsByDate: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 20) + 1
      })),
      topReferrers: [
        { source: 'github.com', views: 45 },
        { source: 'linkedin.com', views: 32 },
        { source: 'twitter.com', views: 18 },
        { source: 'direct', views: 67 }
      ],
      geographicData: [
        { country: 'United States', views: 89 },
        { country: 'Canada', views: 23 },
        { country: 'United Kingdom', views: 18 },
        { country: 'Germany', views: 15 }
      ]
    };
  }
}

export const mockPublicProfileAPI = new MockPublicProfileAPI();

// Override fetch for development
if (process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Intercept public profile API calls
    if (url.includes('/api/public-profiles/')) {
      const username = url.split('/').pop();
      if (username) {
        try {
          const profile = await mockPublicProfileAPI.getPublicProfile(username);
          return new Response(JSON.stringify(profile), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Profile not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    // Intercept profile settings API calls
    if (url.includes('/api/profile/settings')) {
      if (init?.method === 'PUT') {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // GET request - return default settings
        return new Response(JSON.stringify({
          visibility: {
            isPublic: true,
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
          },
          customization: {
            featuredRepos: [],
            socialLinks: {}
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Intercept analytics API calls
    if (url.includes('/api/analytics/profile-view')) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Intercept repositories API calls
    if (url.includes('/api/github/repositories')) {
      const mockRepos = [
        {
          name: 'awesome-react-app',
          description: 'A modern React application with TypeScript',
          stars: 234,
          language: 'TypeScript',
          url: 'https://github.com/user/awesome-react-app'
        },
        {
          name: 'node-api-server',
          description: 'RESTful API server built with Node.js and Express',
          stars: 156,
          language: 'JavaScript',
          url: 'https://github.com/user/node-api-server'
        },
        {
          name: 'ml-data-pipeline',
          description: 'Machine learning data pipeline with Python',
          stars: 89,
          language: 'Python',
          url: 'https://github.com/user/ml-data-pipeline'
        }
      ];
      
      return new Response(JSON.stringify(mockRepos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fall back to original fetch for other requests
    return originalFetch(input, init);
  };
}
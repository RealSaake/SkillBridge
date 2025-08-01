import { logUserAction, logError } from '../utils/logger';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
}

export interface ConversionEvent {
  source: 'viral_profile' | 'organic_search' | 'direct' | 'social_media' | 'referral';
  medium: 'linkedin' | 'twitter' | 'facebook' | 'whatsapp' | 'email' | 'direct' | 'search';
  campaign?: string;
  referrer?: string;
  landingPage: string;
  userId?: string;
  profileId?: string;
}

export interface ViralMetrics {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  viralCoefficient: number;
  profileViews: number;
  profileShares: number;
  conversionRate: number;
  topReferrers: Array<{
    source: string;
    users: number;
    conversionRate: number;
  }>;
}

export interface ProfileAnalytics {
  profileId: string;
  username: string;
  views: number;
  uniqueViews: number;
  shares: number;
  sharesByPlatform: Record<string, number>;
  referralConversions: number;
  lastViewed: string;
  viewsByDate: Array<{
    date: string;
    views: number;
  }>;
  topReferrers: Array<{
    source: string;
    views: number;
  }>;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private baseUrl: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set the current user ID for analytics tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track a general analytics event
   */
  async trackEvent(event: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        properties: {
          ...properties,
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        },
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };

      // Log locally for debugging
      logUserAction(event, analyticsEvent.properties);

      // Send to analytics service
      await this.sendAnalyticsEvent(analyticsEvent);
    } catch (error) {
      logError('Analytics tracking failed', error as Error, {
        event,
        properties
      }, 'AnalyticsService');
    }
  }

  /**
   * Track landing page visits with source attribution
   */
  async trackLandingPageVisit(source?: string): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    // Determine traffic source
    let trafficSource = source || 'direct';
    let medium = 'direct';
    
    if (referrer) {
      if (referrer.includes('linkedin.com')) {
        trafficSource = 'social_media';
        medium = 'linkedin';
      } else if (referrer.includes('twitter.com') || referrer.includes('t.co')) {
        trafficSource = 'social_media';
        medium = 'twitter';
      } else if (referrer.includes('facebook.com')) {
        trafficSource = 'social_media';
        medium = 'facebook';
      } else if (referrer.includes('google.com')) {
        trafficSource = 'organic_search';
        medium = 'search';
      } else if (referrer.includes('skillbridge')) {
        trafficSource = 'viral_profile';
        medium = 'direct';
      }
    }

    // Check for UTM parameters
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');

    if (utmSource) {
      trafficSource = utmSource as any;
      medium = utmMedium as any || medium;
    }

    await this.trackEvent('landing_page_visit', {
      source: trafficSource,
      medium,
      campaign: utmCampaign,
      referrer,
      landingPage: window.location.pathname,
      utmSource,
      utmMedium,
      utmCampaign
    });
  }

  /**
   * Track user conversion (sign up)
   */
  async trackConversion(conversionData: Partial<ConversionEvent> = {}): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    
    const conversion: ConversionEvent = {
      source: 'direct',
      medium: 'direct',
      landingPage: window.location.pathname,
      referrer: document.referrer,
      ...conversionData
    };

    // Override with UTM parameters if available
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
    if (utmSource) {
      conversion.source = utmSource as any;
      conversion.medium = utmMedium as any || conversion.medium;
    }

    await this.trackEvent('user_conversion', conversion);
  }

  /**
   * Track profile view
   */
  async trackProfileView(profileUsername: string, viewerUserId?: string): Promise<void> {
    await this.trackEvent('profile_view', {
      profileUsername,
      viewerUserId,
      referrer: document.referrer,
      isUniqueView: !this.hasViewedProfile(profileUsername)
    });

    // Mark profile as viewed in session
    this.markProfileViewed(profileUsername);
  }

  /**
   * Track profile share
   */
  async trackProfileShare(profileUsername: string, platform: string, shareMethod: 'native' | 'copy' | 'social' = 'social'): Promise<void> {
    await this.trackEvent('profile_share', {
      profileUsername,
      platform,
      shareMethod,
      shareUrl: window.location.href
    });
  }

  /**
   * Track profile creation
   */
  async trackProfileCreation(userId: string, profileData: any): Promise<void> {
    await this.trackEvent('profile_created', {
      userId,
      profileUsername: profileData.username,
      hasCustomBio: !!profileData.customBio,
      featuredReposCount: profileData.featuredRepos?.length || 0,
      skillsCount: profileData.skills?.length || 0,
      isPublic: profileData.isPublic
    });
  }

  /**
   * Track A/B test participation
   */
  async trackABTest(testName: string, variant: string, userId?: string): Promise<void> {
    await this.trackEvent('ab_test_view', {
      testName,
      variant,
      userId: userId || this.userId
    });
  }

  /**
   * Track A/B test conversion
   */
  async trackABTestConversion(testName: string, variant: string, conversionType: string): Promise<void> {
    await this.trackEvent('ab_test_conversion', {
      testName,
      variant,
      conversionType
    });
  }

  /**
   * Get viral growth metrics
   */
  async getViralMetrics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<ViralMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/viral-metrics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch viral metrics');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to fetch viral metrics', error as Error, {
        timeRange
      }, 'AnalyticsService');
      
      // Return empty metrics if API fails
      return {
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        viralCoefficient: 0,
        profileViews: 0,
        profileShares: 0,
        conversionRate: 0,
        topReferrers: []
      };
    }
  }

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(profileUsername: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ProfileAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/profile/${profileUsername}?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile analytics');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to fetch profile analytics', error as Error, {
        profileUsername,
        timeRange
      }, 'AnalyticsService');
      
      // Return empty analytics if API fails
      return {
        profileId: `profile_${profileUsername}`,
        username: profileUsername,
        views: 0,
        uniqueViews: 0,
        shares: 0,
        sharesByPlatform: {
          linkedin: 0,
          twitter: 0,
          facebook: 0,
          email: 0
        },
        referralConversions: 0,
        lastViewed: new Date().toISOString(),
        viewsByDate: [],
        topReferrers: []
      };
    }
  }

  /**
   * Calculate viral coefficient
   */
  async calculateViralCoefficient(timeRange: '7d' | '30d' = '30d'): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/viral-coefficient?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to calculate viral coefficient');
      }

      const data = await response.json();
      return data.viralCoefficient;
    } catch (error) {
      logError('Failed to calculate viral coefficient', error as Error, {
        timeRange
      }, 'AnalyticsService');
      
      // Return 0 if calculation fails
      return 0;
    }
  }

  /**
   * Send analytics event to backend
   */
  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.userId && { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` })
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Analytics failures should not break the app
      console.warn('Failed to send analytics event:', error);
    }
  }

  /**
   * Check if profile has been viewed in this session
   */
  private hasViewedProfile(profileUsername: string): boolean {
    const viewedProfiles = sessionStorage.getItem('viewedProfiles');
    if (!viewedProfiles) return false;
    
    const profiles = JSON.parse(viewedProfiles);
    return profiles.includes(profileUsername);
  }

  /**
   * Mark profile as viewed in session
   */
  private markProfileViewed(profileUsername: string): void {
    const viewedProfiles = sessionStorage.getItem('viewedProfiles');
    const profiles = viewedProfiles ? JSON.parse(viewedProfiles) : [];
    
    if (!profiles.includes(profileUsername)) {
      profiles.push(profileUsername);
      sessionStorage.setItem('viewedProfiles', JSON.stringify(profiles));
    }
  }


}

export const analyticsService = new AnalyticsService();
import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService, ViralMetrics, ProfileAnalytics } from '../services/AnalyticsService';
import { useState } from 'react';

export interface UseAnalyticsReturn {
  trackEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
  trackConversion: (source?: string) => Promise<void>;
  trackProfileView: (profileUsername: string) => Promise<void>;
  trackProfileShare: (profileUsername: string, platform: string) => Promise<void>;
  trackABTest: (testName: string, variant: string) => Promise<void>;
  trackABTestConversion: (testName: string, variant: string, conversionType: string) => Promise<void>;
}

export interface UseViralMetricsReturn {
  metrics: ViralMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseProfileAnalyticsReturn {
  analytics: ProfileAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Main analytics hook for tracking events
 */
export const useAnalytics = (): UseAnalyticsReturn => {
  const { user } = useAuth();

  // Set user ID when user changes
  useEffect(() => {
    if (user?.id) {
      analyticsService.setUserId(user.id);
    }
  }, [user?.id]);

  // Track landing page visit on mount
  useEffect(() => {
    analyticsService.trackLandingPageVisit();
  }, []);

  const trackEvent = useCallback(async (event: string, properties: Record<string, any> = {}) => {
    await analyticsService.trackEvent(event, properties);
  }, []);

  const trackConversion = useCallback(async (source?: string) => {
    await analyticsService.trackConversion({
      userId: user?.id,
      source: source as any
    });
  }, [user?.id]);

  const trackProfileView = useCallback(async (profileUsername: string) => {
    await analyticsService.trackProfileView(profileUsername, user?.id);
  }, [user?.id]);

  const trackProfileShare = useCallback(async (profileUsername: string, platform: string) => {
    await analyticsService.trackProfileShare(profileUsername, platform);
  }, []);

  const trackABTest = useCallback(async (testName: string, variant: string) => {
    await analyticsService.trackABTest(testName, variant, user?.id);
  }, [user?.id]);

  const trackABTestConversion = useCallback(async (testName: string, variant: string, conversionType: string) => {
    await analyticsService.trackABTestConversion(testName, variant, conversionType);
  }, []);

  return {
    trackEvent,
    trackConversion,
    trackProfileView,
    trackProfileShare,
    trackABTest,
    trackABTestConversion
  };
};

/**
 * Hook for fetching viral growth metrics
 */
export const useViralMetrics = (timeRange: '24h' | '7d' | '30d' = '7d'): UseViralMetricsReturn => {
  const [metrics, setMetrics] = useState<ViralMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getViralMetrics(timeRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch viral metrics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  };
};

/**
 * Hook for fetching profile analytics
 */
export const useProfileAnalytics = (profileUsername: string, timeRange: '7d' | '30d' | '90d' = '30d'): UseProfileAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!profileUsername) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getProfileAnalytics(profileUsername, timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile analytics');
    } finally {
      setLoading(false);
    }
  }, [profileUsername, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  };
};

/**
 * Hook for A/B testing
 */
export const useABTest = (testName: string, variants: string[], userId?: string) => {
  const [variant, setVariant] = useState<string>('');
  const { trackABTest, trackABTestConversion } = useAnalytics();

  useEffect(() => {
    // Determine variant based on user ID or session
    const seed = userId || analyticsService['sessionId'];
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const variantIndex = Math.abs(hash) % variants.length;
    const selectedVariant = variants[variantIndex];
    
    setVariant(selectedVariant);
    
    // Track A/B test participation
    trackABTest(testName, selectedVariant);
  }, [testName, variants, userId, trackABTest]);

  const trackConversion = useCallback((conversionType: string) => {
    if (variant) {
      trackABTestConversion(testName, variant, conversionType);
    }
  }, [testName, variant, trackABTestConversion]);

  return {
    variant,
    trackConversion
  };
};

/**
 * Hook for tracking page views
 */
export const usePageView = (pageName: string, properties: Record<string, any> = {}) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('page_view', {
      page: pageName,
      url: window.location.href,
      ...properties
    });
  }, [pageName, trackEvent, properties]);
};

/**
 * Hook for tracking user interactions
 */
export const useInteractionTracking = () => {
  const { trackEvent } = useAnalytics();

  const trackClick = useCallback((element: string, properties: Record<string, any> = {}) => {
    trackEvent('click', {
      element,
      ...properties
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, properties: Record<string, any> = {}) => {
    trackEvent('form_submit', {
      form: formName,
      ...properties
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, results: number, properties: Record<string, any> = {}) => {
    trackEvent('search', {
      query,
      results,
      ...properties
    });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, properties: Record<string, any> = {}) => {
    trackEvent('error', {
      errorType,
      errorMessage,
      ...properties
    });
  }, [trackEvent]);

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackError
  };
};
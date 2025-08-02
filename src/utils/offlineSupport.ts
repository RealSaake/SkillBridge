// Offline support and fallback mechanisms
import React from 'react';

interface CachedData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class OfflineSupport {
  private readonly CACHE_PREFIX = 'skillbridge_cache_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Check if the browser is online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Cache data with expiration
  cacheData(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    try {
      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };
      
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`, 
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  // Retrieve cached data if valid
  getCachedData(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cachedData: CachedData = JSON.parse(cached);
      
      // Check if data has expired
      if (Date.now() > cachedData.expiresAt) {
        this.clearCache(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  // Clear specific cache entry
  clearCache(key: string): void {
    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Clear all cached data
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  // Get fallback user data for offline scenarios
  getFallbackUserData(): any {
    return this.getCachedData('user_profile') || {
      name: 'Offline User',
      username: 'offline',
      avatarUrl: '/default-avatar.png',
      profile: {
        currentRole: 'Developer',
        targetRole: 'Full Stack Developer',
        experienceLevel: 'intermediate',
        techStack: ['JavaScript', 'React', 'Node.js'],
        completedOnboarding: true
      }
    };
  }

  // Get fallback dashboard data
  getFallbackDashboardData(): any {
    return this.getCachedData('dashboard_data') || {
      githubActivity: {
        repositories: [],
        totalCommits: 0,
        languages: []
      },
      skillGapAnalysis: {
        gaps: [],
        recommendations: []
      },
      learningRoadmap: {
        phases: [],
        progress: 0
      }
    };
  }

  // Setup offline event listeners
  setupOfflineHandlers(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      onOnline();
    };

    const handleOffline = () => {
      console.log('📴 Connection lost - switching to offline mode');
      onOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Enhanced fetch with offline fallback
  async fetchWithFallback(
    url: string,
    options: RequestInit = {},
    cacheKey?: string,
    fallbackData?: any
  ): Promise<Response> {
    try {
      // If offline, return cached data immediately
      if (!this.isOnline() && cacheKey) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Attempt network request
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      // Cache successful responses
      if (response.ok && cacheKey) {
        const data = await response.clone().json();
        this.cacheData(cacheKey, data);
      }

      return response;
    } catch (error) {
      console.warn('Network request failed, attempting fallback:', error);

      // Try cached data first
      if (cacheKey) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Use provided fallback data
      if (fallbackData) {
        return new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Re-throw if no fallback available
      throw error;
    }
  }
}

export const offlineSupport = new OfflineSupport();

// React hook for offline support
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const cleanup = offlineSupport.setupOfflineHandlers(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    return cleanup;
  }, []);

  return {
    isOnline,
    cacheData: offlineSupport.cacheData.bind(offlineSupport),
    getCachedData: offlineSupport.getCachedData.bind(offlineSupport),
    clearCache: offlineSupport.clearCache.bind(offlineSupport),
    fetchWithFallback: offlineSupport.fetchWithFallback.bind(offlineSupport)
  };
}
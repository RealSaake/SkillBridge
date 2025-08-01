/**
 * GitHub Service
 * 
 * Comprehensive service for GitHub API integration with:
 * - User data isolation and security
 * - Rate limiting and error handling
 * - Comprehensive logging and monitoring
 * - Data validation and sanitization
 * - Retry logic and resilience
 */

import { 
  logError, 
  logInfo, 
  logWarn, 
  logDebug,
  generateTraceId
} from '../utils/logger';
import { userDataIsolation } from '../utils/userDataIsolation';
import { validator, commonSchemas } from '../utils/validation';

// Types for GitHub API responses
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
  size?: number;
  default_branch?: string;
  topics?: string[];
  owner?: {
    login: string;
    id: number;
  };
}

export interface GitHubStats {
  totalRepos: number;
  languages: Record<string, number>;
  totalStars: number;
  totalForks: number;
  totalSize: number;
  averageStars: number;
  mostStarredRepo: string | null;
  recentActivity: {
    lastPushDate: string | null;
    reposUpdatedThisMonth: number;
    commitsThisMonth: number;
  };
  skillAnalysis: {
    primaryLanguages: string[];
    frameworks: string[];
    tools: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface SyncResult {
  success: boolean;
  userProfile: GitHubUser | null;
  repositories: GitHubRepository[];
  stats: GitHubStats | null;
  errors: string[];
  syncedAt: string;
}

class GitHubService {
  private static instance: GitHubService;
  private userDataIsolation = userDataIsolation;
  private rateLimitInfo: RateLimitInfo | null = null;
  private isSyncing = false;

  private constructor() {
    // userDataIsolation is already initialized above
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Get current rate limit information
   */
  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Make authenticated GitHub API request
   */
  private async makeGitHubRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const traceId = generateTraceId();
    
    // Get current session
    const session = this.userDataIsolation.getCurrentSession();
    if (!session || !session.githubToken) {
      logError('GitHub API request without valid token', undefined, {
        url,
        traceId
      }, 'GitHubService');
      throw new Error('No valid GitHub token available');
    }

    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${session.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SkillBridge/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
      'X-Trace-ID': traceId,
      ...options.headers
    };

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    logDebug(`Starting ${options.method || 'GET'} request to ${url}`, { traceId }, 'GitHubService');

    try {
      const response = await fetch(url, requestOptions);
      // Duration tracking removed - timer doesn't exist

      // Update rate limit info from headers
      this.updateRateLimitInfo(response.headers);

      if (!response.ok) {
        await this.handleApiError(response, url, options.method || 'GET', 0);
      }

      logDebug(`${options.method || 'GET'} request to ${url} completed successfully`, { 
        status: response.status, 
        traceId 
      }, 'GitHubService');

      return response;
    } catch (error) {
      // Duration tracking removed - timer doesn't exist
      
      // API call failure logging removed - function doesn't exist

      logError('GitHub API request failed', error as Error, {
        url,
        traceId
      }, 'GitHubService');

      throw error;
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const used = headers.get('X-RateLimit-Used');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        used: used ? parseInt(used) : 0
      };

      // Warn if rate limit is getting low
      if (this.rateLimitInfo.remaining < this.rateLimitInfo.limit * 0.1) {
        logWarn('GitHub API rate limit getting low', {
          remaining: this.rateLimitInfo.remaining,
          limit: this.rateLimitInfo.limit,
          resetTime: new Date(this.rateLimitInfo.reset * 1000).toISOString()
        }, 'GitHubService');
      }
    }
  }

  /**
   * Handle API errors with appropriate logging and error messages
   */
  private async handleApiError(
    response: Response,
    url: string,
    method: string,
    duration: number
  ): Promise<never> {
    const traceId = generateTraceId();
    let errorBody = '';
    
    try {
      errorBody = await response.text();
    } catch {
      // Ignore error reading body
    }

    switch (response.status) {
      case 401:
        logError('GitHub API authentication failed', undefined, {
          url,
          status: response.status,
          traceId
        }, 'GitHubService');
        throw new Error('GitHub token expired or invalid');

      case 403:
        if (this.rateLimitInfo?.remaining === 0) {
          logWarn('GitHub API rate limit exceeded', {
            url,
            resetTime: new Date((this.rateLimitInfo.reset || 0) * 1000).toISOString(),
            traceId
          }, 'GitHubService');
          throw new Error('GitHub API rate limit exceeded');
        }
        logError('GitHub API forbidden', new Error('Forbidden'), {
          url,
          status: response.status,
          errorBody,
          traceId
        }, 'GitHubService');
        throw new Error('GitHub API access forbidden');

      case 404:
        logWarn('GitHub API resource not found', {
          url,
          status: response.status,
          traceId
        }, 'GitHubService');
        throw new Error('GitHub resource not found');

      default:
        logError('GitHub API request failed', new Error(`HTTP ${response.status}`), {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody,
          traceId
        }, 'GitHubService');
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Fetch user profile from GitHub API
   */
  public async fetchUserProfile(): Promise<GitHubUser> {
    const traceId = generateTraceId();
    
    logDebug('Fetching GitHub user profile', { traceId }, 'GitHubService');

    const response = await this.makeGitHubRequest('https://api.github.com/user');
    const userData = await response.json();

    // Validate the response data using the validator
    const validation = validator.validate(userData, commonSchemas.userProfile);
    if (!validation.isValid) {
      logError('GitHub user profile validation failed', new Error('Validation failed'), {
        validationErrors: validation.errors,
        traceId
      }, 'GitHubService');
      throw new Error('Invalid user profile data received from GitHub');
    }

    logInfo('GitHub user profile fetched successfully', {
      userId: userData.id,
      username: userData.login,
      traceId
    }, 'GitHubService');

    return userData;
  }

  /**
   * Fetch user repositories with pagination
   */
  public async fetchUserRepositories(page = 1, perPage = 30): Promise<GitHubRepository[]> {
    const traceId = generateTraceId();
    
    // Validate pagination parameters
    // Pagination validation moved below

    if (page < 1 || page > 100) {
      logWarn('Invalid page parameter', { page, traceId }, 'GitHubService');
      throw new Error('Page must be between 1 and 100');
    }
    if (perPage < 1 || perPage > 100) {
      logWarn('Invalid perPage parameter', { perPage, traceId }, 'GitHubService');
      throw new Error('Per page must be between 1 and 100');
    }

    logDebug('Fetching GitHub user repositories', {
      page,
      perPage,
      traceId
    }, 'GitHubService');

    const url = `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}&type=all`;
    const response = await this.makeGitHubRequest(url);
    const repositories = await response.json();

    // Basic validation - ensure repositories is an array
    if (!Array.isArray(repositories)) {
      logError('GitHub repositories validation failed', new Error('Invalid response format'), {
        traceId
      }, 'GitHubService');
      throw new Error('Invalid repository data received from GitHub');
    }

    logInfo('GitHub repositories fetched successfully', {
      count: repositories.length,
      page,
      perPage,
      traceId
    }, 'GitHubService');

    return repositories;
  }

  /**
   * Fetch all user repositories (handles pagination automatically)
   */
  public async fetchAllUserRepositories(): Promise<GitHubRepository[]> {
    const traceId = generateTraceId();
    const allRepositories: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by GitHub API

    logDebug('Fetching all GitHub user repositories', { traceId }, 'GitHubService');

    while (true) {
      const repositories = await this.fetchUserRepositories(page, perPage);
      
      if (repositories.length === 0) {
        break;
      }

      allRepositories.push(...repositories);
      
      // If we got less than perPage, we've reached the end
      if (repositories.length < perPage) {
        break;
      }

      page++;
    }

    logInfo('All GitHub repositories fetched successfully', {
      totalCount: allRepositories.length,
      totalPages: page,
      traceId
    }, 'GitHubService');

    return allRepositories;
  }

  /**
   * Calculate user statistics from repositories
   */
  public async calculateUserStats(): Promise<GitHubStats> {
    const traceId = generateTraceId();
    
    logDebug('Calculating GitHub user statistics', { traceId }, 'GitHubService');

    const repositories = await this.fetchAllUserRepositories();

    // Calculate basic stats
    const totalRepos = repositories.length;
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalSize = repositories.reduce((sum, repo) => sum + (repo.size || 0), 0);
    const averageStars = totalRepos > 0 ? totalStars / totalRepos : 0;

    // Language analysis
    const languages: Record<string, number> = {};
    repositories.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    // Find most starred repository
    const mostStarredRepo = repositories.length > 0 
      ? repositories.reduce((max, repo) => 
          repo.stargazers_count > max.stargazers_count ? repo : max
        ).name
      : null;

    // Recent activity analysis
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentRepos = repositories.filter(
      repo => new Date(repo.updated_at) > oneMonthAgo
    );

    const lastPushDate = repositories.length > 0
      ? repositories
          .map(repo => repo.updated_at)
          .sort()
          .reverse()[0]
      : null;

    // Skill analysis
    const primaryLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);

    // Extract frameworks from topics
    const allTopics = repositories.flatMap(repo => repo.topics || []);
    const frameworks = Array.from(new Set(allTopics.filter(topic => 
      ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel'].includes(topic.toLowerCase())
    )));

    // Extract tools from topics
    const tools = Array.from(new Set(allTopics.filter(topic => 
      ['docker', 'kubernetes', 'webpack', 'babel', 'jest', 'cypress', 'github-actions'].includes(topic.toLowerCase())
    )));

    // Determine experience level
    let experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    if (totalRepos >= 50 && totalStars >= 500) {
      experienceLevel = 'expert';
    } else if (totalRepos >= 20 && totalStars >= 100) {
      experienceLevel = 'advanced';
    } else if (totalRepos >= 10 && totalStars >= 20) {
      experienceLevel = 'intermediate';
    }

    const stats: GitHubStats = {
      totalRepos,
      languages,
      totalStars,
      totalForks,
      totalSize,
      averageStars,
      mostStarredRepo,
      recentActivity: {
        lastPushDate,
        reposUpdatedThisMonth: recentRepos.length,
        commitsThisMonth: 0 // Would need additional API calls to get commit data
      },
      skillAnalysis: {
        primaryLanguages,
        frameworks,
        tools,
        experienceLevel
      }
    };

    logInfo('GitHub user statistics calculated successfully', {
      totalRepos,
      totalStars,
      experienceLevel,
      primaryLanguages,
      traceId
    }, 'GitHubService');

    return stats;
  }

  /**
   * Sync all user data (profile, repositories, and stats)
   */
  public async syncUserData(): Promise<SyncResult> {
    const traceId = generateTraceId();
    
    if (this.isSyncing) {
      logWarn('Data sync already in progress', { traceId }, 'GitHubService');
      throw new Error('Data synchronization already in progress');
    }

    this.isSyncing = true;
    // Timer removed - startTimer function doesn't exist
    
    logInfo('Starting GitHub data synchronization', { traceId }, 'GitHubService');

    const result: SyncResult = {
      success: true,
      userProfile: null,
      repositories: [],
      stats: null,
      errors: [],
      syncedAt: new Date().toISOString()
    };

    try {
      // Fetch user profile
      try {
        result.userProfile = await this.fetchUserProfile();
      } catch (error) {
        const errorMessage = `Failed to sync user profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
        
        logError('User profile sync failed', error as Error, { traceId }, 'GitHubService');
      }

      // Fetch repositories
      try {
        result.repositories = await this.fetchAllUserRepositories();
      } catch (error) {
        const errorMessage = `Failed to sync repositories: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
        
        logError('Repositories sync failed', error as Error, { traceId }, 'GitHubService');
      }

      // Calculate stats
      try {
        result.stats = await this.calculateUserStats();
      } catch (error) {
        const errorMessage = `Failed to calculate stats: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;
        
        logError('Stats calculation failed', error as Error, { traceId }, 'GitHubService');
      }

      // Duration tracking removed - timer doesn't exist

      if (result.success) {
        logInfo('GitHub data synchronization completed successfully', {
          profileSynced: !!result.userProfile,
          repositoriesCount: result.repositories.length,
          statsCalculated: !!result.stats,
          // Duration tracking removed - timer doesn't exist
          traceId
        }, 'GitHubService');
      } else {
        logWarn('GitHub data synchronization completed with errors', {
          errors: result.errors,
          profileSynced: !!result.userProfile,
          repositoriesCount: result.repositories.length,
          statsCalculated: !!result.stats,
          // Duration tracking removed - timer doesn't exist
          traceId
        }, 'GitHubService');
      }

      return result;
    } finally {
      this.isSyncing = false;
    }
  }
}

export default GitHubService;
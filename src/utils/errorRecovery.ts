/**
 * COMPREHENSIVE ERROR RECOVERY SYSTEM
 * 
 * Provides intelligent error recovery mechanisms:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern for failing services
 * - Graceful degradation strategies
 * - User-friendly error reporting
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface RecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  recoveryStrategy?: string;
}

class ErrorRecoverySystem {
  private static instance: ErrorRecoverySystem;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): ErrorRecoverySystem {
    if (!ErrorRecoverySystem.instance) {
      ErrorRecoverySystem.instance = new ErrorRecoverySystem();
    }
    return ErrorRecoverySystem.instance;
  }

  /**
   * Execute operation with automatic retry and recovery
   */
  public async executeWithRecovery<T>(
    operationName: string,
    operation: () => Promise<T>,
    retryOptions: Partial<RetryOptions> = {},
    circuitBreakerOptions: Partial<CircuitBreakerOptions> = {}
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();
    const traceId = logger.generateTraceId();
    
    const options: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryCondition: (error) => this.shouldRetry(error),
      ...retryOptions
    };

    const cbOptions: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 300000,
      ...circuitBreakerOptions
    };

    logger.info(`Starting operation with recovery: ${operationName}`, {
      traceId,
      maxRetries: options.maxRetries,
      circuitBreakerEnabled: true
    }, 'ErrorRecovery');

    // Check circuit breaker
    if (this.isCircuitOpen(operationName, cbOptions)) {
      const error = new Error(`Circuit breaker is open for ${operationName}`);
      logger.warn('Circuit breaker prevented operation execution', {
        operationName,
        traceId
      }, 'ErrorRecovery');
      
      return {
        success: false,
        error,
        attempts: 0,
        totalTime: Date.now() - startTime,
        recoveryStrategy: 'circuit_breaker_open'
      };
    }

    let lastError: Error | null = null;
    let attempts = 0;

    for (attempts = 0; attempts <= options.maxRetries; attempts++) {
      try {
        // Add delay for retry attempts
        if (attempts > 0) {
          const delay = Math.min(
            options.baseDelay * Math.pow(options.backoffMultiplier, attempts - 1),
            options.maxDelay
          );
          
          logger.debug(`Retrying operation after delay: ${operationName}`, {
            attempt: attempts + 1,
            delayMs: delay,
            traceId
          }, 'ErrorRecovery');
          
          await this.delay(delay);
        }

        // Execute the operation
        const result = await operation();
        
        // Success - reset circuit breaker failure count
        this.recordSuccess(operationName);
        
        const totalTime = Date.now() - startTime;
        logger.info(`Operation completed successfully: ${operationName}`, {
          attempts: attempts + 1,
          totalTime,
          traceId
        }, 'ErrorRecovery');

        return {
          success: true,
          data: result,
          attempts: attempts + 1,
          totalTime,
          recoveryStrategy: attempts > 0 ? 'retry_success' : 'first_attempt_success'
        };

      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Operation attempt failed: ${operationName}`, {
          attempt: attempts + 1,
          error: lastError.message,
          traceId
        }, 'ErrorRecovery');

        // Record failure for circuit breaker
        this.recordFailure(operationName, cbOptions);

        // Check if we should retry
        if (attempts < options.maxRetries && options.retryCondition!(lastError)) {
          continue;
        } else {
          break;
        }
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    
    logger.error(`Operation failed after all retries: ${operationName}`, lastError!, {
      totalAttempts: attempts + 1,
      totalTime,
      traceId
    }, 'ErrorRecovery');

    // Try graceful degradation
    const degradedResult = await this.attemptGracefulDegradation(operationName, lastError!);
    
    return {
      success: false,
      error: lastError!,
      attempts: attempts + 1,
      totalTime,
      recoveryStrategy: degradedResult ? 'graceful_degradation' : 'complete_failure',
      data: degradedResult as T | undefined
    };
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry authentication errors
    if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return false;
    }
    
    // Don't retry client errors (4xx except 429)
    if (message.includes('400') || message.includes('404') || message.includes('422')) {
      return false;
    }
    
    // Retry network errors, server errors, and rate limits
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('429') ||
      message.includes('rate limit')
    );
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitOpen(operationName: string, options: CircuitBreakerOptions): boolean {
    const state = this.circuitBreakers.get(operationName);
    
    if (!state) {
      return false;
    }

    const now = Date.now();
    
    // Reset circuit if enough time has passed
    if (state.state === 'open' && now - state.lastFailureTime > options.resetTimeout) {
      state.state = 'half-open';
      state.failureCount = 0;
      logger.info(`Circuit breaker reset to half-open: ${operationName}`, {
        resetAfterMs: now - state.lastFailureTime
      }, 'ErrorRecovery');
    }

    return state.state === 'open';
  }

  private recordSuccess(operationName: string): void {
    const state = this.circuitBreakers.get(operationName);
    if (state) {
      state.state = 'closed';
      state.failureCount = 0;
      state.lastSuccessTime = Date.now();
    }
  }

  private recordFailure(operationName: string, options: CircuitBreakerOptions): void {
    let state = this.circuitBreakers.get(operationName);
    
    if (!state) {
      state = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0
      };
      this.circuitBreakers.set(operationName, state);
    }

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= options.failureThreshold) {
      state.state = 'open';
      logger.warn(`Circuit breaker opened: ${operationName}`, {
        failureCount: state.failureCount,
        threshold: options.failureThreshold
      }, 'ErrorRecovery');
    }
  }

  /**
   * Attempt graceful degradation when all retries fail
   */
  private async attemptGracefulDegradation<T>(
    operationName: string, 
    error: Error
  ): Promise<T | null> {
    logger.info(`Attempting graceful degradation: ${operationName}`, {
      originalError: error.message
    }, 'ErrorRecovery');

    // Operation-specific degradation strategies
    switch (operationName) {
      case 'github_user_profile':
        return this.getDefaultUserProfile() as T;
      
      case 'github_repositories':
        return this.getDefaultRepositories() as T;
      
      case 'mcp_skill_analysis':
        return this.getDefaultSkillAnalysis() as T;
      
      case 'mcp_roadmap':
        return this.getDefaultRoadmap() as T;
      
      default:
        return null;
    }
  }

  /**
   * Default fallback data providers
   */
  private getDefaultUserProfile(): any {
    return {
      id: 'fallback',
      login: 'user',
      name: 'GitHub User',
      avatar_url: '/default-avatar.png',
      bio: 'Profile temporarily unavailable',
      public_repos: 0,
      followers: 0,
      following: 0,
      created_at: new Date().toISOString(),
      _fallback: true
    };
  }

  private getDefaultRepositories(): any[] {
    return [{
      id: 'fallback',
      name: 'repositories-unavailable',
      full_name: 'user/repositories-unavailable',
      description: 'Repository data temporarily unavailable',
      language: null,
      stargazers_count: 0,
      forks_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _fallback: true
    }];
  }

  private getDefaultSkillAnalysis(): any {
    return {
      skills: [],
      recommendations: ['Connect your GitHub account to get personalized skill analysis'],
      skillGaps: [],
      _fallback: true
    };
  }

  private getDefaultRoadmap(): any {
    return {
      steps: [{
        title: 'Connect Your GitHub Account',
        description: 'Link your GitHub account to get a personalized learning roadmap',
        completed: false
      }],
      estimatedTime: '5 minutes',
      _fallback: true
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery statistics for monitoring
   */
  public getRecoveryStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.circuitBreakers.forEach((state, operationName) => {
      stats[operationName] = {
        state: state.state,
        failureCount: state.failureCount,
        lastFailureTime: state.lastFailureTime,
        lastSuccessTime: state.lastSuccessTime
      };
    });

    return stats;
  }

  /**
   * Reset all circuit breakers (for testing or manual recovery)
   */
  public resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear();
    logger.info('All circuit breakers reset', {}, 'ErrorRecovery');
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

// Export singleton instance
export const errorRecovery = ErrorRecoverySystem.getInstance();

// Utility function for easy use
export const withErrorRecovery = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: Partial<RetryOptions & CircuitBreakerOptions>
): Promise<T> => {
  const result = await errorRecovery.executeWithRecovery(
    operationName,
    operation,
    options,
    options
  );

  if (result.success && result.data !== undefined) {
    return result.data;
  } else {
    throw result.error || new Error(`Operation failed: ${operationName}`);
  }
};

export default errorRecovery;
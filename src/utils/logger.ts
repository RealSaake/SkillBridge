/**
 * MANDATORY STRUCTURED JSON LOGGER
 * 
 * STRICT REQUIREMENTS - NO EXCEPTIONS:
 * - ALL logs MUST be structured JSON
 * - EVERY log entry MUST include: timestamp, level, message, traceId, payload
 * - Trace IDs MUST be generated at request start and propagated
 * - Full stack traces REQUIRED for all exceptions
 * - NO plain string logs allowed
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string; // MANDATORY: ISO 8601 format
  level: LogLevel; // MANDATORY: One of DEBUG, INFO, WARN, ERROR
  message: string; // MANDATORY: Human-readable message
  traceId: string; // MANDATORY: Unique ID for request tracking
  payload: Record<string, any>; // MANDATORY: Contextual data
  userId?: string; // Optional: User identifier
  component?: string; // Optional: Component/service name
  stackTrace?: string; // MANDATORY for ERROR level
  errorId?: string; // MANDATORY for ERROR level - unique error identifier
}

class Logger {
  private static instance: Logger;
  private currentTraceId: string | null = null;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Generate a new trace ID for tracking requests
   */
  public generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `trace_${timestamp}_${random}`;
  }

  /**
   * Set the current trace ID for all subsequent logs
   */
  public setTraceId(traceId: string): void {
    this.currentTraceId = traceId;
  }

  /**
   * Set the current user ID for all subsequent logs
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear the current trace ID and user ID
   */
  public clearContext(): void {
    this.currentTraceId = null;
    this.userId = null;
  }

  /**
   * Get the current trace ID, generating one if none exists
   */
  public getTraceId(): string {
    if (!this.currentTraceId) {
      this.currentTraceId = this.generateTraceId();
    }
    return this.currentTraceId;
  }

  /**
   * Create a MANDATORY structured log entry
   * STRICT VALIDATION - ALL FIELDS REQUIRED
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    payload: Record<string, any> = {},
    component?: string,
    error?: Error
  ): LogEntry {
    // MANDATORY VALIDATION
    if (!message || message.trim() === '') {
      throw new Error('LOGGING ERROR: Message is mandatory and cannot be empty');
    }

    const traceId = this.getTraceId();
    if (!traceId) {
      throw new Error('LOGGING ERROR: TraceId is mandatory for all log entries');
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(), // MANDATORY: ISO 8601 format
      level, // MANDATORY: LogLevel
      message: message.trim(), // MANDATORY: Clean message
      traceId, // MANDATORY: Unique trace ID
      payload: { // MANDATORY: Always include contextual data
        ...payload,
        environment: process.env.NODE_ENV || 'development',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        timestamp_ms: Date.now() // For performance tracking
      }
    };

    // Add user context if available
    if (this.userId) {
      entry.userId = this.userId;
    }

    // Add component context if provided
    if (component) {
      entry.component = component;
    }

    // MANDATORY for ERROR level: Stack trace and error ID
    if (level === 'ERROR') {
      if (error) {
        entry.stackTrace = error.stack || 'No stack trace available';
        entry.payload.errorName = error.name;
        entry.payload.errorMessage = error.message;
      } else {
        entry.stackTrace = new Error().stack || 'No stack trace available';
      }
      
      // Generate unique error ID for support reference
      entry.errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      entry.payload.errorId = entry.errorId;
    }

    return entry;
  }

  /**
   * Output MANDATORY structured JSON log entry
   * NO PLAIN STRING LOGS ALLOWED
   */
  private output(entry: LogEntry): void {
    const logMethod = entry.level === 'ERROR' ? console.error :
                     entry.level === 'WARN' ? console.warn :
                     entry.level === 'DEBUG' ? console.debug :
                     console.log;

    // MANDATORY: Always output structured JSON
    const structuredLog = JSON.stringify(entry, null, 0);
    logMethod(structuredLog);

    // In development, ALSO log human-readable format for debugging
    if (process.env.NODE_ENV === 'development') {
      const humanReadable = `🔍 [${entry.level}] ${entry.message} | TraceID: ${entry.traceId}${entry.errorId ? ` | ErrorID: ${entry.errorId}` : ''}`;
      logMethod(humanReadable);
      
      // Show payload in readable format for development
      if (Object.keys(entry.payload).length > 0) {
        logMethod('📊 Payload:', entry.payload);
      }
    }

    // For ERROR level, also send to error tracking service in production
    if (entry.level === 'ERROR' && process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Send error logs to external tracking service
   */
  private sendToErrorTracking(entry: LogEntry): void {
    // In a real implementation, this would send to services like Sentry, LogRocket, etc.
    // For now, we'll just ensure it's properly structured for external consumption
    try {
      // This could be replaced with actual error tracking service calls
      if (typeof window !== 'undefined' && (window as any).errorTracker) {
        (window as any).errorTracker.captureException(entry);
      }
    } catch (error) {
      // Don't let error tracking failures break the application
      console.error('Failed to send error to tracking service:', error);
    }
  }

  /**
   * Log at DEBUG level
   */
  public debug(message: string, payload: Record<string, any> = {}, component?: string): void {
    const entry = this.createLogEntry('DEBUG', message, payload, component);
    this.output(entry);
  }

  /**
   * Log at INFO level
   */
  public info(message: string, payload: Record<string, any> = {}, component?: string): void {
    const entry = this.createLogEntry('INFO', message, payload, component);
    this.output(entry);
  }

  /**
   * Log at WARN level
   */
  public warn(message: string, payload: Record<string, any> = {}, component?: string): void {
    const entry = this.createLogEntry('WARN', message, payload, component);
    this.output(entry);
  }

  /**
   * Log at ERROR level - MANDATORY stack trace and error ID
   */
  public error(message: string, error?: Error, payload: Record<string, any> = {}, component?: string): void {
    // STRICT VALIDATION for ERROR level
    if (!message || message.trim() === '') {
      throw new Error('ERROR level logs MUST have a descriptive message');
    }

    const entry = this.createLogEntry('ERROR', message, payload, component, error);
    
    // MANDATORY: Ensure error ID is present for support reference
    if (!entry.errorId) {
      throw new Error('ERROR level logs MUST have an errorId for support reference');
    }

    this.output(entry);
  }

  /**
   * Log user actions for analytics and debugging
   */
  public userAction(action: string, payload: Record<string, any> = {}): void {
    this.info('User action performed', {
      ...payload,
      action,
      userActionType: 'USER_INTERACTION',
      sessionId: this.getSessionId()
    }, 'UserAction');
  }

  /**
   * Log security events
   */
  public security(message: string, severity: 'low' | 'medium' | 'high' | 'critical', payload: Record<string, any> = {}, component?: string): void {
    this.error(`SECURITY EVENT: ${message}`, undefined, {
      ...payload,
      securitySeverity: severity,
      securityEvent: true,
      requiresInvestigation: severity === 'high' || severity === 'critical'
    }, component);
  }

  /**
   * Get or generate session ID for user tracking
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('kiro_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('kiro_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  /**
   * Log API request start
   */
  public apiRequestStart(method: string, url: string, payload: Record<string, any> = {}): void {
    this.info('API request started', {
      ...payload,
      method,
      url,
      requestId: this.getTraceId()
    }, 'API');
  }

  /**
   * Log API request completion
   */
  public apiRequestComplete(
    method: string, 
    url: string, 
    status: number, 
    duration: number,
    payload: Record<string, any> = {}
  ): void {
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    const entry = this.createLogEntry(level, 'API request completed', {
      ...payload,
      method,
      url,
      status,
      duration,
      requestId: this.getTraceId()
    }, 'API');
    this.output(entry);
  }

  // Duplicate userAction method removed - using the enhanced version above

  // Duplicate security method removed - using the enhanced version above

  /**
   * Log performance metric
   */
  public performance(metric: string, value: number, payload: Record<string, any> = {}): void {
    this.info('Performance metric', {
      ...payload,
      metric,
      value,
      unit: payload.unit || 'ms'
    }, 'PERFORMANCE');
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export standalone utility functions
export const generateTraceId = (): string => logger.generateTraceId();
export const logError = (message: string, error?: Error, payload: Record<string, any> = {}, component?: string): void => 
  logger.error(message, error, payload, component);
export const logInfo = (message: string, payload: Record<string, any> = {}, component?: string): void => 
  logger.info(message, payload, component);
export const logWarn = (message: string, payload: Record<string, any> = {}, component?: string): void => 
  logger.warn(message, payload, component);
export const logDebug = (message: string, payload: Record<string, any> = {}, component?: string): void => 
  logger.debug(message, payload, component);
export const logUserAction = (action: string, payload: Record<string, any> = {}): void => 
  logger.userAction(action, payload);

// Export utility functions
export const withTraceId = <T extends (...args: any[]) => any>(fn: T, component?: string): T => {
  return ((...args: any[]) => {
    const traceId = logger.generateTraceId();
    logger.setTraceId(traceId);
    
    try {
      logger.debug(`Function ${fn.name} started`, { args: args.length }, component);
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            logger.debug(`Function ${fn.name} completed successfully`, { hasResult: !!value }, component);
            return value;
          })
          .catch((error: Error) => {
            logger.error(`Function ${fn.name} failed`, error, {}, component);
            throw error;
          });
      }
      
      logger.debug(`Function ${fn.name} completed successfully`, { hasResult: !!result }, component);
      return result;
    } catch (error) {
      logger.error(`Function ${fn.name} failed`, error as Error, {}, component);
      throw error;
    }
  }) as T;
};

export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T,
  component?: string
): Promise<T> => {
  const startTime = performance.now();
  logger.debug(`Performance measurement started: ${operation}`, {}, component);
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.debug(`Performance: ${operation} completed in ${duration}ms`, { success: true, duration }, component);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.debug(`Performance: ${operation} failed after ${duration}ms`, { success: false, duration }, component);
    logger.error(`Performance measurement failed: ${operation}`, error as Error, {}, component);
    throw error;
  }
};
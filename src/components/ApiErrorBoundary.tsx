/**
 * API-SPECIFIC ERROR BOUNDARY
 * 
 * Specialized error boundary for API calls with:
 * - Intelligent retry mechanisms
 * - Rate limit handling
 * - Network error recovery
 * - User-friendly error messages
 */

import React, { Component, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Wifi, Clock, Shield } from 'lucide-react';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'rate_limit' | 'auth' | 'server' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
  nextRetryIn: number;
}

interface ApiErrorBoundaryProps {
  children: ReactNode;
  apiName: string;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private countdownIntervalId: NodeJS.Timeout | null = null;

  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      nextRetryIn: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    const errorType = ApiErrorBoundary.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { apiName, onError } = this.props;
    const errorId = `API_ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Log API error with structured logging
    logger.error(`API Error in ${apiName}`, error, {
      errorId,
      apiName,
      errorType: this.state.errorType,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    }, 'ApiErrorBoundary');

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-retry for certain error types
    this.scheduleRetryIfAppropriate();
  }

  private static categorizeError(error: Error): ApiErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return 'rate_limit';
    }
    if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return 'auth';
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'server';
    }
    
    return 'unknown';
  }

  private scheduleRetryIfAppropriate = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { errorType, retryCount } = this.state;

    // Don't auto-retry auth errors or if max retries reached
    if (errorType === 'auth' || retryCount >= maxRetries) {
      return;
    }

    // Calculate retry delay with exponential backoff
    const delay = errorType === 'rate_limit' 
      ? 60000 // 1 minute for rate limits
      : retryDelay * Math.pow(2, retryCount); // Exponential backoff for others

    this.setState({ 
      isRetrying: true, 
      nextRetryIn: Math.ceil(delay / 1000) 
    });

    // Start countdown
    this.countdownIntervalId = setInterval(() => {
      this.setState(prev => ({
        nextRetryIn: Math.max(0, prev.nextRetryIn - 1)
      }));
    }, 1000);

    // Schedule retry
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);

    logger.info(`Auto-retry scheduled for ${this.props.apiName}`, {
      errorType,
      retryCount: retryCount + 1,
      delayMs: delay
    }, 'ApiErrorBoundary');
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      logger.warn(`Max retries reached for ${this.props.apiName}`, {
        retryCount: this.state.retryCount,
        maxRetries
      }, 'ApiErrorBoundary');
      return;
    }

    logger.info(`Manual retry initiated for ${this.props.apiName}`, {
      retryCount: this.state.retryCount + 1
    }, 'ApiErrorBoundary');

    // Clear timers
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }

    // Reset state and retry
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: this.state.retryCount + 1,
      isRetrying: false,
      nextRetryIn: 0
    });
  };

  private getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <Wifi className="h-6 w-6 text-red-600" />;
      case 'rate_limit':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'auth':
        return <Shield className="h-6 w-6 text-red-600" />;
      case 'server':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };

  private getErrorMessage = () => {
    const { apiName } = this.props;
    
    switch (this.state.errorType) {
      case 'network':
        return `We couldn't connect to ${apiName}. Please check your internet connection.`;
      case 'rate_limit':
        return `${apiName} is temporarily rate-limited. We'll retry automatically in a moment.`;
      case 'auth':
        return `Authentication failed for ${apiName}. You may need to reconnect your account.`;
      case 'server':
        return `${apiName} is experiencing technical difficulties. Our team has been notified.`;
      default:
        return `We encountered an issue with ${apiName}. Please try again.`;
    }
  };

  private getActionButtons = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount, isRetrying, nextRetryIn, errorType } = this.state;
    
    const canRetry = retryCount < maxRetries;
    const buttons = [];

    if (canRetry && !isRetrying) {
      buttons.push(
        <Button
          key="retry"
          onClick={this.handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      );
    }

    if (isRetrying) {
      buttons.push(
        <Button
          key="retrying"
          disabled
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          Retrying in {nextRetryIn}s...
        </Button>
      );
    }

    if (errorType === 'auth') {
      buttons.push(
        <Button
          key="reconnect"
          onClick={() => window.location.href = '/login'}
          variant="outline"
        >
          Reconnect Account
        </Button>
      );
    }

    buttons.push(
      <Button
        key="dashboard"
        onClick={() => window.location.href = '/dashboard'}
        variant="outline"
      >
        Return to Dashboard
      </Button>
    );

    return buttons;
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }
  }

  render() {
    const { children, apiName } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              {this.getErrorIcon()}
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {apiName} Error
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              {this.getErrorMessage()}
            </p>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-xs bg-gray-100 p-2 rounded">
                <summary className="cursor-pointer font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            {/* Retry information */}
            <div className="text-center text-sm text-gray-500">
              <p>Attempt {this.state.retryCount + 1} of {this.props.maxRetries || 3}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {this.getActionButtons()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Specialized API error boundaries for different services

export const GitHubApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ApiErrorBoundary
    apiName="GitHub API"
    maxRetries={3}
    retryDelay={2000}
    onError={(error, errorInfo) => {
      logger.error('GitHub API error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'github_api'
      }, 'GitHubAPI');
    }}
  >
    {children}
  </ApiErrorBoundary>
);

export const MCPApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ApiErrorBoundary
    apiName="MCP Services"
    maxRetries={2}
    retryDelay={1500}
    onError={(error, errorInfo) => {
      logger.error('MCP API error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'mcp_api'
      }, 'MCPAPI');
    }}
  >
    {children}
  </ApiErrorBoundary>
);

export const AuthApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ApiErrorBoundary
    apiName="Authentication"
    maxRetries={1}
    retryDelay={1000}
    onError={(error, errorInfo) => {
      logger.error('Auth API error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'auth_api'
      }, 'AuthAPI');
    }}
  >
    {children}
  </ApiErrorBoundary>
);

export default ApiErrorBoundary;
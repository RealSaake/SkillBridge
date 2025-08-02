/**
 * Comprehensive Error Boundary System
 * 
 * Provides user-friendly error handling with recovery options,
 * structured logging, and proper error reporting.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  copied: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  component?: string;
  showErrorDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, component = 'ErrorBoundary' } = this.props;
    const { errorId } = this.state;

    // Log the error with structured logging
    logger.error(
      'React Error Boundary caught an error',
      error,
      {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: component,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      component
    );

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error(
          'Error in custom error handler',
          handlerError as Error,
          { originalErrorId: errorId },
          component
        );
      }
    }

    // Report to external error tracking service (if configured)
    if (errorId) {
      this.reportToExternalService(error, errorInfo, errorId);
    }
  }

  private reportToExternalService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just log it
    logger.info('Error reported to external service', {
      errorId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      componentStack: errorInfo.componentStack
    }, 'ERROR_REPORTING');
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      logger.warn('Maximum retry attempts reached', {
        retryCount,
        maxRetries,
        errorId: this.state.errorId
      }, this.props.component);
      return;
    }

    logger.info('Retrying after error', {
      retryCount: retryCount + 1,
      errorId: this.state.errorId
    }, this.props.component);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: retryCount + 1,
      copied: false
    });

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Add a small delay before retry to prevent rapid retries
    this.retryTimeoutId = setTimeout(() => {
      // Force a re-render
      this.forceUpdate();
    }, 1000);
  };

  private handleGoHome = () => {
    logger.userAction('error_boundary_go_home', {
      errorId: this.state.errorId,
      fromUrl: window.location.href
    });

    // Navigate to home page
    window.location.href = '/';
  };

  private copyErrorId = async () => {
    const { errorId } = this.state;
    if (!errorId) return;

    try {
      await navigator.clipboard.writeText(errorId);
      this.setState({ copied: true });
      
      logger.userAction('error_id_copied', { errorId });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch (error) {
      logger.error('Failed to copy error ID', error as Error, { errorId });
    }
  };

  private getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      return 'We couldn\'t load part of the application. This usually happens after an update.';
    }
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
      return 'We couldn\'t connect to our servers. Please check your internet connection.';
    }
    
    if (errorMessage.includes('GitHub') || errorMessage.includes('authentication')) {
      return 'We couldn\'t load your GitHub data. You may need to reconnect your account.';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('data')) {
      return 'We encountered an issue with your data. Please try refreshing the page.';
    }

    // Generic fallback
    return 'Something unexpected happened. Our team has been notified and is working on a fix.';
  };

  private getRecoveryActions = (error: Error) => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;

    const actions = [];

    // Always show "Try Again" if retries are available
    if (canRetry) {
      actions.push({
        label: 'Try Again',
        icon: RefreshCw,
        onClick: this.handleRetry,
        variant: 'default' as const,
        primary: true
      });
    }

    // Show "Go Home" for navigation errors or when retries are exhausted
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!canRetry || errorMessage.includes('route') || errorMessage.includes('navigation')) {
      actions.push({
        label: 'Return to Dashboard',
        icon: Home,
        onClick: this.handleGoHome,
        variant: 'outline' as const,
        primary: !canRetry
      });
    }

    // Show "Reload Page" for chunk loading errors
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      actions.push({
        label: 'Reload Page',
        icon: RefreshCw,
        onClick: () => window.location.reload(),
        variant: 'default' as const,
        primary: true
      });
    }

    return actions;
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorId, copied } = this.state;
    const { children, fallback, showErrorDetails = false } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    if (!error || !errorId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">
                  We're having trouble loading this page. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const errorMessage = this.getErrorMessage(error);
    const recoveryActions = this.getRecoveryActions(error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Oops! Something went wrong
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* User-friendly error message */}
            <p className="text-gray-600 text-center">
              {errorMessage}
            </p>

            {/* Error ID for support */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Error ID</p>
                  <p className="text-xs text-gray-500 font-mono">{errorId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.copyErrorId}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reference this ID when contacting support
              </p>
            </div>

            {/* Recovery actions */}
            <div className="flex flex-col gap-2">
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Technical details (only in development or when explicitly enabled) */}
            {(process.env.NODE_ENV === 'development' || showErrorDetails) && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32">
                  <p><strong>Error:</strong> {error instanceof Error ? error.message : String(error)}</p>
                  {error instanceof Error && error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
                  )}
                </div>
              </details>
            )}

            {/* Help text */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact our support team with the Error ID above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Specialized error boundaries for different components

export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    component="Dashboard"
    maxRetries={2}
    onError={(error, errorInfo) => {
      logger.error('Dashboard error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'dashboard'
      }, 'Dashboard');
    }}
  >
    {children}
  </ErrorBoundary>
);

export const GitHubDataErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    component="GitHubData"
    maxRetries={3}
    onError={(error, errorInfo) => {
      logger.error('GitHub data error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'github_data'
      }, 'GitHubData');
    }}
  >
    {children}
  </ErrorBoundary>
);

export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    component="Auth"
    maxRetries={1}
    onError={(error, errorInfo) => {
      logger.error('Auth error boundary triggered', error, {
        componentStack: errorInfo.componentStack,
        context: 'authentication'
      }, 'Auth');
    }}
  >
    {children}
  </ErrorBoundary>
);

// Component-level Error Boundary
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName: string;
  customMessage?: string;
  showRetry?: boolean;
}> = ({ children, componentName, customMessage, showRetry = true }) => (
  <ErrorBoundary
    component={componentName}
    maxRetries={3}
  >
    {children}
  </ErrorBoundary>
);

// GitHub-specific Error Boundary
export const GitHubErrorBoundary: React.FC<{
  children: ReactNode;
  operation: string;
}> = ({ children, operation }) => (
  <ComponentErrorBoundary
    componentName={`GitHub${operation}`}
    customMessage={`We couldn't load your GitHub ${operation.toLowerCase()} right now.`}
    showRetry={true}
  >
    {children}
  </ComponentErrorBoundary>
);

export default ErrorBoundary;
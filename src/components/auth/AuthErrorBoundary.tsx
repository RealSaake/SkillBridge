import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  retryCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Authentication Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      console.error('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, redirect to login
      window.location.href = '/login';
    }
  };

  handleResetAuth = () => {
    // Clear all authentication data
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isAuthError = this.state.error?.message.includes('authorization') || 
                         this.state.error?.message.includes('token') ||
                         this.state.error?.message.includes('authentication');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800">
                {isAuthError ? 'Authentication Error' : 'Something Went Wrong'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {isAuthError 
                  ? 'There was a problem with your authentication. Please try signing in again.'
                  : 'An unexpected error occurred. We\'re working to fix this issue.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left bg-gray-100 p-3 rounded text-sm">
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Component Stack</summary>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.errorInfo}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleResetAuth}
                  variant="outline"
                  className="w-full"
                >
                  Sign In Again
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
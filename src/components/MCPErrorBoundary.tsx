import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { clearMCPCache } from '../hooks/usePersonalizedMCP';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class MCPErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('MCP Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    // Clear MCP cache and reset error state
    clearMCPCache();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p>Something went wrong with the career insights service.</p>
                <p className="text-sm text-gray-600">
                  This might be due to network issues or temporary service unavailability.
                </p>
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useMCPErrorHandler() {
  const handleError = (error: Error) => {
    console.error('MCP Error:', error);
    // You could also send this to an error reporting service
  };

  const retry = () => {
    clearMCPCache();
    window.location.reload();
  };

  return { handleError, retry };
}
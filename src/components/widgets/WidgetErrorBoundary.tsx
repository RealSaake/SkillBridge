import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WidgetErrorInfo } from '../../types/widget-types';
import { terminalLogger } from '../../utils/terminalLogger';

interface Props {
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  onError?: (error: Error, errorInfo: WidgetErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: WidgetErrorInfo | null;
  retryCount: number;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const widgetErrorInfo: WidgetErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: 'WidgetErrorBoundary',
      eventType: 'render_error'
    };

    this.setState({
      errorInfo: widgetErrorInfo
    });

    terminalLogger.error('WidgetErrorBoundary', `Widget error caught: ${this.props.widgetId}`, {
      widgetType: this.props.widgetType,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    if (this.props.onError) {
      this.props.onError(error, widgetErrorInfo);
    }

    // Auto-retry logic for transient errors
    if (this.state.retryCount < this.maxRetries && this.isRetryableError(error)) {
      this.scheduleRetry();
    }
  }

  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /temporary/i
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleRetry = () => {
    const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff
    
    terminalLogger.info('WidgetErrorBoundary', `Scheduling retry for widget: ${this.props.widgetId}`, {
      retryCount: this.state.retryCount + 1,
      retryDelay
    });

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, retryDelay);
  };

  private handleManualRetry = () => {
    terminalLogger.info('WidgetErrorBoundary', `Manual retry triggered for widget: ${this.props.widgetId}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleDismissError = () => {
    terminalLogger.info('WidgetErrorBoundary', `Error dismissed for widget: ${this.props.widgetId}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="widget-error-boundary p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Widget Error
              </h3>
              <p className="text-red-700 mb-2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <p className="text-sm text-red-600 mb-4">
                Widget: {this.props.widgetType} ({this.props.widgetId})
              </p>
              
              {this.state.retryCount < this.maxRetries && (
                <div className="flex gap-2">
                  <button
                    onClick={this.handleManualRetry}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Retry ({this.maxRetries - this.state.retryCount} attempts left)
                  </button>
                  <button
                    onClick={this.handleDismissError}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {this.state.retryCount >= this.maxRetries && (
                <div className="text-sm text-red-600">
                  <p>Maximum retry attempts reached. Please refresh the page or contact support.</p>
                  <button
                    onClick={this.handleDismissError}
                    className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Dismiss Widget
                  </button>
                </div>
              )}
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-red-600">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto">
                {this.state.error?.stack}
              </pre>
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
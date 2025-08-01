/**
 * MANDATORY TRACE ID CONTEXT
 * 
 * Ensures every React component and API call has a trace ID
 * for request tracking and debugging
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface TraceContextType {
  traceId: string;
  generateNewTrace: () => string;
  setUserId: (userId: string) => void;
  logUserAction: (action: string, payload?: Record<string, any>) => void;
  logError: (message: string, error?: Error, payload?: Record<string, any>, component?: string) => void;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

interface TraceProviderProps {
  children: ReactNode;
}

export const TraceProvider: React.FC<TraceProviderProps> = ({ children }) => {
  const [traceId, setTraceId] = useState<string>('');

  useEffect(() => {
    // Generate initial trace ID when app starts
    const initialTraceId = logger.generateTraceId();
    logger.setTraceId(initialTraceId);
    setTraceId(initialTraceId);

    // Log app initialization
    logger.info('Application initialized', {
      appVersion: process.env.REACT_APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }, 'TraceProvider');
  }, []);

  const generateNewTrace = (): string => {
    const newTraceId = logger.generateTraceId();
    logger.setTraceId(newTraceId);
    setTraceId(newTraceId);
    return newTraceId;
  };

  const setUserId = (userId: string): void => {
    logger.setUserId(userId);
    logger.info('User context set', { userId }, 'TraceProvider');
  };

  const logUserAction = (action: string, payload: Record<string, any> = {}): void => {
    logger.userAction(action, payload);
  };

  const logError = (message: string, error?: Error, payload: Record<string, any> = {}, component?: string): void => {
    logger.error(message, error, payload, component);
  };

  const value: TraceContextType = {
    traceId,
    generateNewTrace,
    setUserId,
    logUserAction,
    logError
  };

  return (
    <TraceContext.Provider value={value}>
      {children}
    </TraceContext.Provider>
  );
};

export const useTrace = (): TraceContextType => {
  const context = useContext(TraceContext);
  if (context === undefined) {
    throw new Error('useTrace must be used within a TraceProvider');
  }
  return context;
};

/**
 * HOC to automatically generate new trace ID for page components
 */
export function withTraceId<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return function TracedComponent(props: P) {
    const { generateNewTrace, logUserAction } = useTrace();

    useEffect(() => {
      // Generate new trace ID for each page navigation
      const newTraceId = generateNewTrace();
      
      // Log page view
      logUserAction('page_view', {
        component: componentName,
        url: window.location.href,
        referrer: document.referrer
      });

      logger.info(`Component mounted: ${componentName}`, {
        traceId: newTraceId,
        component: componentName
      }, componentName);
    }, [generateNewTrace, logUserAction]);

    return <Component {...props} />;
  };
}
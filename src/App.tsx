import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { TraceProvider } from './contexts/TraceContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingQuiz } from './components/OnboardingQuiz';
import { ProfileSetup } from './components/auth/ProfileSetup';
import { DevLanding } from './components/DevLanding';
import Dashboard from './components/Dashboard';
import PublicProfile from './components/PublicProfile';
import ProfileSettings from './components/ProfileSettings';
import { CommandCenter } from './components/CommandCenter';
import { 
  ErrorBoundary, 
  DashboardErrorBoundary, 
  AuthErrorBoundary
} from './components/ErrorBoundary';
import { logger } from './utils/logger';



interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Landing page wrapper with navigation
function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage 
      onGetStarted={() => navigate('/login')}
      onSignIn={() => navigate('/login')}
    />
  );
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize structured logging on app start
  useEffect(() => {
    // Generate initial trace ID and log app initialization
    const appTraceId = logger.generateTraceId();
    logger.setTraceId(appTraceId);

    logger.info('SkillBridge application initialized', {
      appVersion: '2.0.0',
      environment: process.env.NODE_ENV,
      apiUrl: process.env.REACT_APP_API_URL,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      referrer: document.referrer
    }, 'App');

    // Log any unhandled errors (but throttle MCP errors)
    let mcpErrorCount = 0;
    const mcpErrorThreshold = 5;
    const mcpErrorResetTime = 60000; // 1 minute
    let lastMcpErrorReset = Date.now();

    const handleUnhandledError = (event: ErrorEvent) => {
      // Check if this is an MCP-related error
      const isMcpError = event.message?.includes('MCP') || 
                        event.filename?.includes('usePersonalizedMCP') ||
                        event.message?.includes('Failed to fetch') ||
                        event.message?.includes('ERR_INSUFFICIENT_RESOURCES');

      if (isMcpError) {
        // Reset counter if enough time has passed
        if (Date.now() - lastMcpErrorReset > mcpErrorResetTime) {
          mcpErrorCount = 0;
          lastMcpErrorReset = Date.now();
        }

        mcpErrorCount++;
        
        // Only log the first few MCP errors to prevent spam
        if (mcpErrorCount <= mcpErrorThreshold) {
          logger.warn('MCP service error (throttled)', {
            filename: event.filename,
            errorCount: mcpErrorCount,
            threshold: mcpErrorThreshold,
            message: event.message
          }, 'App');
        }
        
        // Prevent the error from propagating to avoid console spam
        event.preventDefault();
        return;
      }

      logger.error('Unhandled JavaScript error', new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, 'App');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason);
      const isMcpError = reason.includes('MCP') || 
                        reason.includes('Failed to fetch') ||
                        reason.includes('ERR_INSUFFICIENT_RESOURCES') ||
                        reason.includes('skillbridge-career-dev.cloudfunctions.net');

      if (isMcpError) {
        // Reset counter if enough time has passed
        if (Date.now() - lastMcpErrorReset > mcpErrorResetTime) {
          mcpErrorCount = 0;
          lastMcpErrorReset = Date.now();
        }

        mcpErrorCount++;
        
        // Only log the first few MCP errors to prevent spam
        if (mcpErrorCount <= mcpErrorThreshold) {
          logger.warn('MCP service promise rejection (throttled)', {
            reason: reason,
            errorCount: mcpErrorCount,
            threshold: mcpErrorThreshold
          }, 'App');
        }
        
        // Prevent the error from propagating
        event.preventDefault();
        return;
      }

      logger.error('Unhandled promise rejection', 
        event.reason instanceof Error ? event.reason : new Error(reason), 
        {
          reason: reason
        }, 'App');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ErrorBoundary component="App">
      <TraceProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <AuthProvider>
              <Router>
                <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-900'
                  }`}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPageWrapper />} />
                    <Route 
                      path="/login" 
                      element={
                        <AuthErrorBoundary>
                          <LoginPage />
                        </AuthErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/auth/callback" 
                      element={
                        <AuthErrorBoundary>
                          <AuthCallback />
                        </AuthErrorBoundary>
                      } 
                    />
                    
                    {/* Public profile routes */}
                    <Route 
                      path="/profile/:username" 
                      element={
                        <ErrorBoundary component="PublicProfile">
                          <PublicProfile />
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/u/:username" 
                      element={
                        <ErrorBoundary component="PublicProfile">
                          <PublicProfile />
                        </ErrorBoundary>
                      } 
                    />

                    {/* Protected routes with specialized error boundaries */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="Onboarding">
                            <OnboardingQuiz />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/setup"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="ProfileSetup">
                            <ProfileSetup />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute requireProfile={true}>
                          <DashboardErrorBoundary>
                            <Dashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/profile"
                      element={
                        <ProtectedRoute requireProfile={true}>
                          <ErrorBoundary component="ProfileSettings">
                            <ProfileSettings />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/command-center"
                      element={
                        <ProtectedRoute requireProfile={true}>
                          <ErrorBoundary component="CommandCenter">
                            <CommandCenter />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />

                    {/* Development routes - bypass auth */}
                    <Route 
                      path="/dev" 
                      element={
                        <ErrorBoundary component="DevLanding">
                          <DevLanding />
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/dev-dashboard" 
                      element={
                        <DashboardErrorBoundary>
                          <Dashboard />
                        </DashboardErrorBoundary>
                      } 
                    />

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </Router>
            </AuthProvider>
          </ThemeContext.Provider>
        </QueryClientProvider>
      </TraceProvider>
    </ErrorBoundary>
  );
}

export default App;
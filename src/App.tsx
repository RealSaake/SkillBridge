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
import { 
  ErrorBoundary, 
  DashboardErrorBoundary, 
  AuthErrorBoundary,
  GitHubDataErrorBoundary 
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

    // Log any unhandled errors
    const handleUnhandledError = (event: ErrorEvent) => {
      logger.error('Unhandled JavaScript error', new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, 'App');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', 
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)), 
        {
          reason: String(event.reason)
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
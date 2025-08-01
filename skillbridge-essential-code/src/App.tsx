import { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfileSetup } from './components/auth/ProfileSetup';
import { DevLanding } from './components/DevLanding';
import Dashboard from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  console.log('🚀 App Component Loading...');
  console.log('🌐 Window location:', window.location.href);
  console.log('📦 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ErrorBoundary>
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
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Protected routes */}
                  <Route
                    path="/profile/setup"
                    element={
                      <ProtectedRoute>
                        <ProfileSetup />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requireProfile={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Development routes - bypass auth */}
                  <Route path="/dev" element={<DevLanding />} />
                  <Route path="/dev-dashboard" element={<Dashboard />} />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
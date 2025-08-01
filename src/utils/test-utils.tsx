import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

// Combined Test Providers
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  const themeValue = {
    theme: 'light' as const,
    toggleTheme: () => {},
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={themeValue}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test Utilities for Real MCP Integration
// Note: Mock data factories have been removed as part of Sprint 2 mock debt cleanup
// Tests should now use real MCP server responses or MSW for HTTP mocking

// Helper for creating test error objects that match real MCP error structure
export const createTestMCPError = (code: string, message: string) => ({
  code,
  message,
  details: null,
  timestamp: new Date().toISOString(),
  serverName: 'test-server',
  toolName: 'test-tool',
});

// Common test error scenarios
export const TEST_ERRORS = {
  NETWORK_ERROR: createTestMCPError('NETWORK_ERROR', 'Network request failed'),
  RATE_LIMIT: createTestMCPError('RATE_LIMIT', 'Rate limit exceeded'),
  TIMEOUT: createTestMCPError('TIMEOUT', 'Request timed out'),
  INVALID_PARAMS: createTestMCPError('INVALID_PARAMS', 'Invalid parameters provided'),
  SERVER_ERROR: createTestMCPError('SERVER_ERROR', 'Internal server error')
};
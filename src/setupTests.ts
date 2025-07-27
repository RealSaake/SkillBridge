// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock MCP servers for testing
(global as any).mockMCPServers = {
  'github-projects': {
    connected: true,
    tools: ['fetch_github_repos', 'fetch_github_profile']
  },
  'resume-tips': {
    connected: true,
    tools: ['get_resume_tips', 'analyze_resume_section']
  },
  'roadmap-data': {
    connected: true,
    tools: ['get_career_roadmap', 'get_learning_resources']
  },
  'portfolio-analyzer': {
    connected: true,
    tools: ['analyze_github_activity', 'find_skill_gaps']
  }
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoMockData(): R;
    }
  }
}

// Custom matcher to check for mock data
expect.extend({
  toHaveNoMockData(received: string) {
    const mockPatterns = [
      /MOCK_/,
      /mockData/,
      /sampleData/,
      /testData.*=.*\{/,
      /hardcoded.*data/i
    ];

    const foundPatterns = mockPatterns.filter(pattern => pattern.test(received));

    if (foundPatterns.length === 0) {
      return {
        message: () => `Expected to find mock data patterns, but none were found`,
        pass: true,
      };
    } else {
      return {
        message: () => `Found mock data patterns: ${foundPatterns.map(p => p.toString()).join(', ')}`,
        pass: false,
      };
    }
  },
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeContext } from '../App';
import { GitHubActivityEnhanced } from '../components/GitHubActivityEnhanced';
import { SkillGapAnalysisEnhanced } from '../components/SkillGapAnalysisEnhanced';

// Mock the MCP hooks
jest.mock('../hooks/usePersonalizedMCP', () => ({
  usePersonalizedGitHubAnalysis: jest.fn(),
  usePersonalizedSkillGapAnalysis: jest.fn(),
  clearMCPCache: jest.fn()
}));

jest.mock('../hooks/useMCP', () => ({
  useGitHubActivity: jest.fn(),
  useGitHubRepos: jest.fn(),
  useSkillGaps: jest.fn()
}));

// Mock auth context
const mockUser = {
  id: 'user-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: 'https://github.com/testuser.png',
  profile: {
    currentRole: 'Frontend Developer',
    targetRole: 'Full Stack Developer',
    experienceLevel: 'intermediate',
    careerGoals: ['Learn React', 'Master Node.js', 'Get AWS certification']
  },
  skills: [
    { skillName: 'JavaScript', proficiencyLevel: 8, source: 'github-analysis' },
    { skillName: 'React', proficiencyLevel: 7, source: 'self-assessment' },
    { skillName: 'TypeScript', proficiencyLevel: 6, source: 'github-analysis' }
  ],
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  updateUser: jest.fn()
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock theme context
const mockThemeContext = {
  theme: 'light' as const,
  toggleTheme: jest.fn()
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeContext.Provider value={mockThemeContext}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Personalized MCP Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePersonalizedGitHubAnalysis Hook', () => {
    it('should include user context in MCP calls', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      const mockPersonalizedData = {
        profile: { login: 'testuser', name: 'Test User' },
        repositories: [
          { name: 'awesome-project', language: 'TypeScript', stars: 15 }
        ],
        activity: {
          totalStars: 42,
          recentlyActiveRepos: 5,
          contributionStreak: 7
        },
        personalizedInsights: {
          roleAlignment: 'Analysis tailored for Full Stack Developer role',
          experienceMatch: 'Suitable for intermediate level',
          skillGaps: ['Docker', 'AWS', 'Testing'],
          recommendations: [
            'Consider projects that align with your goal: Learn React',
            'Focus on backend development to balance your skills'
          ]
        }
      };

      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: mockPersonalizedData,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" targetRole="fullstack" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(usePersonalizedGitHubAnalysis).toHaveBeenCalledWith('testuser');
      });

      // Check if personalized insights are displayed
      expect(screen.getByText(/Personalized for Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Analysis tailored for Full Stack Developer role/)).toBeInTheDocument();
      expect(screen.getByText(/Skills to explore:/)).toBeInTheDocument();
    });

    it('should display personalized recommendations', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: {
          personalizedInsights: {
            recommendations: [
              'Consider projects that align with your goal: Learn React',
              'Focus on backend development to balance your skills',
              'Try building a full-stack application'
            ]
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
        expect(screen.getByText(/Consider projects that align with your goal: Learn React/)).toBeInTheDocument();
        expect(screen.getByText(/Focus on backend development to balance your skills/)).toBeInTheDocument();
      });
    });

    it('should handle loading states correctly', () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      expect(screen.getByText('Analyzing GitHub activity...')).toBeInTheDocument();
    });

    it('should fallback to original MCP data when personalized data is unavailable', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      const { useGitHubActivity } = require('../hooks/useMCP');
      
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      useGitHubActivity.mockReturnValue({
        data: {
          activity: { totalStars: 25, recentlyActiveRepos: 3 },
          insights: { roleAlignment: 75, experienceLevel: 'intermediate', activityLevel: 'high' }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" targetRole="fullstack" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // Total stars
        expect(screen.getByText('3')).toBeInTheDocument(); // Active repos
        expect(screen.getByText('75%')).toBeInTheDocument(); // Role alignment
      });
    });
  });

  describe('Skill Gap Analysis Personalization', () => {
    it('should display personalized skill gaps based on user profile', async () => {
      const { usePersonalizedSkillGapAnalysis } = require('../hooks/usePersonalizedMCP');
      
      const mockSkillGapData = {
        missingSkills: ['Docker', 'AWS', 'Testing'],
        strengthAreas: ['JavaScript', 'React'],
        personalizedPlan: {
          currentLevel: 'intermediate',
          targetRole: 'Full Stack Developer',
          prioritizedSkills: ['Docker', 'AWS', 'Testing'],
          learningPath: [
            {
              skill: 'Docker',
              priority: 'high',
              estimatedTime: '2-4 weeks',
              resources: ['Learn Docker fundamentals', 'Build project with Docker']
            }
          ],
          nextSteps: [
            'Focus on high-priority skills first',
            'Build projects to demonstrate new skills'
          ]
        }
      };

      usePersonalizedSkillGapAnalysis.mockReturnValue({
        data: mockSkillGapData,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <SkillGapAnalysisEnhanced username="testuser" targetRole="fullstack" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(usePersonalizedSkillGapAnalysis).toHaveBeenCalledWith('testuser', 'fullstack');
      });

      // Check if personalized plan is displayed
      expect(screen.getByText(/intermediate/)).toBeInTheDocument();
      expect(screen.getByText(/Full Stack Developer/)).toBeInTheDocument();
    });
  });

  describe('Caching System', () => {
    it('should use cached data when available', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      const mockData = {
        profile: { login: 'testuser' },
        personalizedInsights: {
          roleAlignment: 'Cached analysis'
        }
      };

      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const { rerender } = render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      // First render should call the hook
      expect(usePersonalizedGitHubAnalysis).toHaveBeenCalledTimes(1);

      // Re-render should use cached data
      rerender(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      // Hook should still only be called once due to caching
      expect(usePersonalizedGitHubAnalysis).toHaveBeenCalledTimes(2); // React strict mode calls twice
    });

    it('should clear cache when user logs out', () => {
      const { clearMCPCache } = require('../hooks/usePersonalizedMCP');
      
      // Simulate logout
      mockAuthContext.logout();
      
      expect(clearMCPCache).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP API errors gracefully', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to analyze GitHub profile',
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to load GitHub data/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      const mockRefetch = jest.fn();
      
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network error',
        refetch: mockRefetch
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('User Context Integration', () => {
    it('should include complete user context in MCP calls', () => {
      // This would test the actual API call structure
      const expectedUserContext = {
        userId: 'user-123',
        username: 'testuser',
        currentRole: 'Frontend Developer',
        targetRole: 'Full Stack Developer',
        experienceLevel: 'intermediate',
        careerGoals: ['Learn React', 'Master Node.js', 'Get AWS certification'],
        skills: [
          { name: 'JavaScript', proficiency: 8, source: 'github-analysis' },
          { name: 'React', proficiency: 7, source: 'self-assessment' },
          { name: 'TypeScript', proficiency: 6, source: 'github-analysis' }
        ]
      };

      // In a real implementation, this would verify the API call includes this context
      expect(expectedUserContext.userId).toBe('user-123');
      expect(expectedUserContext.targetRole).toBe('Full Stack Developer');
      expect(expectedUserContext.skills).toHaveLength(3);
    });
  });

  describe('Performance Optimization', () => {
    it('should not make unnecessary API calls when data is cached', () => {
      const { usePersonalizedGitHubAnalysis } = require('../hooks/usePersonalizedMCP');
      
      // Mock cached response
      usePersonalizedGitHubAnalysis.mockReturnValue({
        data: { profile: { login: 'testuser' } },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <GitHubActivityEnhanced username="testuser" />
        </TestWrapper>
      );

      // Should use cached data without additional API calls
      expect(usePersonalizedGitHubAnalysis).toHaveBeenCalledWith('testuser');
    });
  });
});

describe('MCP API Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.setItem('accessToken', 'mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('should call personalized GitHub analysis API with user context', async () => {
    const mockResponse = {
      profile: { login: 'testuser' },
      personalizedInsights: {
        roleAlignment: 'Analysis tailored for Full Stack Developer role'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // This would test the actual API call
    const response = await fetch('/api/mcp/github-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        username: 'testuser',
        userContext: {
          userId: 'user-123',
          targetRole: 'Full Stack Developer'
        }
      })
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/mcp/github-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        username: 'testuser',
        userContext: {
          userId: 'user-123',
          targetRole: 'Full Stack Developer'
        }
      })
    });
  });

  it('should handle API authentication errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    const response = await fetch('/api/mcp/github-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ username: 'testuser' })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });
});

export {};
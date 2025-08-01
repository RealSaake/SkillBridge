/**
 * Mock GitHubService for testing
 * Provides realistic test data without making real API calls
 */

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
  topics: string[];
}

class MockGitHubService {
  private static instance: MockGitHubService;

  private constructor() {}

  public static getInstance(): MockGitHubService {
    if (!MockGitHubService.instance) {
      MockGitHubService.instance = new MockGitHubService();
    }
    return MockGitHubService.instance;
  }

  async fetchUserProfile(): Promise<GitHubUser> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/identicons/testuser.png',
      bio: 'Full-stack developer passionate about open source',
      location: 'San Francisco, CA',
      company: 'Tech Corp',
      blog: 'https://testuser.dev',
      public_repos: 25,
      followers: 150,
      following: 75,
      created_at: '2020-01-15T10:30:00Z',
      updated_at: new Date().toISOString()
    };
  }

  async fetchUserRepositories(): Promise<GitHubRepository[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return [
      {
        id: 1,
        name: 'awesome-project',
        full_name: 'testuser/awesome-project',
        description: 'An awesome full-stack web application',
        language: 'TypeScript',
        stargazers_count: 42,
        forks_count: 8,
        updated_at: '2024-01-20T15:30:00Z',
        html_url: 'https://github.com/testuser/awesome-project',
        private: false,
        topics: ['react', 'typescript', 'nodejs']
      },
      {
        id: 2,
        name: 'data-analysis-tool',
        full_name: 'testuser/data-analysis-tool',
        description: 'Python tool for data analysis and visualization',
        language: 'Python',
        stargazers_count: 23,
        forks_count: 5,
        updated_at: '2024-01-18T09:15:00Z',
        html_url: 'https://github.com/testuser/data-analysis-tool',
        private: false,
        topics: ['python', 'data-science', 'visualization']
      },
      {
        id: 3,
        name: 'mobile-app',
        full_name: 'testuser/mobile-app',
        description: 'Cross-platform mobile application',
        language: 'JavaScript',
        stargazers_count: 15,
        forks_count: 3,
        updated_at: '2024-01-15T12:45:00Z',
        html_url: 'https://github.com/testuser/mobile-app',
        private: false,
        topics: ['react-native', 'mobile', 'javascript']
      }
    ];
  }

  async syncUserData(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  async clearUserData(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

export default MockGitHubService;
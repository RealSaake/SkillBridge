import { userDataIsolation } from './userDataIsolation';

// Mock fetch globally
global.fetch = jest.fn();

describe('UserDataIsolation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any existing session
    userDataIsolation.clearSession();
    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  describe('Session Management', () => {
    it('should initialize session with valid tokens', () => {
      const currentTime = Date.now();
      const accessToken = `github_12345_${currentTime}_` + Buffer.from('test_github_token').toString('base64');
      const refreshToken = `refresh_12345_${currentTime}`;
      
      const result = userDataIsolation.initializeSession(accessToken, refreshToken);
      expect(result).toBe(true);
      
      const session = userDataIsolation.getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('12345');
    });

    it('should reject invalid token format', () => {
      const result = userDataIsolation.initializeSession('invalid_token', 'invalid_refresh');
      expect(result).toBe(false);
      
      const session = userDataIsolation.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should reject expired tokens', () => {
      const oldTimestamp = Date.now() - (50 * 60 * 60 * 1000); // 50 hours ago (beyond test limit)
      const accessToken = `github_12345_${oldTimestamp}_` + Buffer.from('test_github_token').toString('base64');
      const refreshToken = `refresh_12345_${oldTimestamp}`;
      
      const result = userDataIsolation.initializeSession(accessToken, refreshToken);
      expect(result).toBe(false);
    });

    it('should clear session and cache', () => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      
      userDataIsolation.initializeSession(accessToken, refreshToken);
      expect(userDataIsolation.getCurrentSession()).not.toBeNull();
      
      userDataIsolation.clearSession();
      expect(userDataIsolation.getCurrentSession()).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Data Validation', () => {
    beforeEach(() => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      userDataIsolation.initializeSession(accessToken, refreshToken);
    });

    it('should validate user data belongs to current user', async () => {
      // Mock fetch for GitHub API
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 12345,
          login: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          avatar_url: 'https://github.com/avatar.jpg'
        })
      });

      const userData = await userDataIsolation.fetchUserProfile();
      expect(userData).not.toBeNull();
      expect(userData?.id).toBe(12345);
      expect(userData?.login).toBe('testuser');
    });

    it('should reject data from different user', async () => {
      // Mock fetch returning data for different user
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 67890, // Different user ID
          login: 'otheruser',
          name: 'Other User'
        })
      });

      await expect(userDataIsolation.fetchUserProfile()).rejects.toThrow('User data validation failed');
    });

    it('should handle GitHub API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(userDataIsolation.fetchUserProfile()).rejects.toThrow('GitHub token expired or invalid');
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize malicious input', () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Test User',
        bio: 'javascript:alert("xss")',
        location: 'onclick="alert(1)" New York'
      };

      // Access private method through any cast for testing
      const sanitized = (userDataIsolation as any).sanitizeInput(maliciousData);
      
      expect(sanitized.name).toBe('Test User');
      expect(sanitized.bio).toBe('alert("xss")'); // javascript: is removed
      expect(sanitized.location).toBe('"alert(1)" New York'); // onclick= is removed but quotes remain
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      userDataIsolation.initializeSession(accessToken, refreshToken);
    });

    it('should cache and return cached data', async () => {
      const mockUserData = {
        id: 12345,
        login: 'testuser',
        name: 'Test User'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });

      // First call should fetch from API
      const userData1 = await userDataIsolation.fetchUserProfile();
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const userData2 = await userDataIsolation.fetchUserProfile();
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(userData1).toEqual(userData2);
    });

    it('should clear cache when session is cleared', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 12345, login: 'testuser' })
      });

      await userDataIsolation.fetchUserProfile();
      expect(fetch).toHaveBeenCalledTimes(1);

      userDataIsolation.clearSession();
      (fetch as jest.Mock).mockClear(); // Clear the mock call count

      // Initialize new session
      const accessToken = 'github_67890_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_67890_' + Date.now();
      userDataIsolation.initializeSession(accessToken, refreshToken);

      // Mock different user data
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 67890, login: 'newuser' })
      });

      await userDataIsolation.fetchUserProfile();
      expect(fetch).toHaveBeenCalledTimes(1); // New fetch call after clearing
    });
  });

  describe('Repository Isolation', () => {
    beforeEach(() => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      userDataIsolation.initializeSession(accessToken, refreshToken);
    });

    it('should filter repositories to only user owned ones', async () => {
      // First, we need to fetch the user profile to get it cached
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 12345,
          login: 'testuser'
        })
      });
      
      // Fetch user profile first to cache it
      await userDataIsolation.fetchUserProfile();
      
      // Now mock the repositories call
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, full_name: 'testuser/repo1', name: 'repo1' },
          { id: 2, full_name: 'otheruser/repo2', name: 'repo2' }, // Should be filtered out
          { id: 3, full_name: 'testuser/repo3', name: 'repo3' }
        ])
      });

      const repos = await userDataIsolation.fetchUserRepositories();
      expect(repos).toHaveLength(2);
      expect(repos[0].full_name).toBe('testuser/repo1');
      expect(repos[1].full_name).toBe('testuser/repo3');
    });
  });

  describe('Session Integrity', () => {
    it('should validate session integrity', () => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      
      userDataIsolation.initializeSession(accessToken, refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      expect(userDataIsolation.validateSessionIntegrity()).toBe(true);
    });

    it('should detect session tampering', () => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      
      userDataIsolation.initializeSession(accessToken, refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Tamper with localStorage
      localStorage.setItem('accessToken', 'tampered_token');
      
      expect(userDataIsolation.validateSessionIntegrity()).toBe(false);
      expect(userDataIsolation.getCurrentSession()).toBeNull();
    });
  });

  describe('Multi-User Isolation', () => {
    it('should prevent data leakage between users', async () => {
      // User 1 session
      const user1AccessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('user1_token').toString('base64');
      const user1RefreshToken = 'refresh_12345_' + Date.now();
      
      userDataIsolation.initializeSession(user1AccessToken, user1RefreshToken);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 12345,
          login: 'user1',
          name: 'User One'
        })
      });
      
      const user1Data = await userDataIsolation.fetchUserProfile();
      expect(user1Data?.login).toBe('user1');
      
      // Clear session and switch to User 2
      userDataIsolation.clearSession();
      
      const user2AccessToken = 'github_67890_' + Date.now() + '_' + Buffer.from('user2_token').toString('base64');
      const user2RefreshToken = 'refresh_67890_' + Date.now();
      
      userDataIsolation.initializeSession(user2AccessToken, user2RefreshToken);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 67890,
          login: 'user2',
          name: 'User Two'
        })
      });
      
      const user2Data = await userDataIsolation.fetchUserProfile();
      expect(user2Data?.login).toBe('user2');
      
      // Ensure no data contamination
      expect(user2Data?.login).not.toBe('user1');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const accessToken = 'github_12345_' + Date.now() + '_' + Buffer.from('test_github_token').toString('base64');
      const refreshToken = 'refresh_12345_' + Date.now();
      userDataIsolation.initializeSession(accessToken, refreshToken);
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(userDataIsolation.fetchUserProfile()).rejects.toThrow('Network error');
    });

    it('should handle malformed GitHub responses', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null)
      });
      
      await expect(userDataIsolation.fetchUserProfile()).rejects.toThrow('User data validation failed');
    });
  });
});
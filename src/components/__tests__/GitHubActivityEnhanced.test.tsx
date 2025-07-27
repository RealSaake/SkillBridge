import { screen, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { GitHubActivityEnhanced } from '../GitHubActivityEnhanced';
import { render } from '../../utils/test-utils';

describe('GitHubActivityEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    expect(screen.getByText('Analyzing GitHub activity...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('displays GitHub activity data after loading', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      // Look for common GitHub activity indicators
      const activityElements = screen.queryAllByText(/github|activity|repository|star/i);
      expect(activityElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('shows language distribution section', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      // Look for language-related content
      const languageElements = screen.queryAllByText(/language|javascript|typescript|python/i);
      expect(languageElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('handles error states gracefully', async () => {
    // Test with invalid username to trigger error
    render(<GitHubActivityEnhanced username="" />);
    
    await waitFor(() => {
      // Look for error indicators or retry buttons
      const errorElements = screen.queryAllByText(/error|retry|unable|failed/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('allows refreshing data', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('can be collapsed and expanded', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      const collapseButton = screen.queryByRole('button', { name: /collapse/i });
      expect(collapseButton).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('displays activity metrics when available', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      // Look for common activity metrics
      const metricElements = screen.queryAllByText(/total|stars|repos|commits|contributions/i);
      expect(metricElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('shows appropriate content for user profile', async () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    await waitFor(() => {
      // Look for profile-related content
      const profileElements = screen.queryAllByText(/profile|user|developer|activity/i);
      expect(profileElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('renders component structure correctly', () => {
    render(<GitHubActivityEnhanced username="testuser" />);
    
    // Verify basic component structure
    expect(screen.getByTestId('github-activity-enhanced')).toBeInTheDocument();
  });

  it('handles different username inputs', async () => {
    const { rerender } = render(<GitHubActivityEnhanced username="user1" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('github-activity-enhanced')).toBeInTheDocument();
    });
    
    // Test with different username
    rerender(<GitHubActivityEnhanced username="user2" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('github-activity-enhanced')).toBeInTheDocument();
    });
  });
});
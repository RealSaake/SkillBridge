import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubActivity } from './GitHubActivity';
import { ResumeReview } from './ResumeReview';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { LearningRoadmap } from './LearningRoadmap';
import { JobMarketInsights } from './JobMarketInsights';
import { InteractiveResumeReviewer } from './InteractiveResumeReviewer';
import { AutonomousCareerInsights } from './AutonomousCareerInsights';
import { Button } from './ui/button';
import { RefreshCw, LogOut } from 'lucide-react';
import { MCPErrorBoundary } from './MCPErrorBoundary';
import { clearMCPCache } from '../hooks/usePersonalizedMCP';
import { terminalLogger } from '../utils/terminalLogger';

export default function Dashboard() {
  const { user, profile, isLoading, hasCompletedOnboarding, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      terminalLogger.info('Dashboard', 'Refreshing all MCP data', { userId: user?.id });
      
      // Clear MCP cache to force fresh data
      clearMCPCache();
      
      // Force refresh of all components
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      terminalLogger.info('Dashboard', 'Dashboard refresh completed', { duration: '1000ms' });
    } catch (error) {
      terminalLogger.error('Dashboard', 'Dashboard refresh failed', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    
    try {
      setSigningOut(true);
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setSigningOut(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (!user || !hasCompletedOnboarding) {
    window.location.href = '/onboarding';
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-card border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {user.avatarUrl && (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name || user.username}
                  className="w-10 h-10 rounded-full border-2 border-primary/20"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {user.name || user.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Developer Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                disabled={signingOut}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">
            Welcome back, {user.name?.split(' ')[0] || user.username}!
          </h1>
          <p className="text-lg text-muted-foreground">
            {profile?.targetRole ? (
              <>Your journey to becoming a <span className="font-medium text-foreground">{profile.targetRole.replace('-', ' ')}</span> continues</>
            ) : (
              'Your AI-powered career development companion'
            )}
          </p>
          {profile?.careerGoal && (
            <p className="text-sm text-muted-foreground mt-2">
              Goal: {profile.careerGoal}
            </p>
          )}
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="mb-8 p-4 bg-card rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Role</h3>
                <p className="text-lg font-semibold">{profile.currentRole || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Experience Level</h3>
                <p className="text-lg font-semibold capitalize">{profile.experienceLevel || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tech Stack</h3>
                <p className="text-sm">
                  {profile.techStack && profile.techStack.length > 0 
                    ? profile.techStack.slice(0, 3).join(', ') + (profile.techStack.length > 3 ? ` +${profile.techStack.length - 3} more` : '')
                    : 'Not specified'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMMAND CENTER: Pixel-Perfect Multi-Column Interactive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column: GitHub Activity & Skills */}
          <div className="xl:col-span-1 space-y-6">
            <GitHubActivity />
            <MCPErrorBoundary>
              <SkillGapAnalysis />
            </MCPErrorBoundary>
          </div>
          
          {/* Center-Left Column: Interactive Resume Reviewer */}
          <div className="xl:col-span-1 space-y-6">
            <MCPErrorBoundary>
              <InteractiveResumeReviewer />
            </MCPErrorBoundary>
          </div>

          {/* Center-Right Column: Learning Roadmap */}
          <div className="xl:col-span-1 space-y-6">
            <MCPErrorBoundary>
              <LearningRoadmap />
            </MCPErrorBoundary>
          </div>

          {/* Right Column: AI Insights & Market Intelligence */}
          <div className="xl:col-span-1 space-y-6">
            <MCPErrorBoundary>
              <AutonomousCareerInsights />
            </MCPErrorBoundary>
            <JobMarketInsights />
          </div>
        </div>
      </main>
    </div>
  );
}
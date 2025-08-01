import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubActivity } from './GitHubActivity';
import { ResumeReview } from './ResumeReview';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { LearningRoadmap } from './LearningRoadmap';
import { JobMarketInsights } from './JobMarketInsights';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      // Refresh logic would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Welcome to SkillBridge</h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered career development companion
          </p>
        </div>

        {/* Sacred UI Layout: 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <GitHubActivity />
            <SkillGapAnalysis />
            <JobMarketInsights />
          </div>
          
          <div className="space-y-6">
            <ResumeReview />
            <LearningRoadmap />
          </div>
        </div>
      </main>
    </div>
  );
}
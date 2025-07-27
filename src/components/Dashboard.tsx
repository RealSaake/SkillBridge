import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../App';
import { GitHubActivityEnhanced } from './GitHubActivityEnhanced';
import { ResumeReviewEnhanced } from './ResumeReviewEnhanced';
import { SkillGapAnalysisEnhanced } from './SkillGapAnalysisEnhanced';
import { LearningRoadmapEnhanced } from './LearningRoadmapEnhanced';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null; // This should be handled by ProtectedRoute
  }

  const username = user.username;
  const targetRole = user.profile?.targetRole || 'frontend-developer';
  const currentRole = user.profile?.currentRole;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl" role="main">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            {user.avatarUrl && (
              <img 
                src={user.avatarUrl} 
                alt={user.name || user.username}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user.name || user.username}!
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentRole && targetRole !== currentRole 
                  ? `Transitioning from ${currentRole} to ${targetRole}`
                  : `Your ${targetRole} development journey`
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Profile Setup Reminder */}
      {!user.profile?.targetRole && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Set your target role and career goals to get personalized recommendations.
            </p>
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              Complete Profile Setup
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div data-testid="github-activity-enhanced">
            <GitHubActivityEnhanced username={username} />
          </div>
          
          <div data-testid="skill-gap-analysis-enhanced">
            <SkillGapAnalysisEnhanced 
              username={username} 
              targetRole={targetRole} 
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div data-testid="resume-review-enhanced">
            <ResumeReviewEnhanced />
          </div>
          
          <div data-testid="learning-roadmap-enhanced">
            <LearningRoadmapEnhanced 
              targetRole={targetRole}
              currentSkills={user.skills?.map(s => s.skillName) || []}
            />
          </div>
        </div>
      </div>

      {/* User Stats Footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{user.skills?.length || 0}</div>
            <p className="text-sm text-gray-600">Skills Tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {user.profile?.careerGoals?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Career Goals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
            <p className="text-sm text-gray-600">Member Since</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
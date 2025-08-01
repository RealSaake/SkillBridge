import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../App';
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

  // Development mode: create mock user if none exists
  const mockUser = {
    id: 'dev-user-123',
    username: 'developer',
    name: 'Development User',
    email: 'dev@skillbridge.com',
    avatarUrl: 'https://github.com/github.png',
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

  const currentUser = user || (process.env.NODE_ENV === 'development' ? mockUser : null);

  if (!currentUser) {
    return null; // This should be handled by ProtectedRoute
  }

  const username = currentUser.username;
  const targetRole = currentUser.profile?.targetRole || 'frontend-developer';
  const currentRole = currentUser.profile?.currentRole;

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl" role="main">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            {currentUser.avatarUrl && (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name || currentUser.username}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {currentUser.name || currentUser.username}!
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
      {!currentUser.profile?.targetRole && (
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
          <Card>
            <CardHeader>
              <CardTitle>GitHub Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Connect your GitHub account to see repository analysis and skill detection.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Coming Soon:</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Repository analysis</li>
                  <li>• Language distribution</li>
                  <li>• Contribution patterns</li>
                  <li>• Project recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Skill Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered analysis of your skills vs target role requirements.
              </p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Features:</h4>
                <ul className="text-sm text-green-800 mt-2 space-y-1">
                  <li>• Skill proficiency assessment</li>
                  <li>• Gap identification</li>
                  <li>• Learning recommendations</li>
                  <li>• Progress tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get AI-powered feedback on your resume and improvement suggestions.
              </p>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">AI Features:</h4>
                <ul className="text-sm text-purple-800 mt-2 space-y-1">
                  <li>• ATS optimization</li>
                  <li>• Content suggestions</li>
                  <li>• Format recommendations</li>
                  <li>• Industry-specific tips</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Learning Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Personalized learning path based on your current skills and target role.
              </p>
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900">Roadmap Includes:</h4>
                <ul className="text-sm text-orange-800 mt-2 space-y-1">
                  <li>• Step-by-step learning plan</li>
                  <li>• Resource recommendations</li>
                  <li>• Milestone tracking</li>
                  <li>• Time estimates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Stats Footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{currentUser.skills?.length || 0}</div>
            <p className="text-sm text-gray-600">Skills Tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {currentUser.profile?.careerGoals?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Career Goals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Date(currentUser.createdAt).toLocaleDateString()}
            </div>
            <p className="text-sm text-gray-600">Member Since</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
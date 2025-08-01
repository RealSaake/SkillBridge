import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';

export const LoginPage: React.FC = () => {
  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">SB</span>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">Welcome to SkillBridge</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Transform your developer career with AI-powered insights from your GitHub activity
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button 
                onClick={handleGitHubLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                size="lg"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                Connect GitHub & Start Free
              </Button>
              
              <p className="text-center text-sm text-gray-400">
                🔒 Secure OAuth • No password required • Free forever
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3 flex items-center">
                <span className="mr-2">✨</span>
                What happens after you connect:
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">✓</span>
                  <span>Analyze your GitHub repositories and coding patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">✓</span>
                  <span>Get personalized career roadmap based on your goals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">✓</span>
                  <span>Receive AI-powered skill gap analysis and recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">✓</span>
                  <span>Track your progress and celebrate achievements</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                By continuing, you agree to our{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Join thousands of developers advancing their careers with SkillBridge
          </p>
        </div>
      </div>
    </div>
  );
};
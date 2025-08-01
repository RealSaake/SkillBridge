import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface GitHubConnectionRequiredProps {
  error?: string;
  onReconnect?: () => void;
}

export const GitHubConnectionRequired: React.FC<GitHubConnectionRequiredProps> = ({ 
  error, 
  onReconnect 
}) => {
  const handleReconnect = () => {
    if (onReconnect) {
      onReconnect();
    } else {
      // Redirect to GitHub OAuth
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';
      window.location.href = `${API_BASE_URL}/api/auth/github`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            GitHub Connection Required
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {error || 'Your GitHub connection has expired or is invalid. Please reconnect to access your personalized career insights.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              SkillBridge analyzes your GitHub repositories to provide personalized career guidance. 
              We need access to your GitHub profile to continue.
            </p>

            <Button 
              onClick={handleReconnect}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              Reconnect GitHub Account
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">What we analyze:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your public repositories and languages used</li>
              <li>• Contribution patterns and activity</li>
              <li>• Project complexity and skills demonstrated</li>
              <li>• Career progression recommendations</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">
            We only access public repository information. Your private repositories remain private.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(getErrorMessage(error));
          return;
        }

        if (!token || !refreshToken) {
          setStatus('error');
          setErrorMessage('Missing authentication tokens');
          return;
        }

        await login(token, refreshToken);
        setStatus('success');
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('Authentication callback error:', error);
        setStatus('error');
        setErrorMessage('Failed to complete authentication');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'authentication_failed':
        return 'GitHub authentication failed. Please try again.';
      case 'server_error':
        return 'Server error occurred. Please try again later.';
      case 'access_denied':
        return 'Access denied. You need to authorize the application.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            )}
            {status === 'success' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Completing Authentication...'}
            {status === 'success' && 'Welcome to SkillBridge!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="space-y-2">
              <p className="text-gray-600">Setting up your personalized dashboard...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">Authentication successful!</p>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
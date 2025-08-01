import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DebugInfo } from '../debug/DebugInfo';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userType, setUserType] = useState<'new' | 'returning' | null>(null);

  useEffect(() => {
    // Prevent multiple executions and ensure single navigation
    if (isProcessing) {
      return;
    }

    let hasNavigated = false;
    
    const handleCallback = async () => {
      if (isProcessing || hasNavigated) return;
      
      setIsProcessing(true);
      
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

        // Login with tokens - this will fetch user and profile data
        await login(token, refreshToken);
        
        // Check if user has completed onboarding by making a direct API call
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';
        const profileResponse = await fetch(`${API_BASE_URL}/profilesMe`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          // User has a profile - returning user
          setUserType('returning');
          setStatus('success');
          
          if (!hasNavigated) {
            hasNavigated = true;
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          }
        } else if (profileResponse.status === 404) {
          // User doesn't have a profile - new user
          setUserType('new');
          setStatus('success');
          
          if (!hasNavigated) {
            hasNavigated = true;
            setTimeout(() => {
              navigate('/onboarding', { replace: true });
            }, 1500);
          }
        } else {
          throw new Error('Failed to check profile status');
        }

      } catch (error) {
        console.error('Authentication callback error:', error);
        setStatus('error');
        setErrorMessage('Failed to complete authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
    
    // Cleanup function to prevent navigation after unmount
    return () => {
      hasNavigated = true;
    };
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
              <p className="text-gray-600">Checking your account status...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {status === 'success' && userType === 'new' && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">Welcome to SkillBridge!</p>
              <p className="text-gray-600">Let's set up your profile...</p>
            </div>
          )}

          {status === 'success' && userType === 'returning' && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">Welcome back!</p>
              <p className="text-gray-600">Taking you to your dashboard...</p>
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
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
    </div>
  );
};
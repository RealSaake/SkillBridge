import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProfile = false 
}) => {
  const { user, profile, isLoading, hasCompletedOnboarding } = useAuth();
  const location = useLocation();

  // Development mode bypass
  if (process.env.NODE_ENV === 'development' && location.pathname === '/dev') {
    return <>{children}</>;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if profile is required but not complete
  if (requireProfile && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
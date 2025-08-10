import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const AuthErrorHandler = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleAuthError = async (event) => {
      console.log('Auth error detected:', event.detail);
      
      if (event.detail?.reason === 'refresh_failed' || event.detail?.requiresLogin) {
        setAuthError({
          type: 'session_expired',
          message: 'Your session has expired. Please login again.',
          action: 'login'
        });
        
        // Clear auth data and redirect to login
        try {
          await logout();
        } catch (error) {
          console.error('Error during logout:', error);
        }
        
        // Show toast notification
        toast.error('Session expired. Please login again.');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { 
            replace: true, 
            state: { expired: true, returnUrl: location.pathname } 
          });
        }, 1000);
      }
    };

    // Listen for auth logout events
    window.addEventListener('auth-logout', handleAuthError);

    // Check URL for expired parameter
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('expired') === 'true') {
      setAuthError({
        type: 'session_expired',
        message: 'Your session has expired. Please login again.',
        action: 'login'
      });
    }

    return () => {
      window.removeEventListener('auth-logout', handleAuthError);
    };
  }, [logout, navigate, location]);

  const handleRetry = () => {
    setAuthError(null);
    window.location.reload();
  };

  const handleLogin = () => {
    setAuthError(null);
    navigate('/login', { replace: true });
  };

  const clearError = () => {
    setAuthError(null);
  };

  // If there's an auth error, show error component
  if (authError && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-white">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 text-center">
              {authError.message}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </Button>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
};

export default AuthErrorHandler;
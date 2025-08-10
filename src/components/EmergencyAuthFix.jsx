import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2, LogIn } from 'lucide-react';

const EmergencyAuthFix = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState('');

  const clearAllAuthData = () => {
    try {
      setStatus('Clearing authentication data...');
      
      // Clear all possible auth keys
      const authKeys = [
        'gymflow_access_token',
        'gymflow_refresh_token', 
        'gymflow_token',
        'gymflow_user',
        'auth_token',
        'user_token',
        'access_token',
        'refresh_token',
        'user_data',
        'currentUser'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear all localStorage if needed
      // localStorage.clear();
      
      setStatus('✅ Authentication data cleared! Refreshing page...');
      
      setTimeout(() => {
        window.location.href = '/login?cleared=true';
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
      setStatus('❌ Error occurred. Trying page refresh...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const forceRefresh = () => {
    setStatus('🔄 Refreshing page...');
    setTimeout(() => window.location.reload(), 500);
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  // Emergency demo login (use only for client demo)
  const emergencyDemoLogin = () => {
    if (confirm('⚠️ This is for DEMO purposes only. Use this?')) {
      try {
        const demoUser = {
          _id: '686ba1ee3194c16d80074232',
          name: 'Demo User',
          email: 'demo@gym.com',
          role: 'gym-owner'
        };
        
        localStorage.setItem('gymflow_user', JSON.stringify(demoUser));
        localStorage.setItem('gymflow_token', 'demo-token-for-presentation');
        
        setStatus('🎭 Demo login set. Redirecting...');
        setTimeout(() => window.location.href = '/', 1000);
      } catch (error) {
        setStatus('❌ Demo login failed');
      }
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-600 text-white border-red-600 hover:bg-red-700"
        >
          🚨 Auth Fix
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Emergency Authentication Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {status}
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={clearAllAuthData}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Auth Data & Refresh
            </Button>
            
            <Button 
              onClick={goToLogin}
              variant="outline"
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Go to Login Page
            </Button>
            
            <Button 
              onClick={forceRefresh}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Page Refresh
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={emergencyDemoLogin}
                variant="destructive"
                className="w-full text-xs"
              >
                🎭 Emergency Demo Login (DEV ONLY)
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Use Case 1:</strong> Clear auth data if stuck in login loop</p>
            <p><strong>Use Case 2:</strong> Force refresh if page won't load</p>
            <p><strong>Use Case 3:</strong> Go to login for fresh start</p>
          </div>
          
          <Button 
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="w-full text-gray-500"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyAuthFix;
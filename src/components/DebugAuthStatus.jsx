import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugAuthStatus = () => {
  const { user, token, authFetch } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Get debug information
  const getDebugInfo = () => {
    const accessToken = localStorage.getItem('gymflow_access_token');
    const refreshToken = localStorage.getItem('gymflow_refresh_token');
    const legacyToken = localStorage.getItem('gymflow_token');
    const storedUser = localStorage.getItem('gymflow_user');

    return {
      contextState: {
        hasUser: !!user,
        hasToken: !!token,
        userRole: user?.role,
        userId: user?._id
      },
      localStorage: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasLegacyToken: !!legacyToken,
        hasStoredUser: !!storedUser,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0,
        legacyTokenLength: legacyToken?.length || 0
      },
      apiClient: {
        currentAccessToken: apiClient.getAccessToken()?.length || 0,
        currentRefreshToken: apiClient.getRefreshToken()?.length || 0
      },
      environment: {
        apiUrl: import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api',
        isDev: import.meta.env.DEV
      }
    };
  };

  // Test different endpoints
  const runTests = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // Test 1: Check environment status
      try {
        const envResponse = await fetch('/api/env-status');
        results.envStatus = {
          success: envResponse.ok,
          status: envResponse.status,
          data: envResponse.ok ? await envResponse.json() : null
        };
      } catch (error) {
        results.envStatus = { success: false, error: error.message };
      }

      // Test 2: Test authFetch with current user endpoint
      if (user && token) {
        try {
          const userResponse = await authFetch('/auth/me');
          results.authFetch = {
            success: userResponse.success || userResponse.status === 'success',
            data: userResponse
          };
        } catch (error) {
          results.authFetch = { success: false, error: error.message };
        }

        // Test 3: Test workout endpoint
        try {
          const workoutResponse = await authFetch(`/workouts/member/${user._id}`);
          results.workoutEndpoint = {
            success: workoutResponse.success || workoutResponse.status === 'success',
            data: workoutResponse,
            workoutCount: workoutResponse.data?.workouts?.length || 0
          };
        } catch (error) {
          results.workoutEndpoint = { success: false, error: error.message };
        }

        // Test 4: Test diet plan endpoint
        try {
          const dietResponse = await authFetch(`/diet-plans/member/${user._id}`);
          results.dietEndpoint = {
            success: dietResponse.success || dietResponse.status === 'success',
            data: dietResponse,
            dietCount: dietResponse.data?.dietPlans?.length || 0
          };
        } catch (error) {
          results.dietEndpoint = { success: false, error: error.message };
        }

        // Test 5: Direct API client test
        try {
          const directResponse = await apiClient.get('/auth/me');
          results.directApiClient = {
            success: true,
            data: directResponse.data
          };
        } catch (error) {
          results.directApiClient = { success: false, error: error.message };
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh debug info on component mount and when auth state changes
  useEffect(() => {
    setDebugInfo(getDebugInfo());
  }, [user, token]);

  const renderStatus = (isSuccess, label) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isSuccess 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isSuccess ? '✅' : '❌'} {label}
    </span>
  );

  if (!debugInfo) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">🔍 Authentication Debug Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Context State */}
          <div>
            <h3 className="font-semibold mb-2">Context State:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {renderStatus(debugInfo.contextState.hasUser, 'User')}
              {renderStatus(debugInfo.contextState.hasToken, 'Token')}
              {debugInfo.contextState.userRole && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Role: {debugInfo.contextState.userRole}
                </span>
              )}
              {debugInfo.contextState.userId && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                  ID: {debugInfo.contextState.userId.slice(-6)}
                </span>
              )}
            </div>
          </div>

          {/* LocalStorage State */}
          <div>
            <h3 className="font-semibold mb-2">LocalStorage State:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {renderStatus(debugInfo.localStorage.hasAccessToken, 'Access Token')}
              {renderStatus(debugInfo.localStorage.hasRefreshToken, 'Refresh Token')}
              {renderStatus(debugInfo.localStorage.hasLegacyToken, 'Legacy Token')}
              {renderStatus(debugInfo.localStorage.hasStoredUser, 'Stored User')}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Token Lengths: Access({debugInfo.localStorage.accessTokenLength}), 
              Refresh({debugInfo.localStorage.refreshTokenLength}), 
              Legacy({debugInfo.localStorage.legacyTokenLength})
            </div>
          </div>

          {/* API Client State */}
          <div>
            <h3 className="font-semibold mb-2">API Client State:</h3>
            <div className="text-sm text-gray-600">
              Current Access Token Length: {debugInfo.apiClient.currentAccessToken}
              <br />
              Current Refresh Token Length: {debugInfo.apiClient.currentRefreshToken}
            </div>
          </div>

          {/* Environment */}
          <div>
            <h3 className="font-semibold mb-2">Environment:</h3>
            <div className="text-sm text-gray-600">
              API URL: {debugInfo.environment.apiUrl}
              <br />
              Development Mode: {debugInfo.environment.isDev ? 'Yes' : 'No'}
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([testName, result]) => (
                  <div key={testName} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{testName}</span>
                      {renderStatus(result.success, result.success ? 'Pass' : 'Fail')}
                    </div>
                    {result.error && (
                      <div className="text-red-600 text-sm mt-1">Error: {result.error}</div>
                    )}
                    {result.workoutCount !== undefined && (
                      <div className="text-blue-600 text-sm mt-1">Workouts: {result.workoutCount}</div>
                    )}
                    {result.dietCount !== undefined && (
                      <div className="text-green-600 text-sm mt-1">Diet Plans: {result.dietCount}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => setDebugInfo(getDebugInfo())} variant="outline">
              Refresh Debug Info
            </Button>
            <Button 
              onClick={runTests} 
              disabled={isLoading || !user}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Running Tests...' : 'Run Authentication Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugAuthStatus;
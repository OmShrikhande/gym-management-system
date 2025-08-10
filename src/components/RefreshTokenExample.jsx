import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';

/**
 * Example component showing how to use the new refresh token system
 */
const RefreshTokenExample = () => {
  const { user, authFetch, logout } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Test authFetch (automatically handles token refresh)
  const testAuthFetch = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/users/me');
      setTestResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test direct API client usage (also handles refresh)
  const testApiClient = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/me');
      setTestResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test token refresh manually
  const testTokenRefresh = async () => {
    setIsLoading(true);
    try {
      const newToken = await apiClient.refreshAccessToken();
      setTestResult(`New token: ${newToken.substring(0, 20)}...`);
    } catch (error) {
      setTestResult(`Refresh failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setTestResult('Logged out successfully');
    } catch (error) {
      setTestResult(`Logout failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to test the refresh token system</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Refresh Token System Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Current User:</h3>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={testAuthFetch}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test authFetch
        </button>

        <button
          onClick={testApiClient}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Test API Client
        </button>

        <button
          onClick={testTokenRefresh}
          disabled={isLoading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 ml-2"
        >
          Test Manual Refresh
        </button>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 ml-2"
        >
          Logout
        </button>
      </div>

      {isLoading && (
        <div className="text-blue-600">Loading...</div>
      )}

      {testResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default RefreshTokenExample;
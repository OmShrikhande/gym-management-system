import React from 'react';
import { debugAuthState, clearAllAuthData, checkTokenHealth } from '@/utils/authDebug';

const AuthDebugPanel = ({ onClose }) => {
  const handleClearAuth = () => {
    if (window.confirm('This will clear all authentication data and you will need to log in again. Continue?')) {
      clearAllAuthData();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleDebugAuth = () => {
    debugAuthState();
    checkTokenHealth();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Authentication Debug
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you're experiencing authentication issues, you can use these tools to debug and fix the problem.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={handleDebugAuth}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Debug Auth State (Check Console)
            </button>
            
            <button
              onClick={handleClearAuth}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Clear Auth Data & Reload
            </button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p><strong>Debug Auth State:</strong> Logs authentication information to console</p>
            <p><strong>Clear Auth Data:</strong> Removes all stored tokens and reloads the page</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;
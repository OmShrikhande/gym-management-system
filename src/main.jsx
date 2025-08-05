import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './App.jsx';
import './i18n'; // Import i18n once to initialize translations
import { initializeSettings } from './lib/settings.jsx'; // Import initializeSettings
import { initializeConsoleErrorFiltering } from './utils/consoleErrorHandler.js';
import { initializeSVGErrorHandling } from './utils/svgErrorHandler.js';
import { initializeRazorpaySafely } from './utils/razorpayErrorHandler.js';
import './utils/variableInitializationHandler.js'; // Import variable initialization handler
import './utils/xmlSecurityHandler.js'; // Import XML security handler

// Initialize error handling systems
console.log('🚀 Initializing GymFlow error handling systems...');

// Initialize console error filtering
initializeConsoleErrorFiltering();

// Initialize SVG error handling
initializeSVGErrorHandling();

// Initialize application settings before rendering
initializeSettings();

// Initialize Razorpay error handling (async)
initializeRazorpaySafely().then(() => {
  console.log('✅ All error handling systems initialized successfully');
}).catch((error) => {
  console.warn('⚠️ Some error handling systems failed to initialize:', error);
});

// Register service worker for offline settings caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
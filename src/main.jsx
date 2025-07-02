import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './App.jsx';
import './i18n'; // Import i18n once to initialize translations
import { initializeSettings } from './lib/settings.jsx'; // Import initializeSettings

// Initialize application settings before rendering
initializeSettings();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
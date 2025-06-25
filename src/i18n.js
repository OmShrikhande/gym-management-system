import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from './lib/translations';

// Convert our existing translations to i18next format
const resources = {};

// Process each language in our existing translations
Object.entries(translations).forEach(([langName, langData]) => {
  const langCode = getLangCode(langName);
  resources[langCode] = {
    translation: langData
  };
});

// Helper function to get language code from language name
function getLangCode(langName) {
  const codes = {
    'English': 'en',
    'Spanish': 'es',
    'Hindi': 'hi',
    'French': 'fr',
    'German': 'de',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Arabic': 'ar'
  };
  
  return codes[langName] || 'en';
}

// Function to get language name from code
export function getLangName(langCode) {
  const names = {
    'en': 'English',
    'es': 'Spanish',
    'hi': 'Hindi',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ar': 'Arabic'
  };
  
  return names[langCode] || 'English';
}

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'gym_language_code',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    }
  });

// Function to change language
export const changeLanguage = (langNameOrCode) => {
  // Check if we got a language name or code
  const isCode = langNameOrCode.length <= 3;
  const langCode = isCode ? langNameOrCode : getLangCode(langNameOrCode);
  const langName = isCode ? getLangName(langNameOrCode) : langNameOrCode;
  
  // Change language in i18next
  i18n.changeLanguage(langCode);
  
  // Store language preferences in localStorage
  localStorage.setItem('gym_language_code', langCode);
  localStorage.setItem('gym_language', langName);
  
  // Update HTML lang attribute
  document.documentElement.lang = langCode;
  
  // Dispatch a custom event that components can listen for
  window.dispatchEvent(new CustomEvent('languageChanged', { 
    detail: langName 
  }));
  
  // Update settings in localStorage if needed
  try {
    const settingsStr = localStorage.getItem('gym_settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.global) {
        settings.global.language = langName;
        localStorage.setItem('gym_settings', JSON.stringify(settings));
      }
    }
  } catch (error) {
    console.error('Error updating settings with new language:', error);
  }
  
  // Force a refresh of all components that use translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = i18n.t(key);
    }
  });
  
  // Log language change for debugging
  console.log(`Language changed to: ${langName} (${langCode})`);
  
  return true;
};

// Initialize language from settings or localStorage
export const initializeLanguage = () => {
  try {
    // Try to get language from localStorage
    const storedLanguage = localStorage.getItem('gym_language');
    const storedLanguageCode = localStorage.getItem('gym_language_code');
    
    if (storedLanguageCode) {
      i18n.changeLanguage(storedLanguageCode);
      document.documentElement.lang = storedLanguageCode;
    } else if (storedLanguage) {
      const langCode = getLangCode(storedLanguage);
      i18n.changeLanguage(langCode);
      document.documentElement.lang = langCode;
      localStorage.setItem('gym_language_code', langCode);
    } else {
      // Try to get language from settings
      const settingsStr = localStorage.getItem('gym_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.global?.language) {
          const langCode = getLangCode(settings.global.language);
          i18n.changeLanguage(langCode);
          document.documentElement.lang = langCode;
          localStorage.setItem('gym_language_code', langCode);
          localStorage.setItem('gym_language', settings.global.language);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

// Initialize language
initializeLanguage();

export default i18n;
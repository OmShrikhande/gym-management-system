import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { getLangName, changeLanguage as changeI18nLanguage } from '@/i18n';

// Create the Translation Context
const TranslationContext = createContext(undefined);

/**
 * Translation Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const TranslationProvider = ({ children }) => {
  // Use i18next for translations
  const { t: translate, i18n } = useI18nTranslation();
  const [language, setCurrentLanguage] = useState(getLangName(i18n.language));
  
  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setCurrentLanguage(event.detail);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);
  
  // Listen for i18next language changes
  useEffect(() => {
    const handleI18nLanguageChange = () => {
      setCurrentLanguage(getLangName(i18n.language));
    };
    
    i18n.on('languageChanged', handleI18nLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleI18nLanguageChange);
    };
  }, [i18n]);
  
  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'gym_settings') {
        try {
          const settings = JSON.parse(event.newValue);
          if (settings?.global?.language) {
            changeLanguage(settings.global.language);
          }
        } catch (error) {
          console.error('Error parsing settings:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  /**
   * Change the current language
   * @param {string} newLanguage - New language to set
   */
  const changeLanguage = (newLanguage) => {
    const result = changeI18nLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    
    // Force a re-render of all components that use translations
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return result;
  };
  
  /**
   * Translate a key to the current language
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  const t = (key) => {
    return translate(key);
  };
  
  // Context value
  const value = {
    language,
    changeLanguage,
    t
  };
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Hook to use the Translation context
 * @returns {Object} Translation context
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
};

export default TranslationContext;
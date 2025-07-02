import { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * LanguageSwitcher component
 * Allows users to change the application language from anywhere
 */
const LanguageSwitcher = ({ className = '' }) => {
  const { language, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'English', label: 'English' },
    { code: 'Spanish', label: 'Español (Spanish)' },
    { code: 'French', label: 'Français (French)' },
    { code: 'Hindi', label: 'हिन्दी (Hindi)' },
    { code: 'German', label: 'Deutsch (German)' },
    { code: 'Chinese', label: '中文 (Chinese)' },
    { code: 'Japanese', label: '日本語 (Japanese)' },
    { code: 'Arabic', label: 'العربية (Arabic)' },
  ];

  const handleLanguageChange = (langCode) => {
    // Change the language
    changeLanguage(langCode);
    
    // Close the dropdown
    setIsOpen(false);
    
    // Force a refresh of the UI
    setTimeout(() => {
      // This will trigger a re-render of components
      window.dispatchEvent(new Event('languageChanged'));
      
      // Log for debugging
      console.log(`Language changed to: ${langCode}`);
    }, 100);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer ${
              language === lang.code
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
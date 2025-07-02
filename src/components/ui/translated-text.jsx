import { useTranslation } from "@/contexts/TranslationContext";
import { Trans } from 'react-i18next';

/**
 * TranslatedText component for easy translation of text
 * @param {Object} props - Component props
 * @param {string} props.textKey - Translation key
 * @param {React.ReactNode} props.children - Children to render if no textKey is provided
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.as - HTML element to render (default: span)
 * @param {Object} props.values - Values for interpolation
 * @param {Object} props.components - Components for interpolation
 */
const TranslatedText = ({ 
  textKey, 
  children, 
  className = "", 
  as = "span", 
  values = {}, 
  components = {},
  ...props 
}) => {
  const { t } = useTranslation();
  const Element = as;
  
  if (textKey) {
    // If we have components, use Trans component for rich text translation
    if (Object.keys(components).length > 0) {
      return (
        <Trans
          i18nKey={textKey}
          values={values}
          components={components}
          parent={Element}
          className={className}
          {...props}
        />
      );
    }
    
    // Otherwise use simple text translation
    return (
      <Element className={className} {...props}>
        {t(textKey, values)}
      </Element>
    );
  }
  
  // If no textKey is provided, just render children
  return (
    <Element className={className} {...props}>
      {children}
    </Element>
  );
};

export default TranslatedText;
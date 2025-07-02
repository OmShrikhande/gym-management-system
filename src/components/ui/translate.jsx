

import { useTranslation } from 'react-i18next';

/**
 * A higher-order component that adds translation capabilities to a component
 * @param {React.ComponentType} Component - The component to wrap
 * @returns {React.ComponentType} - The wrapped component with translation props
 */
export function withTranslation(Component) {
  return function WrappedComponent(props) {
    const { t, i18n } = useTranslation();
    
    return (
      <Component
        {...props}
        t={t}
        i18n={i18n}
      />
    );
  };
}

/**
 * A hook to use translations in functional components
 * @returns {Object} - Translation utilities
 */
export function useI18n() {
  const { t, i18n } = useTranslation();
  
  return {
    t,
    i18n,
    changeLanguage: i18n.changeLanguage,
    language: i18n.language,
    languages: i18n.languages,
  };
}

/**
 * A component that renders translated text
 * @param {Object} props - Component props
 * @param {string} props.i18nKey - The translation key
 * @param {Object} props.values - Values for interpolation
 * @param {React.ReactNode} props.children - Children to render if no i18nKey is provided
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.as - HTML element to render (default: span)
 */
export function Translate({ 
  i18nKey, 
  values = {}, 
  children, 
  className = "", 
  as: Element = "span",
  ...props 
}) {
  const { t } = useTranslation();
  
  if (!i18nKey && !children) {
    return null;
  }
  
  return (
    <Element className={className} {...props}>
      {i18nKey ? t(i18nKey, values) : children}
    </Element>
  );
}
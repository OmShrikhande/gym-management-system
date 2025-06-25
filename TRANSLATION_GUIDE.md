# Translation System Guide

This document explains how to use the translation system in the GymFlow application.

## Overview

The application uses i18next for translations, which is a powerful internationalization framework for JavaScript. It allows for easy translation of text throughout the application.

## Supported Languages

The application currently supports the following languages:
- English
- Spanish (Español)
- Hindi (हिन्दी)
- French (Français)
- German (Deutsch)
- Chinese (中文)
- Japanese (日本語)
- Arabic (العربية)

## How to Use Translations in Components

### Using the TranslatedText Component

The easiest way to add translated text to your components is to use the `TranslatedText` component:

```jsx
import TranslatedText from "@/components/ui/translated-text";

function MyComponent() {
  return (
    <div>
      <TranslatedText textKey="dashboard" />
      <TranslatedText textKey="settings" as="h2" className="text-xl" />
    </div>
  );
}
```

### Using the useTranslation Hook

You can also use the `useTranslation` hook to access the translation function directly:

```jsx
import { useTranslation } from "@/contexts/TranslationContext";

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <p>{t('configureSettings')}</p>
    </div>
  );
}
```

### Using the Translate Component

For more advanced use cases, you can use the `Translate` component:

```jsx
import { Translate } from "@/components/ui/translate";

function MyComponent() {
  return (
    <div>
      <Translate i18nKey="dashboard" as="h1" className="text-2xl" />
      <Translate i18nKey="welcomeMessage" values={{ name: user.name }} />
    </div>
  );
}
```

## Adding New Translation Keys

All translations are stored in the `src/lib/translations.js` file. To add a new translation key:

1. Add the key and English translation to the `en` object
2. Add translations for other languages as needed

Example:

```javascript
// English translations (default)
const en = {
  // ... existing translations
  newFeature: "New Feature",
};

// Spanish translations
const es = {
  // ... existing translations
  newFeature: "Nueva Característica",
};

// Add translations for other languages...
```

## Changing Language

Users can change the language in two ways:

1. From the language switcher in the header
2. From the System Settings page under the Global Settings tab

The language selection is persisted across sessions and page refreshes.

## Adding a New Language

To add a new language:

1. Add a new language object in `src/lib/translations.js`
2. Add the language to the `translations` object
3. Add the language code mapping in the `getLanguageCode` function
4. Add the language to the language selector dropdown in `src/components/ui/language-switcher.jsx`

## Technical Details

The translation system uses:

- i18next: Core internationalization framework
- react-i18next: React bindings for i18next
- i18next-browser-languagedetector: Detects the user's preferred language

The system is initialized in `src/i18n.js` and integrated with the application in `src/App.jsx`.

## Best Practices

1. Always use translation keys instead of hardcoded text
2. Keep translation keys simple and descriptive
3. Group related keys together in the translation files
4. Use the `TranslatedText` component for simple text
5. Use the `Translate` component for text with variables or formatting
6. Test your UI in different languages to ensure proper layout# Translation System Guide

This document explains how to use the translation system in the GymFlow application.

## Overview

The application uses i18next for translations, which is a powerful internationalization framework for JavaScript. It allows for easy translation of text throughout the application.

## Supported Languages

The application currently supports the following languages:
- English
- Spanish (Español)
- Hindi (हिन्दी)
- French (Français)
- German (Deutsch)
- Chinese (中文)
- Japanese (日本語)
- Arabic (العربية)

## How to Use Translations in Components

### Using the TranslatedText Component

The easiest way to add translated text to your components is to use the `TranslatedText` component:

```jsx
import TranslatedText from "@/components/ui/translated-text";

function MyComponent() {
  return (
    <div>
      <TranslatedText textKey="dashboard" />
      <TranslatedText textKey="settings" as="h2" className="text-xl" />
    </div>
  );
}
```

### Using the useTranslation Hook

You can also use the `useTranslation` hook to access the translation function directly:

```jsx
import { useTranslation } from "@/contexts/TranslationContext";

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <p>{t('configureSettings')}</p>
    </div>
  );
}
```

### Using the Translate Component

For more advanced use cases, you can use the `Translate` component:

```jsx
import { Translate } from "@/components/ui/translate";

function MyComponent() {
  return (
    <div>
      <Translate i18nKey="dashboard" as="h1" className="text-2xl" />
      <Translate i18nKey="welcomeMessage" values={{ name: user.name }} />
    </div>
  );
}
```

## Adding New Translation Keys

All translations are stored in the `src/lib/translations.js` file. To add a new translation key:

1. Add the key and English translation to the `en` object
2. Add translations for other languages as needed

Example:

```javascript
// English translations (default)
const en = {
  // ... existing translations
  newFeature: "New Feature",
};

// Spanish translations
const es = {
  // ... existing translations
  newFeature: "Nueva Característica",
};

// Add translations for other languages...
```

## Changing Language

Users can change the language in two ways:

1. From the language switcher in the header
2. From the System Settings page under the Global Settings tab

The language selection is persisted across sessions and page refreshes.

## Adding a New Language

To add a new language:

1. Add a new language object in `src/lib/translations.js`
2. Add the language to the `translations` object
3. Add the language code mapping in the `getLanguageCode` function
4. Add the language to the language selector dropdown in `src/components/ui/language-switcher.jsx`

## Technical Details

The translation system uses:

- i18next: Core internationalization framework
- react-i18next: React bindings for i18next
- i18next-browser-languagedetector: Detects the user's preferred language

The system is initialized in `src/i18n.js` and integrated with the application in `src/App.jsx`.

## Best Practices

1. Always use translation keys instead of hardcoded text
2. Keep translation keys simple and descriptive
3. Group related keys together in the translation files
4. Use the `TranslatedText` component for simple text
5. Use the `Translate` component for text with variables or formatting
6. Test your UI in different languages to ensure proper layout
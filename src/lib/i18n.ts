import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viTranslation from '../locales/vi.json';
import enTranslation from '../locales/en.json';
import esTranslation from '../locales/es.json';
import ptTranslation from '../locales/pt.json';
import arTranslation from '../locales/ar.json';
import ruTranslation from '../locales/ru.json';

// Determine initial language
const supportedLanguages = ['vi', 'en', 'es', 'pt', 'ar', 'ru'];

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Get browser language (e.g. 'en-US' -> 'en')
  const browserLang = navigator.language.split('-')[0];
  if (supportedLanguages.includes(browserLang)) {
    return browserLang;
  }
  
  return 'en'; // Fallback to English
};

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: viTranslation },
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      pt: { translation: ptTranslation },
      ar: { translation: arTranslation },
      ru: { translation: ruTranslation }
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

// Save language to localStorage on change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;

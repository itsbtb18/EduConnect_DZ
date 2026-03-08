import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ilmi_language',
      caches: ['localStorage'],
    },
  });

export default i18n;

/** Returns true when the current language is RTL (Arabic) */
export const isRTL = () => i18n.language === 'ar';

/** Returns the html dir attribute value */
export const getDirection = () => (i18n.language === 'ar' ? 'rtl' : 'ltr');

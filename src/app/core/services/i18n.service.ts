import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { getLS, KEYS } from '../helpers/storage.helper';
export const LANGUAGES = ['en', 'ja'];
export const DEFAULT_LANGUAGE = 'en';

export const currentLang = (): string => {
  const browserLanguage = navigator.languages?.filter((element) =>
    LANGUAGES.includes(element),
  );

  return browserLanguage?.length ? browserLanguage[0] : DEFAULT_LANGUAGE;
};

i18n
  .use(Backend)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // resources,
    lng: getLS(KEYS.I18_NEXT_LNG) || currentLang() || DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: 'common',
    defaultNS: 'common',
    backend: {
      loadPath: '/i18n/{{lng}}/{{ns}}.json',
    },
    // keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;

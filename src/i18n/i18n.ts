import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enTranslations from "./translations/en.json"; // Adjust path as needed
import esTranslations from "./translations/es.json"; // Adjust path as needed

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    // Resources are bundled, so load them synchronously: required for server rendering.
    initAsync: false,
    react: { useSuspense: false },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator"],
      caches: ["localStorage", "cookie"],
    },
  });

export default i18n;

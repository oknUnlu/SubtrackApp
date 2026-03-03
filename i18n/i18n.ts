import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { getSetting, setSetting } from "../database/db";

import tr from "./locales/tr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import hi from "./locales/hi.json";
import id from "./locales/id.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

export const SUPPORTED_LANGUAGES = ["tr", "en", "es", "pt", "hi", "id", "ja", "ko"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  hi: { translation: hi },
  id: { translation: id },
  ja: { translation: ja },
  ko: { translation: ko },
};

function detectDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  if (locales.length > 0) {
    const langCode = locales[0].languageCode;
    if (langCode && (SUPPORTED_LANGUAGES as readonly string[]).includes(langCode)) {
      return langCode as SupportedLanguage;
    }
  }
  return "en";
}

export async function initI18n(): Promise<void> {
  let language: string | null = null;
  try {
    language = await getSetting("language");
  } catch {
    // DB may not be ready on first launch
  }

  if (!language || !(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
    language = detectDeviceLanguage();
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export async function changeLanguage(lng: string): Promise<void> {
  await i18n.changeLanguage(lng);
  await setSetting("language", lng);
}

export default i18n;

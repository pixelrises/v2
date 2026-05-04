import { createContext } from "react";
import { translations, type Locale, type TranslationKey } from "./translations";

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  setLocale: () => {},
  t: (key: TranslationKey) => {
    const entry = translations[key];
    return entry ? entry.fr : key;
  },
});

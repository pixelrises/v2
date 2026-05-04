import { useState, ReactNode, useCallback } from "react";
import { translations, type Locale, type TranslationKey } from "./translations";
import { safeLocalStorage } from "@/lib/browser-storage";
import { I18nContext } from "./i18n-context";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = safeLocalStorage().getItem("pixelrises-lang");
    if (saved === "en" || saved === "fr") return saved;
    return navigator.language.startsWith("en") ? "en" : "fr";
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    safeLocalStorage().setItem("pixelrises-lang", newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[locale] || entry.fr;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

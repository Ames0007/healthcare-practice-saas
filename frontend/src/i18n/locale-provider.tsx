"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_COOKIE, LOCALE_DIRECTION, type Locale } from "./config";
import { getDictionary, translate } from "./dictionary";

interface LocaleContextValue {
  locale: Locale;
  direction: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);

    if (typeof document === "undefined") {
      return;
    }

    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = LOCALE_DIRECTION[next];
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const dictionary = getDictionary(locale);

    return {
      locale,
      direction: LOCALE_DIRECTION[locale],
      setLocale,
      t: (key, params) => translate(dictionary, key, params),
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}

export const LOCALES = ["fr", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_DIRECTION: Record<Locale, "ltr" | "rtl"> = {
  fr: "ltr",
  ar: "rtl",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
};

/**
 * Bootstrap-level preference only (Spec #7 §25) — not tied to a user
 * account. Real per-user persistence arrives with authentication.
 */
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

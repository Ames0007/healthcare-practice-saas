import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import type { Locale } from "./config";

export type Messages = typeof fr;

const DICTIONARIES: Record<Locale, Messages> = { fr, ar };

export function getDictionary(locale: Locale): Messages {
  return DICTIONARIES[locale];
}

type Primitive = string | number;

function resolvePath(messages: Messages, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        typeof value === "object" && value !== null
          ? (value as Record<string, unknown>)[key]
          : undefined,
      messages,
    );
}

/**
 * Parameterized translation lookup (Spec #8 §79 — never concatenate
 * translated fragments). `key` is a dot-path into the dictionary, e.g.
 * "nav.aujourdhui" or "foundation.buttons.primary".
 */
export function translate(
  messages: Messages,
  key: string,
  params?: Record<string, Primitive>,
): string {
  const value = resolvePath(messages, key);

  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return key;
  }

  if (!params) {
    return value;
  }

  return value.replace(/\{\{(\w+)\}\}/g, (match, paramName: string) =>
    paramName in params ? String(params[paramName]) : match,
  );
}

import { getDictionary, translate } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/config";

export type DocumentTranslator = (key: string, params?: Record<string, string | number>) => string;

/**
 * Generated documents render in `DocumentSettings.documentLanguage`, which
 * is deliberately independent from the current UI locale (CLAUDE.md §40).
 * Reuses the exact same dictionaries/keys the UI already translates through
 * — never a second copy of document label strings.
 */
export function createDocumentTranslator(locale: Locale): DocumentTranslator {
  const dictionary = getDictionary(locale);
  return (key, params) => translate(dictionary, key, params);
}

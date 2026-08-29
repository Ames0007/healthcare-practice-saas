import type { Locale } from "@/i18n/config";

/**
 * Arabic/RTL PDF generation is currently BLOCKED (task §31's own explicit
 * STOP condition: "If the selected PDF technology cannot correctly support
 * Arabic/RTL: STOP and report the limitation rather than shipping broken
 * documents").
 *
 * Real rendered-PDF visual QA (task §39/§40 — not just unit tests) found
 * that `@react-pdf/renderer` 4.9.0's Arabic text-shaping/layout pipeline
 * intermittently drops or corrupts individual glyphs (e.g. a leading
 * hamza-bearing letter, or an internal "ف"), reproduced identically across
 * two different embedded fonts (Noto Naskh Arabic, Noto Sans Arabic) and
 * even with text pre-shaped into Arabic Presentation Forms via
 * `arabic-reshaper` to bypass the library's own shaper — ruling out both
 * "wrong font" and "buggy contextual shaping" as fixable causes. See
 * ADR-016. French document generation is fully implemented, tested, and
 * visually verified — this boundary affects only `documentLanguage: "ar"`.
 */
export function isDocumentLanguageSupported(locale: Locale): boolean {
  return locale !== "ar";
}

/**
 * Digits-only, `+212`/`00212`-aware normalization so "06 12 34 56 78",
 * "0612345678" and "+212 6 12 34 56 78" all compare equal (UI-003B).
 * Comparison only -- the visible field keeps whatever the user typed.
 */
export function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("00212") && digits.length >= 13) return `0${digits.slice(5)}`;
  if (digits.startsWith("212") && digits.length >= 11) return `0${digits.slice(3)}`;
  return digits;
}

// Unicode "Combining Diacritical Marks" block (U+0300-U+036F) -- expressed
// as numeric code points rather than a character-class literal so no
// combining characters have to live directly in this source file.
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

function stripDiacritics(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < COMBINING_MARKS_START || code > COMBINING_MARKS_END) {
      result += char;
    }
  }
  return result;
}

/** Case- and accent-insensitive name comparison (UI-003B). */
export function normalizeName(value: string): string {
  return stripDiacritics(value.normalize("NFD"))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

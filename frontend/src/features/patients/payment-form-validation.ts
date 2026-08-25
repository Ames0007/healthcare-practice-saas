/** Whole positive MAD integers only — no fractional/floating-point amounts (CLAUDE.md §20, UI-004E §24). */
export function isValidPaymentAmount(raw: string): boolean {
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return false;
  }
  return Number(trimmed) > 0;
}

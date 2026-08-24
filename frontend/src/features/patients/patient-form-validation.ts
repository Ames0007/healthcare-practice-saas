import { normalizePhoneDigits } from "./normalize";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Loose prototype check (UI-003B §13/§14) — enough digits to be a real Moroccan number, not a rigid format. */
export function isValidMoroccanPhone(value: string): boolean {
  return normalizePhoneDigits(value).length >= 9;
}

/** ISO `yyyy-mm-dd` strings compare correctly with plain string comparison. */
export function isBirthDateNotFuture(isoDate: string, todayIso: string): boolean {
  return isoDate <= todayIso;
}

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

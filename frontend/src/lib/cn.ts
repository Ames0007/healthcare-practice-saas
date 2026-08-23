export type ClassValue = string | false | null | undefined;

/** Minimal conditional className joiner — no dependency needed for this. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

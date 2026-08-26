import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import type { CashSession } from "@/components/domain/finance/types";

export { MOCK_BUSINESS_DATE };

/**
 * Deterministic prototype "Open Caisse" defaults (UI-006C §21-22) — never
 * `Date.now()`, so opening the register produces the same result on every
 * run/test. `OPENED_BY_NAME` is a new, deliberately distinct synthetic
 * receptionist name — not "Sara Alaoui" (already the canonical empty-
 * fixture patient across UI-004D/E/UI-005*, pat-2), to avoid a name
 * collision between a staff member and a patient. No Team/HR fixture
 * array is introduced for this (§21) — just these two constants.
 */
export const OPENED_BY_NAME = "Meryem Bakkali";
export const SESSION_OPENED_AT = "08:15";

/** Deterministic prototype "Close Caisse" time (UI-006E §23) — never `Date.now()`, matching the task's own wireframe example exactly. */
export const SESSION_CLOSED_AT = "18:35";

/** Sensible prefill for the opening-balance input — matches the same 500 MAD float already used by the Finance dashboard's own prototype cash-position seed (UI-006A). */
export const DEFAULT_OPENING_BALANCE = 500;

/**
 * The live route's default state (UI-006C §17): an already-open synthetic
 * session so a reviewer can inspect movement history immediately, while
 * the component itself fully supports starting `null` (closed/not yet
 * opened) so the opening workflow can also be demonstrated and tested.
 */
export function getDefaultOpenSessionMockData(): CashSession {
  return {
    id: `cs-${MOCK_BUSINESS_DATE}`,
    businessDate: MOCK_BUSINESS_DATE,
    status: "open",
    openedAt: SESSION_OPENED_AT,
    openedBy: OPENED_BY_NAME,
    openingBalance: DEFAULT_OPENING_BALANCE,
  };
}

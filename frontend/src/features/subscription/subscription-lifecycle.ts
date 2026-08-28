/**
 * Deterministic date arithmetic for the subscription lifecycle (UI-011ABC
 * Gate 1). UTC-based construction (`Date.UTC`), mirroring `addDaysIso`'s
 * own documented discipline (`features/agenda/format.ts`) — mixing
 * local-time `Date` parsing with UTC arithmetic silently shifts results by
 * a day on any machine ahead of UTC.
 */
export function computeDaysBetween(fromIso: string, toIso: string): number {
  const [fromYear, fromMonth, fromDay] = fromIso.split("-").map(Number);
  const [toYear, toMonth, toDay] = toIso.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** Spec #2 §49.3 / Spec #3 WF-55: "Three-day grace period after expiration." The only grace-period duration the approved specifications define. */
export const GRACE_PERIOD_DAYS = 3;

/** Spec #2 §49.3's own earliest reminder point (D-15) — the only concrete "expiring soon" threshold defined anywhere, reused rather than inventing a separate number. */
export const EXPIRING_SOON_THRESHOLD_DAYS = 15;

/** Positive while `targetIso` is still ahead of `businessDate`; 0 once reached/passed. Never negative — a passed date is "0 days remaining," not a negative countdown. */
export function computeDaysRemaining(targetIso: string, businessDate: string): number {
  return Math.max(0, computeDaysBetween(businessDate, targetIso));
}

/** True only while trial is active and within the D-15 reminder window (Spec #2 §49.3). */
export function isExpiringSoon(targetIso: string, businessDate: string): boolean {
  const daysRemaining = computeDaysRemaining(targetIso, businessDate);
  return daysRemaining > 0 && daysRemaining <= EXPIRING_SOON_THRESHOLD_DAYS;
}

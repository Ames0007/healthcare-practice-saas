import type { Delegation, DelegationStatus } from "@/components/domain/access/types";

/**
 * Pure date-derivation for delegation status (UI-011X Gate 3, task §17:
 * "Implement scheduled/active/expired/revoked derivation"). Deliberately
 * a leaf module with no other feature imports — `effective-access.ts`
 * depends on this, never the reverse, so the two never form a cycle.
 */
export function resolveDelegationStatus(delegation: Delegation, businessDate: string): DelegationStatus {
  if (delegation.revokedAt) {
    return "revoked";
  }
  if (businessDate < delegation.startsAt) {
    return "scheduled";
  }
  if (businessDate > delegation.endsAt) {
    return "expired";
  }
  return "active";
}

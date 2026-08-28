import type { Delegation } from "@/components/domain/access/types";

/**
 * Centralized synthetic delegation fixture (UI-011X Gate 3, built as a
 * Gate 2 prerequisite since Screen 46-equivalent's own per-user summary,
 * task §14, already needs an "active delegations" count). Every
 * `delegatorMembershipId` is Dr. Benali's own Owner/Admin membership
 * (`membership-1`, which effectively holds every permission — a real
 * constraint this fixture set satisfies, not just asserts, proven by
 * `cross-governance-integrity.test.ts`) and every `permissionKey` is
 * `delegatable: true` in the catalog. One fixture per lifecycle state
 * (task §17), all dates relative to `MOCK_BUSINESS_DATE` ("2026-08-23"):
 *
 * - `delegation-1` (Meryem, `invoices.create`, 08-18→08-28) is currently
 *   active — reproduces the task's own "Délégations actives: 1" figure
 *   for Meryem exactly.
 * - `delegation-2` (Amal, `hr.manage`, 09-01→09-15) has not started yet.
 * - `delegation-3` (Nawal, `expenses.manage`, 07-01→07-15) already ended.
 * - `delegation-4` (Amal, `settings.manage`, 08-10→08-20, revoked
 *   08-15) proves revocation wins even mid-window — the window itself
 *   would otherwise still be open on the business date.
 */
export function getDelegationsMockData(): Delegation[] {
  return [
    {
      id: "delegation-1",
      delegatorMembershipId: "membership-1",
      delegateMembershipId: "membership-3",
      permissionKey: "invoices.create",
      reason: "Couverture pendant l'absence du Dr Benali",
      startsAt: "2026-08-18",
      endsAt: "2026-08-28",
      createdAt: "2026-08-17",
    },
    {
      id: "delegation-2",
      delegatorMembershipId: "membership-1",
      delegateMembershipId: "membership-2",
      permissionKey: "hr.manage",
      reason: "Congé prévu du Dr Benali début septembre",
      startsAt: "2026-09-01",
      endsAt: "2026-09-15",
      createdAt: "2026-08-20",
    },
    {
      id: "delegation-3",
      delegatorMembershipId: "membership-1",
      delegateMembershipId: "membership-4",
      permissionKey: "expenses.manage",
      reason: "Couverture décaissements — juillet",
      startsAt: "2026-07-01",
      endsAt: "2026-07-15",
      createdAt: "2026-06-28",
    },
    {
      id: "delegation-4",
      delegatorMembershipId: "membership-1",
      delegateMembershipId: "membership-2",
      permissionKey: "settings.manage",
      reason: "Configuration temporaire — finalement annulée",
      startsAt: "2026-08-10",
      endsAt: "2026-08-20",
      revokedAt: "2026-08-15",
      createdAt: "2026-08-09",
    },
  ];
}

import type { AccessAuditEvent } from "@/components/domain/access/types";

/**
 * Bounded, read-only audit prototype (UI-011X Gate 4, task §23,
 * WF-35/WF-64/WF-65/WF-66's own repeated "Audit event" requirement).
 * Every event here traces to a fact that actually holds in the current
 * fixture state — never an independently invented log line: Meryem
 * Bakkali's own grant/restriction events (`audit-2`/`audit-3`/`audit-4`)
 * name exactly the permission keys her real `TenantMembership` still
 * carries (`mock-users-data.ts`); `audit-5`/`audit-6` reference real
 * `Delegation` ids (`mock-delegations-data.ts`) whose own
 * `createdAt`/`revokedAt` match these events' own `occurredAt` exactly —
 * proven by `cross-governance-integrity.test.ts`, not merely asserted.
 * Static fixture list, not a real append-only log (CLAUDE.md §39's real
 * guarantee is a backend concern this prototype does not implement).
 */
export function getAccessAuditEventsMockData(): AccessAuditEvent[] {
  return [
    {
      id: "audit-1",
      occurredAt: "2025-03-01",
      type: "role_assigned",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-3",
      detail: "role-receptionist",
    },
    {
      id: "audit-2",
      occurredAt: "2025-06-15",
      type: "permission_granted",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-3",
      detail: "invoices.view",
    },
    {
      id: "audit-3",
      occurredAt: "2025-06-15",
      type: "permission_granted",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-3",
      detail: "payments.record",
    },
    {
      id: "audit-4",
      occurredAt: "2025-09-01",
      type: "permission_restricted",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-3",
      detail: "patients.edit_admin",
    },
    {
      id: "audit-5",
      occurredAt: "2026-08-17",
      type: "delegation_created",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-3",
      detail: "delegation-1",
    },
    {
      id: "audit-6",
      occurredAt: "2026-08-15",
      type: "delegation_revoked",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-2",
      detail: "delegation-4",
    },
    {
      id: "audit-7",
      occurredAt: "2026-06-01",
      type: "user_deactivated",
      actorMembershipId: "membership-1",
      targetMembershipId: "membership-5",
    },
  ];
}

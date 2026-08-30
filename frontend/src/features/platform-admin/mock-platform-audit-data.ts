import type { PlatformAuditEvent } from "@/components/domain/platform-admin/types";
import { addDaysIso } from "@/features/agenda/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";

/**
 * Bounded, read-only platform audit fixture (UI-013ABCDE Gate 5, Spec #4
 * §30.1). Every event traces to a fact that actually holds in this
 * module's own fixture state — never an independently invented log line
 * (mirrors `features/access/mock-audit-data.ts`'s own discipline):
 * `paudit-1` mirrors the REAL access-governance audit event for Othmane
 * Zouiten's deactivation (`features/access/mock-audit-data.ts`'s
 * `audit-7`, same `occurredAt`, same person — proven by
 * `cross-platform-admin-integrity.test.ts`); `paudit-3`'s date matches
 * `sub-7`'s own `cancelledAt` exactly (`getCancelledSubscriptionMockData`);
 * `paudit-5` is the one manual, audited action this fixture models on top
 * of `tenant-6`'s automatic blackout — WF-55/56's blackout transition
 * itself is a system consequence, not an admin action, so it is
 * deliberately not logged here as one.
 */
export function getPlatformAuditEventsMockData(): PlatformAuditEvent[] {
  return [
    {
      id: "paudit-1",
      occurredAt: "2026-06-01",
      actionCode: "user.disabled",
      tenantId: "tenant-1",
      resourceType: "user",
      resourceId: "user-5",
    },
    {
      id: "paudit-2",
      occurredAt: "2026-07-01",
      actionCode: "subscription.manual_renewal",
      tenantId: "tenant-3",
      resourceType: "subscription",
      resourceId: "sub-3",
      reason: "Paiement reçu par virement bancaire, renouvellement enregistré manuellement.",
    },
    {
      id: "paudit-3",
      occurredAt: addDaysIso(MOCK_BUSINESS_DATE, -5),
      actionCode: "subscription.cancelled",
      tenantId: "tenant-7",
      resourceType: "subscription",
      resourceId: "sub-7",
      reason: "Cabinet fermé à la demande du propriétaire.",
    },
    {
      id: "paudit-4",
      occurredAt: addDaysIso(MOCK_BUSINESS_DATE, -5),
      actionCode: "user.disabled",
      tenantId: "tenant-7",
      resourceType: "user",
      resourceId: "user-12",
      reason: "Cabinet fermé — compte propriétaire désactivé.",
    },
    {
      id: "paudit-5",
      occurredAt: addDaysIso(MOCK_BUSINESS_DATE, -3),
      actionCode: "tenant.suspended",
      tenantId: "tenant-6",
      resourceType: "tenant",
      resourceId: "tenant-6",
      reason: "Abonnement en blackout depuis plus de 5 jours sans régularisation — accès restreint en complément.",
    },
  ];
}

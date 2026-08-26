import type { CommissionRule } from "@/components/domain/team/types";

/**
 * Centralized commission-rule fixtures (UI-007CDEF Gate 4). Only real
 * `practitionerId`-linked practitioners get a rule — Othmane Zouiten
 * (team-7, a practitioner with no `practitionerId`) deliberately has
 * none, proving `isCommissionEligible`'s own two-part rule (§56).
 * Rates are prototype configuration only; every *amount* this rule ever
 * produces is computed live from the real, existing invoice/payment
 * fixtures (`features/patients/mock-invoices-data.ts`/`mock-payments-data.ts`)
 * — never an independent hardcoded revenue figure (§55).
 */
export function getCommissionRulesMockData(): CommissionRule[] {
  return [
    { id: "cr-team-1", teamMemberId: "team-1", basis: "collected_payments", ratePercent: 20, status: "active" },
    { id: "cr-team-2", teamMemberId: "team-2", basis: "collected_payments", ratePercent: 25, status: "active" },
  ];
}

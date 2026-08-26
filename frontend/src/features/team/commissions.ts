import type { Invoice, MoneyAmount, Payment } from "@/components/domain/finance/types";
import type { CommissionRule, TeamMember } from "@/components/domain/team/types";
import { PRACTITIONERS } from "@/features/agenda/mock-data";

export function getCommissionRuleForMember(rules: CommissionRule[], teamMemberId: string): CommissionRule | null {
  return rules.find((rule) => rule.teamMemberId === teamMemberId && rule.status === "active") ?? null;
}

/**
 * A TeamMember is commission-eligible only with `role === "practitioner"`
 * AND a real `practitionerId` link (§56) — a practitioner role alone is
 * not sufficient (Othmane Zouiten, `features/team/mock-data.ts`, is a
 * practitioner with no `practitionerId`, deliberately proving this).
 */
export function isCommissionEligible(member: Pick<TeamMember, "role" | "practitionerId">): boolean {
  return member.role === "practitioner" && Boolean(member.practitionerId);
}

/** Resolves via `practitionerId` (§56), never by matching on display name. */
export function resolvePractitionerName(member: Pick<TeamMember, "practitionerId">): string | null {
  if (!member.practitionerId) return null;
  return PRACTITIONERS.find((practitioner) => practitioner.id === member.practitionerId)?.name ?? null;
}

export interface CommissionActivityItem {
  paymentId: string;
  patientId: string;
  date: string;
  description: string;
  amount: MoneyAmount;
}

/**
 * Eligible activity for one practitioner in one period (§54-55/§57 — basis
 * fixed to collected payments, matching Spec #9 Screen 38/Spec #3 WF-40's
 * own worked example exactly). Reuses the *existing* Invoice/Payment
 * fixtures verbatim — never an independent `commissionRevenue` number
 * (§55). Sums each payment's own *allocation* amount (not the whole
 * payment) so a hypothetical multi-invoice payment is never
 * double-counted onto one practitioner (§25/WF-40's own acceptance
 * criterion): only posted payments, only allocations against an invoice
 * genuinely attributed to this practitioner, only within the period's own
 * date range.
 */
export function getEligibleCommissionActivity(
  payments: Payment[],
  invoices: Invoice[],
  practitionerName: string,
  periodStart: string,
  periodEnd: string,
): CommissionActivityItem[] {
  const practitionerInvoiceIds = new Set(
    invoices.filter((invoice) => invoice.practitionerName === practitionerName).map((invoice) => invoice.id),
  );
  const invoicesById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const items: CommissionActivityItem[] = [];

  for (const payment of payments) {
    if (payment.status !== "posted") continue;
    if (payment.paymentDate < periodStart || payment.paymentDate > periodEnd) continue;

    for (const allocation of payment.allocations) {
      if (!practitionerInvoiceIds.has(allocation.invoiceId)) continue;

      items.push({
        paymentId: payment.id,
        patientId: payment.patientId,
        date: payment.paymentDate,
        description: invoicesById.get(allocation.invoiceId)?.description ?? "",
        amount: allocation.amount,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export function computeEligibleBase(activity: CommissionActivityItem[]): MoneyAmount {
  return activity.reduce((sum, item) => sum + item.amount, 0);
}

/** Percentage of the eligible base (§57) — the only basis this prototype implements, matching WF-40's own example (4 000 × 30% = 1 200 MAD) exactly. */
export function computeCommissionAmount(eligibleBase: MoneyAmount, ratePercent: number): MoneyAmount {
  return Math.round((eligibleBase * ratePercent) / 100);
}

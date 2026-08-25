import type { CabinetExpense } from "@/components/domain/finance/types";

/**
 * Centralized synthetic cabinet expense fixtures (UI-006A §11/§33) — no
 * expense-entry UI reads or writes these; they exist solely to give the
 * Décaissements KPI/recent-activity list something real to aggregate.
 *
 * Dates are chosen against the same `MOCK_BUSINESS_DATE` ("2026-08-23",
 * `features/today/mock-data.ts`) prototype convention used across the whole
 * app, deliberately spanning three period boundaries so period switching
 * produces genuinely different totals (UI-006A §16):
 *
 * - exp-1 (2026-08-23) — inside Today, this week and this month.
 * - exp-2 (2026-08-20) — inside this week and this month, not Today.
 * - exp-3 (2026-08-10) — inside this month only.
 * - exp-4 (2026-07-28) — outside this month entirely (previous month).
 * - exp-5 (2026-08-18) — inside this week/month but `status: "cancelled"`,
 *   deliberately excluded from every aggregate (CLAUDE.md §27) to prove the
 *   exclusion rule the same way `pay-4` proves it for reversed payments
 *   (UI-004E).
 */
export function getExpensesMockData(): CabinetExpense[] {
  return [
    { id: "exp-1", date: "2026-08-23", label: "Fournitures médicales", category: "supplies", amount: 150, status: "posted" },
    { id: "exp-2", date: "2026-08-20", label: "Prestataire nettoyage", category: "services", amount: 300, status: "posted" },
    { id: "exp-3", date: "2026-08-10", label: "Facture électricité", category: "utilities", amount: 450, status: "posted" },
    { id: "exp-4", date: "2026-07-28", label: "Abonnement Internet", category: "other", amount: 200, status: "posted" },
    { id: "exp-5", date: "2026-08-18", label: "Matériel informatique (commande annulée)", category: "supplies", amount: 500, status: "cancelled" },
  ];
}

export function getEmptyExpensesMockData(): CabinetExpense[] {
  return [];
}

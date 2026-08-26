"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASH_SESSION_STATUS_MAP } from "@/components/domain/finance/cash-session-status";
import { CaisseSummary } from "@/features/caisse/components/caisse-summary";
import {
  buildCashMovements,
  computeIncomingTotal,
  computeOutgoingTotal,
  computeTheoreticalBalance,
} from "@/features/caisse/calculations";
import type { CabinetExpense, CashSession, Payment } from "@/components/domain/finance/types";
import type { Patient } from "@/features/patients/types";

export interface DashboardCaisseSectionProps {
  session: CashSession | null;
  payments: Payment[];
  expenses: CabinetExpense[];
  patients: Patient[];
  businessDate: string;
}

/**
 * "Caisse aujourd'hui" (UI-006X §19-21) — replaces the removed "Position
 * caisse" projection with Caisse's own real operational state. Reuses
 * `buildCashMovements`/`computeIncomingTotal`/`computeOutgoingTotal`/
 * `computeTheoreticalBalance` and the `CaisseSummary` component verbatim
 * from `features/caisse/` (UI-006C) — never a second cash-position
 * formula (§20/§24). Status uses the same `CASH_SESSION_STATUS_MAP` as
 * `/app/finance/caisse` itself, so "OUVERTE"/"FERMÉE" always agree.
 */
export function DashboardCaisseSection({ session, payments, expenses, patients, businessDate }: DashboardCaisseSectionProps) {
  const { t } = useLocale();
  const isOpen = session !== null && session.status === "open";
  const statusMeta = CASH_SESSION_STATUS_MAP[isOpen ? "open" : "closed"];

  const movements = isOpen && session ? buildCashMovements(payments, expenses, patients, session.id, businessDate) : [];
  const incoming = computeIncomingTotal(movements);
  const outgoing = computeOutgoingTotal(movements);
  const theoretical = isOpen && session ? computeTheoreticalBalance(session.openingBalance, incoming, outgoing) : 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("finance.dashboard.caisseTitle")}
        </h2>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </div>

      {isOpen && session ? (
        <div className="flex flex-col gap-3">
          <CaisseSummary opening={session.openingBalance} incoming={incoming} outgoing={outgoing} theoretical={theoretical} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {t("finance.caisse.openedAtLabel")} <span dir="ltr">{session.openedAt}</span> ·{" "}
              {t("finance.caisse.openedByLabel")} <span>{session.openedBy}</span>
            </p>
            <Link href="/app/finance/caisse" className={buttonClassNames("outline", "sm")}>
              {t("finance.expenses.viewCaisseAction")}
            </Link>
          </div>
        </div>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">{t("finance.dashboard.caisseClosedNote")}</p>
          <Link href="/app/finance/caisse" className={buttonClassNames("outline", "sm")}>
            {t("finance.expenses.viewCaisseAction")}
          </Link>
        </Card>
      )}
    </section>
  );
}

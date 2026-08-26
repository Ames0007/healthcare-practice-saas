"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { CASH_SESSION_STATUS_MAP } from "@/components/domain/finance/cash-session-status";
import type { CabinetExpense, CashSession, Payment } from "@/components/domain/finance/types";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { FinanceNav } from "@/features/finance/components/finance-nav";
import {
  buildCashMovements,
  computeCashDifference,
  computeIncomingTotal,
  computeOutgoingTotal,
  computeTheoreticalBalance,
  resolveCashDifferenceType,
} from "./calculations";
import {
  DEFAULT_OPENING_BALANCE,
  getDefaultOpenSessionMockData,
  MOCK_BUSINESS_DATE,
  OPENED_BY_NAME,
  SESSION_CLOSED_AT,
  SESSION_OPENED_AT,
} from "./mock-data";
import { ClosedCaissePanel } from "./components/closed-caisse-panel";
import { CaisseSummary } from "./components/caisse-summary";
import { ClosedCaisseSummary } from "./components/closed-caisse-summary";
import { CaisseMovementList } from "./components/caisse-movement-list";
import { CashCountDialog, type CashCountResult } from "./components/cash-count-dialog";
import { CloseConfirmDialog } from "./components/close-confirm-dialog";
import { CaisseSkeleton } from "./components/caisse-skeleton";

export type CaissePageState = "loading" | "loaded" | "error";

export interface CaissePageProps {
  /** Prototype seams (mirrors every other top-level screen): swap for real query results later. */
  payments?: Payment[];
  expenses?: CabinetExpense[];
  patients?: Patient[];
  /**
   * Prototype seam for the session's own state — omit to get the live
   * default (an already-open synthetic session, UI-006C §17); pass `null`
   * explicitly to start CLOSED (no session yet) so the opening workflow
   * can be exercised/tested.
   */
  initialSession?: CashSession | null;
  state?: CaissePageState;
  onRetry?: () => void;
}

/**
 * Caisse — today's cash register (UI-006C, closing/reconciliation added by
 * UI-006E), at `/app/finance/caisse` (Spec #2 §3's own IA sitemap nests
 * Caisse under Finance, alongside Factures/Échéances/Encaissements/
 * Décaissements — not a standalone `/app/caisse`). Answers "is the
 * register open, what cash moved, what should physically be inside it
 * now, and — once closed — what was actually counted and why it did or
 * didn't match." Movements are always derived from the existing Payment/
 * CabinetExpense fixtures (UI-004E/UI-006A), never independently
 * authored. No expense entry, no second payment-capture workflow, no
 * Caisse reopening anywhere in this screen.
 *
 * Three distinct states share this one route (UI-006E §8): `session ===
 * null` is "not yet opened today" (no row exists until first opened,
 * matching backend truth); `session.status === "closed"` is a genuinely
 * completed, read-only closed session (`closedAt` set) — the two "not
 * open" states are deliberately NOT the same `CashSessionStatus` value
 * collapsed together, so a closed session never falls back into the
 * opening-balance panel.
 */
export function CaissePage({
  payments: providedPayments,
  expenses: providedExpenses,
  patients: providedPatients,
  initialSession,
  state = "loaded",
  onRetry,
}: CaissePageProps) {
  const { t } = useLocale();
  const [session, setSession] = useState<CashSession | null>(() =>
    initialSession !== undefined ? initialSession : getDefaultOpenSessionMockData(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCashCountOpen, setCashCountOpen] = useState(false);
  const [cashCountDialogKey, setCashCountDialogKey] = useState(0);
  const [pendingClosing, setPendingClosing] = useState<CashCountResult | null>(null);

  if (state === "loading") {
    return <CaisseSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("finance.caisse.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("finance.caisse.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const payments = providedPayments ?? getPaymentsMockData();
  const expenses = providedExpenses ?? getExpensesMockData();
  const patients = providedPatients ?? getPatientsMockData();

  function handleOpen(openingBalance: number) {
    setSession({
      id: `cs-${MOCK_BUSINESS_DATE}`,
      businessDate: MOCK_BUSINESS_DATE,
      status: "open",
      openedAt: SESSION_OPENED_AT,
      openedBy: OPENED_BY_NAME,
      openingBalance,
    });
    setToastMessage(t("finance.caisse.openedSuccess"));
  }

  const isOpen = session !== null && session.status === "open";
  const isClosed = session !== null && session.status === "closed";
  const statusMeta = CASH_SESSION_STATUS_MAP[isOpen ? "open" : "closed"];

  const movements =
    session !== null ? buildCashMovements(payments, expenses, patients, session.id, session.businessDate) : [];
  const incoming = computeIncomingTotal(movements);
  const outgoing = computeOutgoingTotal(movements);
  const theoretical = session !== null ? computeTheoreticalBalance(session.openingBalance, incoming, outgoing) : 0;

  function openClosingFlow() {
    setCashCountOpen(true);
    setCashCountDialogKey((key) => key + 1);
  }

  function handleCashCountContinue(result: CashCountResult) {
    setCashCountOpen(false);
    setPendingClosing(result);
  }

  function handleCloseConfirm() {
    if (session === null || pendingClosing === null) {
      return;
    }

    const differenceAmount = computeCashDifference(pendingClosing.physicalClosingBalance, theoretical);

    setSession({
      ...session,
      status: "closed",
      expectedClosingBalance: theoretical,
      physicalClosingBalance: pendingClosing.physicalClosingBalance,
      differenceAmount,
      differenceType: resolveCashDifferenceType(differenceAmount),
      discrepancyReason: pendingClosing.discrepancyReason,
      closedAt: SESSION_CLOSED_AT,
      closedBy: session.openedBy,
    });
    setPendingClosing(null);
    setToastMessage(t("finance.caisse.closing.closedSuccess"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("finance.caisse.pageTitle")}
        secondaryAction={<StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>}
      />

      <FinanceNav />

      {session === null ? (
        <ClosedCaissePanel defaultOpeningBalance={DEFAULT_OPENING_BALANCE} onOpen={handleOpen} />
      ) : isClosed ? (
        <ClosedCaisseSummary session={session} incoming={incoming} outgoing={outgoing} />
      ) : (
        <>
          <p className="text-sm text-text-muted">
            {t("finance.caisse.openedAtLabel")} <span dir="ltr">{session.openedAt}</span> ·{" "}
            {t("finance.caisse.openedByLabel")} <span>{session.openedBy}</span>
          </p>

          <CaisseSummary opening={session.openingBalance} incoming={incoming} outgoing={outgoing} theoretical={theoretical} />
        </>
      )}

      {session !== null && (
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("finance.caisse.movements.title")}
            </h2>
            <p className="text-sm text-text-muted" aria-live="polite">
              {t("finance.caisse.movements.resultCount", { count: movements.length })}
            </p>
          </div>
          <CaisseMovementList movements={movements} />
        </div>
      )}

      {isOpen && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={openClosingFlow}>
            {t("finance.caisse.closeAction")}
          </Button>
        </div>
      )}

      <CashCountDialog
        key={cashCountDialogKey}
        open={isCashCountOpen}
        onClose={() => setCashCountOpen(false)}
        opening={session?.openingBalance ?? 0}
        incoming={incoming}
        outgoing={outgoing}
        expectedClosingBalance={theoretical}
        onContinue={handleCashCountContinue}
      />

      {pendingClosing && (
        <CloseConfirmDialog
          open
          onClose={() => setPendingClosing(null)}
          onConfirm={handleCloseConfirm}
          expectedClosingBalance={theoretical}
          physicalClosingBalance={pendingClosing.physicalClosingBalance}
          differenceAmount={computeCashDifference(pendingClosing.physicalClosingBalance, theoretical)}
          discrepancyReason={pendingClosing.discrepancyReason}
        />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

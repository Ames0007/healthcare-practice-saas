"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { getDefaultOpenSessionMockData, MOCK_BUSINESS_DATE } from "@/features/caisse/mock-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import type { CabinetExpense, CashMovement, CashSession } from "@/components/domain/finance/types";
import {
  computeExpensesTotal,
  createExpenseAndMovement,
  filterTodayPostedExpenses,
  sortExpensesNewestFirst,
  type NewExpenseInput,
} from "./expenses";
import { FinanceNav } from "./components/finance-nav";
import { ExpenseSummary } from "./components/expense-summary";
import { ExpenseHistoryList } from "./components/expense-history-list";
import { NewExpenseDialog } from "./components/new-expense-dialog";
import { ExpenseDetailDrawer } from "./components/expense-detail-drawer";
import { ExpensesSkeleton } from "./components/expenses-skeleton";

export type ExpensesPageState = "loading" | "loaded" | "error";

export interface ExpensesPageProps {
  /** Prototype seams, mirroring Caisse's own (UI-006C): swap for real query results later. */
  expenses?: CabinetExpense[];
  /** Omit for the live default (an already-open synthetic session, matching `/app/finance/caisse`'s own default); pass `null` to start CLOSED. */
  initialSession?: CashSession | null;
  state?: ExpensesPageState;
  onRetry?: () => void;
}

/**
 * Décaissements & Expenses (UI-006D) — the cabinet cash-expense workspace
 * at `/app/finance/expenses`. Today's décaissement history only (§15): a
 * décaissement is a cash-register operation tied to the currently open
 * Caisse session, not a broader accounting ledger, so — like
 * `/app/finance/caisse` itself — this screen is scoped to
 * `MOCK_BUSINESS_DATE` rather than offering a period selector; Spec #9
 * Screen 32's own Période/Catégorie filters are deliberately not
 * implemented here (documented decision, CHANGELOG).
 *
 * A successful "+ Nouveau décaissement" submission builds a matching
 * `CabinetExpense` + `CashMovement` OUT pair via `createExpenseAndMovement`
 * (structurally atomic by construction) and applies both to local state in
 * the same handler — never a state where one exists without the other.
 * This page never renders the Caisse's own theoretical-balance summary
 * (that stays `/app/finance/caisse`'s own scope, §45); the balance-impact
 * relationship is instead proven directly by `expenses.test.ts` against
 * `features/caisse/calculations.ts`'s exported functions.
 */
export function ExpensesPage({ expenses: providedExpenses, initialSession, state = "loaded", onRetry }: ExpensesPageProps) {
  const { t } = useLocale();
  const [session] = useState<CashSession | null>(() =>
    initialSession !== undefined ? initialSession : getDefaultOpenSessionMockData(),
  );
  const [expenses, setExpenses] = useState<CabinetExpense[]>(() => providedExpenses ?? getExpensesMockData());
  const [, setMovements] = useState<CashMovement[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<CabinetExpense | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sequenceRef = useRef(1);

  if (state === "loading") {
    return <ExpensesSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("finance.expenses.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("finance.expenses.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const isCaisseOpen = session !== null && session.status === "open";
  const todayExpenses = sortExpensesNewestFirst(filterTodayPostedExpenses(expenses, MOCK_BUSINESS_DATE));
  const total = computeExpensesTotal(todayExpenses);

  function openCreateDialog() {
    setDialogOpen(true);
    setDialogKey((key) => key + 1);
  }

  function openDetail(expense: CabinetExpense) {
    setSelectedExpense(expense);
    setDrawerKey((key) => key + 1);
  }

  function handleCreate(input: NewExpenseInput) {
    if (!isCaisseOpen || session === null) {
      return;
    }

    const { expense, movement } = createExpenseAndMovement(input, {
      sequence: sequenceRef.current,
      businessDate: MOCK_BUSINESS_DATE,
      cashSessionId: session.id,
      createdBy: session.openedBy ?? "",
    });
    sequenceRef.current += 1;

    setExpenses((current) => [expense, ...current]);
    setMovements((current) => [movement, ...current]);
    setDialogOpen(false);
    setToastMessage(t("finance.expenses.expenseRecorded"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("finance.expenses.pageTitle")}
        description={t("finance.expenses.pageDescription")}
        primaryAction={
          isCaisseOpen ? (
            <Button type="button" onClick={openCreateDialog}>
              {t("finance.expenses.newAction")}
            </Button>
          ) : undefined
        }
        secondaryAction={
          <Link href="/app/finance/caisse" className={buttonClassNames("outline", "md")}>
            {t("finance.expenses.viewCaisseAction")}
          </Link>
        }
      />

      <FinanceNav />

      {!isCaisseOpen && (
        <Card variant="alert" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text">{t("finance.expenses.closedGuidance")}</p>
          <Link href="/app/finance/caisse" className={buttonClassNames("outline", "sm")}>
            {t("finance.expenses.viewCaisseAction")}
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{t("finance.expenses.todayLabel")}</h2>
        <ExpenseSummary total={total} count={todayExpenses.length} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("finance.expenses.historyTitle")}
          </h2>
          <p className="text-sm text-text-muted" aria-live="polite">
            {t("finance.expenses.resultCount", { count: todayExpenses.length })}
          </p>
        </div>
        <ExpenseHistoryList expenses={todayExpenses} onSelect={openDetail} canCreate={isCaisseOpen} onCreate={openCreateDialog} />
      </div>

      <NewExpenseDialog key={dialogKey} open={isDialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />

      <ExpenseDetailDrawer
        key={drawerKey}
        expense={selectedExpense}
        open={selectedExpense !== null}
        onClose={() => setSelectedExpense(null)}
        onFutureFeature={(message) => setToastMessage(message)}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

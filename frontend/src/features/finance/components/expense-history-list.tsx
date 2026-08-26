"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORY_MAP } from "@/components/domain/finance/expense-category";
import { formatMad } from "@/features/finance/format";
import type { CabinetExpense } from "@/components/domain/finance/types";

export interface ExpenseHistoryListProps {
  expenses: CabinetExpense[];
  onSelect: (expense: CabinetExpense) => void;
  canCreate: boolean;
  onCreate: () => void;
}

/**
 * Today's décaissement history (UI-006D §13/§16/§34) — flat operational
 * list (mirrors `CaisseMovementList`'s own card style), never an
 * accounting-style wide table (§50). Every row opens the read-only detail
 * drawer; there is no edit/delete affordance anywhere (§36-37).
 */
export function ExpenseHistoryList({ expenses, onSelect, canCreate, onCreate }: ExpenseHistoryListProps) {
  const { t, locale } = useLocale();

  if (expenses.length === 0) {
    return (
      <EmptyState
        title={t("finance.expenses.emptyTodayTitle")}
        description={t("finance.expenses.emptyTodayDescription")}
        primaryAction={
          canCreate ? (
            <Button size="sm" onClick={onCreate}>
              {t("finance.expenses.newAction")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <button type="button" onClick={() => onSelect(expense)} className="block w-full text-start">
            <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:bg-surface-subtle">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t(EXPENSE_CATEGORY_MAP[expense.category].translationKey)}
                </p>
                <p className="truncate text-sm font-medium text-text">{expense.label}</p>
                <p className="text-xs text-text-muted">
                  {expense.time && (
                    <span dir="ltr">
                      {expense.time}
                      {expense.createdBy && " · "}
                    </span>
                  )}
                  {expense.createdBy}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-text" dir="ltr">
                {formatMad(expense.amount, locale)}
              </span>
            </Card>
          </button>
        </li>
      ))}
    </ul>
  );
}

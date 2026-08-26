"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORY_MAP } from "@/components/domain/finance/expense-category";
import type { CabinetExpense } from "@/components/domain/finance/types";
import { formatDayMonthYear, formatFileSize } from "@/features/patients/format";
import { formatMad } from "@/features/finance/format";

export interface ExpenseDetailDrawerProps {
  expense: CabinetExpense | null;
  open: boolean;
  onClose: () => void;
  onFutureFeature: (message: string) => void;
}

/**
 * Read-only décaissement detail (UI-006D §34-37, Spec #9 Screen 32's own
 * form fields, shown back read-only). No "Modifier"/"Supprimer" anywhere —
 * a posted expense is financial history (CLAUDE.md §24). "Télécharger le
 * justificatif" is a prototype affordance only, reusing the exact same
 * future-feature notice already established for clinical documents
 * (UI-005D) rather than inventing a second one.
 */
export function ExpenseDetailDrawer({ expense, open, onClose, onFutureFeature }: ExpenseDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!expense) {
    return null;
  }

  const categoryMeta = EXPENSE_CATEGORY_MAP[expense.category];

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={t("finance.expenses.detail.title")} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-text">{t("finance.expenses.detail.title")}</h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text" dir="ltr">
            {formatMad(expense.amount, locale)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.expenses.detail.categoryLabel")}
          </p>
          <p className="text-sm text-text">{t(categoryMeta.translationKey)}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.expenses.detail.descriptionLabel")}
          </p>
          <p className="text-sm text-text">{expense.label}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.expenses.detail.dateLabel")}
          </p>
          <p className="text-sm text-text" dir="ltr">
            {formatDayMonthYear(expense.date, locale)}
            {expense.time && <> · {expense.time}</>}
          </p>
        </div>

        {expense.createdBy && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("finance.expenses.detail.recordedByLabel")}
            </p>
            <p className="text-sm text-text">{expense.createdBy}</p>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.expenses.detail.supportingDocumentLabel")}
          </p>
          {expense.supportingDocument ? (
            <>
              <p className="mt-1 text-sm text-text" dir="ltr">
                {expense.supportingDocument.fileName}
              </p>
              <p className="text-xs text-text-muted" dir="ltr">
                {formatFileSize(expense.supportingDocument.sizeBytes, locale)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onFutureFeature(t("patientDetail.health.documents.downloadNotice"))}
              >
                {t("finance.expenses.detail.download")}
              </Button>
            </>
          ) : (
            <p className="mt-1 text-sm text-text-muted">{t("finance.expenses.detail.noSupportingDocument")}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

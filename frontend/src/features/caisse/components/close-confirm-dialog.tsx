"use client";

import { useLocale } from "@/i18n/locale-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMad } from "@/features/finance/format";
import type { MoneyAmount } from "@/components/domain/finance/types";

export interface CloseConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expectedClosingBalance: MoneyAmount;
  physicalClosingBalance: MoneyAmount;
  differenceAmount: MoneyAmount;
  discrepancyReason?: string;
}

/**
 * "Fermer la caisse ?" step 2 (UI-006E §20-21, Spec #9 Screen 31) — a
 * second, explicit confirmation before the sensitive, irreversible closing
 * mutation (this prototype implements no reopening, §"DO NOT implement
 * Caisse reopening"). Reuses the shared `ConfirmDialog` (already backing
 * appointment cancellation) rather than a bespoke dialog.
 */
export function CloseConfirmDialog({
  open,
  onClose,
  onConfirm,
  expectedClosingBalance,
  physicalClosingBalance,
  differenceAmount,
  discrepancyReason,
}: CloseConfirmDialogProps) {
  const { t, locale } = useLocale();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("finance.caisse.closing.confirmTitle")}
      description={t("finance.caisse.closing.confirmDescription")}
      cancelLabel={t("finance.caisse.closing.cancel")}
      confirmLabel={t("finance.caisse.closeAction")}
    >
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">{t("finance.caisse.summary.theoretical")}</span>
          <span dir="ltr">{formatMad(expectedClosingBalance, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">{t("finance.caisse.closing.physicalCountLabel")}</span>
          <span dir="ltr">{formatMad(physicalClosingBalance, locale)}</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-text">
          <span>{t("finance.caisse.closing.differenceLabel")}</span>
          <span dir="ltr">
            {differenceAmount > 0 ? "+" : ""}
            {formatMad(differenceAmount, locale)}
          </span>
        </div>
        {discrepancyReason && (
          <p className="mt-1 text-text-secondary">{discrepancyReason}</p>
        )}
      </div>
    </ConfirmDialog>
  );
}

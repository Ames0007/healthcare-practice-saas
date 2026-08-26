"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASH_DIFFERENCE_TYPE_MAP } from "@/components/domain/finance/cash-difference-type";
import { formatMad } from "@/features/finance/format";
import { computeCashDifference, isValidOpeningBalance, resolveCashDifferenceType } from "@/features/caisse/calculations";
import type { MoneyAmount } from "@/components/domain/finance/types";

export interface CashCountResult {
  physicalClosingBalance: MoneyAmount;
  discrepancyReason?: string;
}

export interface CashCountDialogProps {
  open: boolean;
  onClose: () => void;
  opening: MoneyAmount;
  incoming: MoneyAmount;
  outgoing: MoneyAmount;
  expectedClosingBalance: MoneyAmount;
  onContinue: (result: CashCountResult) => void;
}

/**
 * "CLÔTURE DE CAISSE" step 1 (UI-006E §10, Spec #9 Screen 31): read-only
 * opening/incoming/outgoing/expected recap (reusing `finance.caisse.summary.*`
 * — the same labels `CaisseSummary` uses, no duplicate strings) + physical
 * cash-count input + live écart. Deliberately starts empty rather than
 * prefilled with the expected balance — prefilling the value the count is
 * supposed to independently verify against would defeat the point of
 * counting. Reason is required only once a non-zero difference exists
 * (§18-19); "Continuer" never closes the register itself — it only hands
 * the validated count up to the caller, which opens the separate
 * `CloseConfirmDialog` (§20 — a second, explicit confirmation step).
 */
export function CashCountDialog({ open, onClose, opening, incoming, outgoing, expectedClosingBalance, onContinue }: CashCountDialogProps) {
  const { t, locale } = useLocale();
  const [physicalCount, setPhysicalCount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const physicalValue = Number(physicalCount);
  const isPhysicalValid = physicalCount.trim() !== "" && isValidOpeningBalance(physicalValue);
  const difference = isPhysicalValid ? computeCashDifference(physicalValue, expectedClosingBalance) : null;
  const differenceType = difference !== null ? resolveCashDifferenceType(difference) : null;
  const requiresReason = differenceType !== null && differenceType !== "balanced";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const required = t("patients.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!physicalCount.trim()) {
      nextErrors.physicalCount = required;
    } else if (!isValidOpeningBalance(physicalValue)) {
      nextErrors.physicalCount = t("patientDetail.payments.form.invalidAmountError");
    }

    if (!nextErrors.physicalCount) {
      const diff = computeCashDifference(physicalValue, expectedClosingBalance);
      if (diff !== 0 && !reason.trim()) {
        nextErrors.reason = required;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const diff = computeCashDifference(physicalValue, expectedClosingBalance);
    onContinue({ physicalClosingBalance: physicalValue, discrepancyReason: diff !== 0 ? reason.trim() : undefined });
  }

  const title = t("finance.caisse.closing.title");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("agenda.drawer.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">{t("finance.caisse.summary.opening")}</span>
            <span dir="ltr">{formatMad(opening, locale)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">{t("finance.caisse.summary.incoming")}</span>
            <span dir="ltr">{formatMad(incoming, locale)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">{t("finance.caisse.summary.outgoing")}</span>
            <span dir="ltr">{formatMad(outgoing, locale)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-text">
            <span>{t("finance.caisse.summary.theoretical")}</span>
            <span dir="ltr">{formatMad(expectedClosingBalance, locale)}</span>
          </div>
        </div>

        <section className="flex flex-col gap-4 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("finance.caisse.closing.physicalCountTitle")}
          </h3>

          <Input
            label={t("finance.caisse.closing.physicalCountLabel")}
            required
            inputMode="numeric"
            dir="ltr"
            value={physicalCount}
            onChange={(event) => setPhysicalCount(event.target.value)}
            error={errors.physicalCount}
          />

          {difference !== null && differenceType && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-secondary">{t("finance.caisse.closing.differenceLabel")}</span>
                <span className="font-semibold tabular-nums text-text" dir="ltr">
                  {difference > 0 ? "+" : ""}
                  {formatMad(difference, locale)}
                </span>
              </div>
              <StatusBadge tone={CASH_DIFFERENCE_TYPE_MAP[differenceType].tone} className="self-start">
                {t(CASH_DIFFERENCE_TYPE_MAP[differenceType].translationKey)}
              </StatusBadge>
            </div>
          )}

          {requiresReason && (
            <Textarea
              label={t("finance.caisse.closing.reasonLabel")}
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              error={errors.reason}
            />
          )}
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("finance.caisse.closing.cancel")}
          </Button>
          <Button type="submit">{t("finance.caisse.closing.continue")}</Button>
        </div>
      </form>
    </Dialog>
  );
}

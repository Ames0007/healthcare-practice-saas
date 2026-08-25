"use client";

import { ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { PAYMENT_STATUS_MAP } from "./payment-status";
import type { PaymentStatus } from "./types";

export interface PaymentRowProps {
  dateLabel: string;
  /** Receipt number when one exists, else the payment reference (UI-004E §36). */
  reference: string;
  amountLabel: string;
  methodLabel: string;
  invoiceNumber: string;
  status: PaymentStatus;
  /** Set only for a reversed payment (UI-004E §37). */
  reversalReasonLabel?: string;
  onSelect: () => void;
  className?: string;
}

/**
 * One row of the patient payment history (Spec #9 Screen 24 style list, UI-004E §17/§20) —
 * dense clickable row, mirroring `TreatmentPlanCard`'s "completed" variant rather than a full
 * `Card`, since payment history is meant to stay moderate-density (§20). Takes only
 * pre-resolved display strings/typed data, no mock-data coupling.
 */
export function PaymentRow({
  dateLabel,
  reference,
  amountLabel,
  methodLabel,
  invoiceNumber,
  status,
  reversalReasonLabel,
  onSelect,
  className,
}: PaymentRowProps) {
  const { t } = useLocale();
  const statusMeta = PAYMENT_STATUS_MAP[status];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3 text-start transition-colors last:border-b-0 hover:bg-surface-subtle",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-text" dir="ltr">
          {dateLabel}
        </p>
        <p className="text-xs text-text-muted" dir="ltr">
          {reference}
        </p>
        <p className="text-xs text-text-muted" dir="ltr">
          {invoiceNumber}
        </p>
        {reversalReasonLabel && <p className="mt-1 text-xs text-danger">{reversalReasonLabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-end">
          <p className="text-sm font-semibold tabular-nums text-text" dir="ltr">
            {amountLabel}
          </p>
          <p className="text-xs text-text-muted">{methodLabel}</p>
        </div>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted rtl:rotate-180" aria-hidden="true" />
      </div>
    </button>
  );
}

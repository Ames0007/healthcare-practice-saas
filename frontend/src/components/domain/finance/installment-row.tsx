"use client";

import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { INSTALLMENT_STATUS_MAP } from "./installment-status";
import type { InstallmentStatus } from "./types";

const ICON_TONE_CLASSES: Record<StatusTone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  neutral: "text-text-muted",
};

export interface InstallmentRowProps {
  sequenceNumber: number;
  dueDateLabel: string;
  amountLabel: string;
  status: InstallmentStatus;
  /** Down-payment caption (UI-004D §30) — set only for the paid-at-issuance first installment. */
  downPaymentCaption?: string;
}

/** One row of the staged-payment schedule (Spec #9 Screen 29, UI-004D §27-28) — icon + text + tone, never color alone. */
export function InstallmentRow({ sequenceNumber, dueDateLabel, amountLabel, status, downPaymentCaption }: InstallmentRowProps) {
  const { t } = useLocale();
  const meta = INSTALLMENT_STATUS_MAP[status];
  const Icon = meta.icon;

  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon className={cn("h-4 w-4 shrink-0", ICON_TONE_CLASSES[meta.tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{t("patientDetail.invoices.installmentLabel", { n: sequenceNumber })}</p>
        <p className="text-xs text-text-muted" dir="ltr">
          {dueDateLabel}
        </p>
        {downPaymentCaption && <p className="text-xs text-text-muted">{downPaymentCaption}</p>}
      </div>
      <span className="text-sm font-medium tabular-nums text-text" dir="ltr">
        {amountLabel}
      </span>
      <StatusBadge tone={meta.tone}>{t(meta.translationKey)}</StatusBadge>
    </li>
  );
}

"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/i18n/locale-provider";
import { INVOICE_STATUS_MAP } from "./invoice-status";
import type { InvoiceStatus } from "./types";

export interface InvoiceCardProps {
  invoiceNumber: string;
  description: string;
  issuedDateLabel: string;
  status: InvoiceStatus;
  totalLabel: string;
  paidLabel: string;
  remainingLabel: string;
  /** Caller-supplied action buttons — this component holds no business logic (Spec #8 §61, same convention as AppointmentCard/TreatmentPlanCard). */
  actions?: ReactNode;
  className?: string;
}

/** Reusable invoice presentation (Spec #9 Screen 25, UI-004D §17/§23) — takes only pre-resolved display strings/typed data, no mock-data coupling. */
export function InvoiceCard({
  invoiceNumber,
  description,
  issuedDateLabel,
  status,
  totalLabel,
  paidLabel,
  remainingLabel,
  actions,
  className,
}: InvoiceCardProps) {
  const { t } = useLocale();
  const statusMeta = INVOICE_STATUS_MAP[status];

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text" dir="ltr">
              {invoiceNumber}
            </h3>
            <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-text">{description}</p>
          <p className="text-sm text-text-muted" dir="ltr">
            {issuedDateLabel}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.invoices.totalRowLabel")}
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-text" dir="ltr">
            {totalLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.invoices.paidLabel")}
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-text" dir="ltr">
            {paidLabel}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.invoices.remainingRowLabel")}
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-text" dir="ltr">
            {remainingLabel}
          </dd>
        </div>
      </dl>

      {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
    </Card>
  );
}

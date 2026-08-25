"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { InvoiceFilterGroup } from "@/features/patients/finance";

const FILTER_ORDER: InvoiceFilterGroup[] = ["all", "due", "paid", "overdue"];

export interface PatientInvoiceFiltersProps {
  active: InvoiceFilterGroup;
  onChange: (group: InvoiceFilterGroup) => void;
  resultCount: number;
}

/** Lightweight status-group filter (UI-004D §38-39) — mirrors the segmented toggle style already used by Agenda's Day/Week switch and the Rendez-vous tab's own filters. */
export function PatientInvoiceFilters({ active, onChange, resultCount }: PatientInvoiceFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
        role="group"
        aria-label={t("patientDetail.tabs.invoices")}
      >
        {FILTER_ORDER.map((group) => (
          <Button
            key={group}
            type="button"
            variant={active === group ? "primary" : "ghost"}
            size="sm"
            aria-pressed={active === group}
            onClick={() => onChange(group)}
          >
            {t(`patientDetail.invoices.filters.${group}`)}
          </Button>
        ))}
      </div>
      <p className="text-sm text-text-muted" aria-live="polite">
        {t("patientDetail.invoices.resultCount", { count: resultCount })}
      </p>
    </div>
  );
}

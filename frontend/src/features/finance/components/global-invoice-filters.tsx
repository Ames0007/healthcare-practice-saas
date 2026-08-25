"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GlobalInvoiceFilterGroup } from "@/features/finance/types";

const FILTER_ORDER: GlobalInvoiceFilterGroup[] = ["all", "toPay", "partial", "paid", "overdue"];

export interface GlobalInvoiceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: GlobalInvoiceFilterGroup;
  onFilterChange: (group: GlobalInvoiceFilterGroup) => void;
  resultCount: number;
}

/**
 * Search (patient name/number, invoice number — UI-006B §12) plus the
 * bounded five-value status filter (§13-14), composing together locally
 * (§15) with a live result count (§16). Mirrors `PatientsFilters`'
 * search-input pattern and `PatientInvoiceFilters`'/`DocumentsSection`'s
 * button-group filter pattern exactly — no new primitives introduced.
 */
export function GlobalInvoiceFilters({ search, onSearchChange, filter, onFilterChange, resultCount }: GlobalInvoiceFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label={t("finance.invoices.searchLabel")}
          placeholder={t("finance.invoices.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="ps-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
          role="group"
          aria-label={t("finance.invoices.pageTitle")}
        >
          {FILTER_ORDER.map((group) => (
            <Button
              key={group}
              type="button"
              variant={filter === group ? "primary" : "ghost"}
              size="sm"
              aria-pressed={filter === group}
              onClick={() => onFilterChange(group)}
            >
              {t(`finance.invoices.filters.${group}`)}
            </Button>
          ))}
        </div>
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("finance.invoices.resultCount", { count: resultCount })}
        </p>
      </div>
    </div>
  );
}

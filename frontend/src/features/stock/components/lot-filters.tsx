"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { LotExpiryStatus } from "@/components/domain/stock/types";
import { LOT_EXPIRY_STATUS_MAP, LOT_EXPIRY_STATUS_ORDER } from "@/components/domain/stock/expiry-status";

export type LotExpiryFilter = LotExpiryStatus | "all";

export interface LotFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  expiryFilter: LotExpiryFilter;
  onExpiryFilterChange: (value: LotExpiryFilter) => void;
  resultCount: number;
}

/** Search (lot number/article name) plus the bounded expiry-status filter — mirrors `ItemFilters`'s exact layout. */
export function LotFilters({ search, onSearchChange, expiryFilter, onExpiryFilterChange, resultCount }: LotFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input
          type="search"
          aria-label={t("stock.lots.searchLabel")}
          placeholder={t("stock.lots.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="ps-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          aria-label={t("stock.lots.statusFilterLabel")}
          value={expiryFilter}
          onChange={(event) => onExpiryFilterChange(event.target.value as LotExpiryFilter)}
          options={[
            { value: "all", label: t("stock.lots.statusFilterPlaceholder") },
            ...LOT_EXPIRY_STATUS_ORDER.map((status) => ({ value: status, label: t(LOT_EXPIRY_STATUS_MAP[status].translationKey) })),
          ]}
        />
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("stock.lots.resultCount", { count: resultCount })}
        </p>
      </div>
    </div>
  );
}

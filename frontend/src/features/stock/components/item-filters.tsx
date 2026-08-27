"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InventoryCategory, StockAttentionStatus } from "@/components/domain/stock/types";
import { INVENTORY_CATEGORY_MAP, INVENTORY_CATEGORY_ORDER } from "@/components/domain/stock/category";
import { STOCK_ATTENTION_STATUS_MAP, STOCK_ATTENTION_STATUS_ORDER } from "@/components/domain/stock/attention-status";

export type ItemCategoryFilter = InventoryCategory | "all";
export type ItemAttentionFilter = StockAttentionStatus | "all";

export interface ItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: ItemCategoryFilter;
  onCategoryFilterChange: (value: ItemCategoryFilter) => void;
  attentionFilter: ItemAttentionFilter;
  onAttentionFilterChange: (value: ItemAttentionFilter) => void;
  resultCount: number;
}

/** Search (name/reference) plus the two bounded filters (UI-008ABCD §23-24) — mirrors `GlobalInvoiceFilters`'s search-input pattern, using `Select` dropdowns since ten categories would not fit a button group. */
export function ItemFilters({ search, onSearchChange, categoryFilter, onCategoryFilterChange, attentionFilter, onAttentionFilterChange, resultCount }: ItemFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input
          type="search"
          aria-label={t("stock.items.searchLabel")}
          placeholder={t("stock.items.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="ps-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label={t("stock.items.categoryFilterLabel")}
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value as ItemCategoryFilter)}
            options={[
              { value: "all", label: t("stock.items.categoryFilterPlaceholder") },
              ...INVENTORY_CATEGORY_ORDER.map((category) => ({ value: category, label: t(INVENTORY_CATEGORY_MAP[category].translationKey) })),
            ]}
          />
          <Select
            aria-label={t("stock.items.statusFilterLabel")}
            value={attentionFilter}
            onChange={(event) => onAttentionFilterChange(event.target.value as ItemAttentionFilter)}
            options={[
              { value: "all", label: t("stock.items.statusFilterPlaceholder") },
              ...STOCK_ATTENTION_STATUS_ORDER.map((status) => ({ value: status, label: t(STOCK_ATTENTION_STATUS_MAP[status].translationKey) })),
            ]}
          />
        </div>
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("stock.items.resultCount", { count: resultCount })}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { InventoryItem, StockMovement } from "@/components/domain/stock/types";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { buildItemRows } from "./items";
import { buildInitialItemFormValues, buildItemFromFormValues, generateNextItemNumber, matchesItemAttentionFilter, matchesItemCategoryFilter, matchesItemSearch } from "./stock";
import { StockNav } from "./components/stock-nav";
import { ItemFilters, type ItemAttentionFilter, type ItemCategoryFilter } from "./components/item-filters";
import { ItemTable } from "./components/item-table";
import { ItemCardList } from "./components/item-card-list";
import { ItemFormDialog } from "./components/item-form-dialog";

export type ItemsPageState = "loading" | "loaded" | "error";

export interface ItemsPageProps {
  /** Prototype seams (mirrors Finance/Team), swap for real query results later. */
  items?: InventoryItem[];
  movements?: StockMovement[];
  state?: ItemsPageState;
  onRetry?: () => void;
}

/**
 * Articles catalog (UI-008ABCD Gate 1, `/app/stock/items`) — replaces the
 * generic Stock placeholder. Every balance/attention status is derived
 * live from `movements` (never stored — see the balance-discipline note
 * in `components/domain/stock/types.ts`). This screen only creates new
 * articles; editing an existing one lives on the item's own detail page
 * (Aperçu tab), mirroring how Team's own edit actions live on the detail
 * screen rather than the list. Adding an article updates only this
 * page's own local state — no shared store yet, same documented
 * prototype limitation as every other UI in this product.
 */
export function ItemsPage({ items: providedItems, movements: providedMovements, state = "loaded", onRetry }: ItemsPageProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ItemCategoryFilter>("all");
  const [attentionFilter, setAttentionFilter] = useState<ItemAttentionFilter>("all");
  const [overrideItems, setOverrideItems] = useState<InventoryItem[] | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.items.pageTitle")} description={t("stock.items.pageDescription")} />
        <StockNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("stock.items.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("stock.items.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedItems = providedItems ?? getInventoryItemsMockData();
  const items = overrideItems ?? seedItems;
  const movements = providedMovements ?? getStockMovementsMockData();

  function handleAddSubmit(values: Parameters<typeof buildItemFromFormValues>[0]) {
    const created = buildItemFromFormValues(values, undefined, generateNextItemNumber(items));
    setOverrideItems([...items, created]);
    setIsAddDialogOpen(false);
  }

  const addButton = (
    <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
      {t("stock.items.addButton")}
    </Button>
  );

  const addDialog = (
    <ItemFormDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddSubmit} initialValues={buildInitialItemFormValues()} />
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.items.pageTitle")} description={t("stock.items.pageDescription")} primaryAction={addButton} />
        <StockNav />
        <EmptyState title={t("stock.items.emptyAllTitle")} description={t("stock.items.emptyAllDescription")} />
        {addDialog}
      </div>
    );
  }

  const allRows = buildItemRows(items, movements);
  const searched = allRows.filter((row) => matchesItemSearch(row.item, search));
  const categoryFiltered = searched.filter((row) => matchesItemCategoryFilter(row.item, categoryFilter));
  const rows = categoryFiltered.filter((row) => matchesItemAttentionFilter(row.attentionStatus, attentionFilter));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("stock.items.pageTitle")} description={t("stock.items.pageDescription")} primaryAction={addButton} />

      <StockNav />

      <ItemFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        attentionFilter={attentionFilter}
        onAttentionFilterChange={setAttentionFilter}
        resultCount={rows.length}
      />

      {rows.length === 0 ? (
        search.trim() !== "" ? (
          <EmptyState
            title={t("stock.items.searchEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                {t("stock.items.clearSearch")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t("stock.items.filteredEmptyTitle")}
            primaryAction={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCategoryFilter("all");
                  setAttentionFilter("all");
                }}
              >
                {t("stock.items.clearFilters")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <ItemTable rows={rows} />
          <ItemCardList rows={rows} />
        </>
      )}

      {addDialog}
    </div>
  );
}

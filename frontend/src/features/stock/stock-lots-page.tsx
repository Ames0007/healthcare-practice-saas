"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { buildCabinetLotRows, matchesLotExpiryFilter, matchesLotSearch } from "./lots";
import { StockNav } from "./components/stock-nav";
import { LotFilters, type LotExpiryFilter } from "./components/lot-filters";
import { StockLotsTable } from "./components/stock-lots-table";

export type StockLotsPageState = "loading" | "loaded" | "error";

export interface StockLotsPageProps {
  /** Prototype seams, swap for real query results later. */
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  businessDate?: string;
  state?: StockLotsPageState;
  onRetry?: () => void;
}

/**
 * Lots & Expirations cabinet workspace (UI-008ABCD Gate 2, `/app/stock/lots`)
 * — every lot across every item, worst-expiry-first. Read-only: lots are
 * created through Stock IN (Gate 3), never a standalone "add lot" form
 * here (§8-9 scope Gate 2 to browsing/derivation only).
 */
export function StockLotsPage({ items: providedItems, lots: providedLots, movements: providedMovements, businessDate = MOCK_BUSINESS_DATE, state = "loaded", onRetry }: StockLotsPageProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<LotExpiryFilter>("all");

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.lots.pageTitle")} description={t("stock.lots.pageDescription")} />
        <StockNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("stock.lots.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("stock.lots.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = providedItems ?? getInventoryItemsMockData();
  const lots = providedLots ?? getInventoryLotsMockData();
  const movements = providedMovements ?? getStockMovementsMockData();

  if (lots.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.lots.pageTitle")} description={t("stock.lots.pageDescription")} />
        <StockNav />
        <EmptyState title={t("stock.lots.emptyAllTitle")} description={t("stock.lots.emptyAllDescription")} />
      </div>
    );
  }

  const allRows = buildCabinetLotRows(items, lots, movements, businessDate);
  const searched = allRows.filter((row) => matchesLotSearch(row, search));
  const rows = searched.filter((row) => matchesLotExpiryFilter(row, expiryFilter));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("stock.lots.pageTitle")} description={t("stock.lots.pageDescription")} />

      <StockNav />

      <LotFilters search={search} onSearchChange={setSearch} expiryFilter={expiryFilter} onExpiryFilterChange={setExpiryFilter} resultCount={rows.length} />

      {rows.length === 0 ? (
        search.trim() !== "" ? (
          <EmptyState
            title={t("stock.lots.searchEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                {t("stock.lots.clearSearch")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t("stock.lots.filteredEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setExpiryFilter("all")}>
                {t("stock.lots.clearFilters")}
              </Button>
            }
          />
        )
      ) : (
        <StockLotsTable rows={rows} />
      )}
    </div>
  );
}

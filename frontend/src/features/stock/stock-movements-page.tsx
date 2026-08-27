"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { sortItemsByName } from "./stock";
import { StockNav } from "./components/stock-nav";
import { ItemMovementsContent } from "./components/item-movements-content";

export type StockMovementsPageState = "loading" | "loaded" | "error";

export interface StockMovementsPageProps {
  /** Prototype seams, swap for real query results later. */
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  state?: StockMovementsPageState;
  onRetry?: () => void;
}

/**
 * Stock Movements cabinet workspace (UI-008ABCD Gate 3, `/app/stock/movements`)
 * — every movement is scoped to one article, so this workspace starts
 * with an article selector rather than one global feed, then reuses the
 * exact same history/action surface as the item's own Mouvements tab
 * (`ItemMovementsContent`) — no duplicate movement-table implementation.
 */
export function StockMovementsPage({ items: providedItems, lots: providedLots, movements: providedMovements, state = "loaded", onRetry }: StockMovementsPageProps) {
  const { t } = useLocale();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [overrideLots, setOverrideLots] = useState<InventoryLot[] | null>(null);
  const [overrideMovements, setOverrideMovements] = useState<StockMovement[] | null>(null);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.movements.pageTitle")} description={t("stock.movements.pageDescription")} />
        <StockNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("stock.movements.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("stock.movements.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = providedItems ?? getInventoryItemsMockData();
  const lots = overrideLots ?? providedLots ?? getInventoryLotsMockData();
  const movements = overrideMovements ?? providedMovements ?? getStockMovementsMockData();
  const sortedItems = sortItemsByName(items);
  const selectedItem = sortedItems.find((item) => item.id === selectedItemId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("stock.movements.pageTitle")} description={t("stock.movements.pageDescription")} />

      <StockNav />

      <Select
        label={t("stock.movements.itemSelectLabel")}
        value={selectedItemId}
        onChange={(event) => setSelectedItemId(event.target.value)}
        placeholder={t("stock.movements.itemSelectPlaceholder")}
        options={sortedItems.map((item) => ({ value: item.id, label: `${item.name} (${item.itemNumber})` }))}
      />

      {selectedItem ? (
        <>
          <Link href={`/app/stock/items/${selectedItem.id}`} className="w-fit text-sm font-medium text-primary hover:underline">
            {t("stock.movements.viewItemLink")}
          </Link>
          <ItemMovementsContent item={selectedItem} lots={lots} movements={movements} onMovementsChange={setOverrideMovements} onLotsChange={setOverrideLots} />
        </>
      ) : (
        <EmptyState title={t("stock.movements.noSelectionTitle")} description={t("stock.movements.noSelectionDescription")} />
      )}
    </div>
  );
}

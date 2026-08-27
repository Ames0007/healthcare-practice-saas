"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { computeItemStockBalance, resolveStockAttentionStatus } from "./stock";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { ItemHeader } from "./components/item-header";
import { ItemNav, type ItemTabKey } from "./components/item-nav";
import { ItemOverviewContent } from "./components/item-overview-content";
import { ItemLotsContent } from "./components/item-lots-content";
import { ItemMovementsContent } from "./components/item-movements-content";

export type ItemDetailState = "loading" | "loaded" | "error";

export interface ItemDetailPageProps {
  itemId: string;
  activeTab?: ItemTabKey;
  state?: ItemDetailState;
  /** Prototype seams for tests, mirrors `TeamMemberDetailPage` (UI-007B §11). */
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  /** Seam so a real business day can be exercised in tests (mirrors UI-007CDEF's own `businessDate` seam). */
  businessDate?: string;
  onRetry?: () => void;
}

/**
 * Item 360° (UI-008ABCD §25, mirrors `TeamMemberDetailPage`'s exact
 * header-then-tabs-then-switched-content architecture). Balance/attention
 * status are derived live from `movements` (never stored, see the
 * balance-discipline note in `components/domain/stock/types.ts`). Editing
 * here updates only this page's own local state — the same documented
 * prototype limitation as every other detail screen in this product (no
 * shared store yet).
 */
export function ItemDetailPage({
  itemId,
  activeTab = "overview",
  state = "loaded",
  items: providedItems,
  lots: providedLots,
  movements: providedMovements,
  businessDate = MOCK_BUSINESS_DATE,
  onRetry,
}: ItemDetailPageProps) {
  const { t } = useLocale();
  const [overrideItem, setOverrideItem] = useState<InventoryItem | null>(null);
  const [overrideLots, setOverrideLots] = useState<InventoryLot[] | null>(null);
  const [overrideMovements, setOverrideMovements] = useState<StockMovement[] | null>(null);

  if (state === "loading") {
    return <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("stock.itemDetail.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("stock.itemDetail.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = providedItems ?? getInventoryItemsMockData();
  const seedItem = items.find((candidate) => candidate.id === itemId) ?? null;
  const item = overrideItem ?? seedItem;

  if (!item) {
    return (
      <EmptyState
        title={t("stock.itemDetail.notFoundTitle")}
        description={t("stock.itemDetail.notFoundDescription")}
        primaryAction={
          <Link href="/app/stock/items" className={buttonClassNames("primary", "sm")}>
            {t("stock.itemDetail.backToItems")}
          </Link>
        }
      />
    );
  }

  const movements = overrideMovements ?? providedMovements ?? getStockMovementsMockData();
  const lots = overrideLots ?? providedLots ?? getInventoryLotsMockData();
  const balance = computeItemStockBalance(movements, item.id);
  const attentionStatus = resolveStockAttentionStatus(balance, item.stockPolicy);

  return (
    <div className="flex flex-col gap-6">
      <ItemHeader item={item} balance={balance} attentionStatus={attentionStatus} />
      <ItemNav itemId={itemId} activeTab={activeTab} showLots={item.lotTracking} />

      {activeTab === "overview" ? (
        <ItemOverviewContent item={item} balance={balance} onItemChange={setOverrideItem} />
      ) : activeTab === "lots" ? (
        <ItemLotsContent itemId={item.id} unitLabel={t(STOCK_UNIT_MAP[item.unit].translationKey)} lots={lots} movements={movements} businessDate={businessDate} />
      ) : activeTab === "movements" ? (
        <ItemMovementsContent item={item} lots={lots} movements={movements} onMovementsChange={setOverrideMovements} onLotsChange={setOverrideLots} />
      ) : null}
    </div>
  );
}

"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { computeStockKpis, getAttentionItems, getExpiryAttentionForDashboard } from "./dashboard";
import { StockNav } from "./components/stock-nav";
import { StockKpiSummary } from "./components/stock-kpi-summary";
import { AttentionItemsSection } from "./components/attention-items-section";
import { ExpiryAttentionSection } from "./components/expiry-attention-section";

export type StockDashboardState = "loading" | "loaded" | "error";

export interface StockDashboardProps {
  /** Prototype seams, swap for real query results later. */
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  businessDate?: string;
  state?: StockDashboardState;
  onRetry?: () => void;
}

/**
 * Pharmacie & Stock dashboard (UI-008ABCD Gate 4, `/app/stock`) — the
 * cabinet-wide inventory command center: the three Spec #2 §42.5 KPIs
 * plus attention lists for stock and expiry, both derived live from the
 * same fixtures/pure functions every other Stock screen already uses
 * (never an independently hardcoded figure).
 */
export function StockDashboard({ items: providedItems, lots: providedLots, movements: providedMovements, businessDate = MOCK_BUSINESS_DATE, state = "loaded", onRetry }: StockDashboardProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("stock.pageTitle")} />
        <StockNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("stock.dashboard.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("stock.dashboard.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = providedItems ?? getInventoryItemsMockData();
  const lots = providedLots ?? getInventoryLotsMockData();
  const movements = providedMovements ?? getStockMovementsMockData();

  const kpis = computeStockKpis(items, lots, movements, businessDate);
  const attentionItems = getAttentionItems(items, movements);
  const expiryAttention = getExpiryAttentionForDashboard(items, lots, movements, businessDate);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("stock.pageTitle")} description={t("stock.dashboard.pageDescription")} />

      <StockNav />

      <StockKpiSummary kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttentionItemsSection rows={attentionItems} />
        <ExpiryAttentionSection rows={expiryAttention} />
      </div>
    </div>
  );
}

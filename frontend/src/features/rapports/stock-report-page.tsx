"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { getInventoryItemsMockData } from "@/features/stock/mock-items-data";
import { getInventoryLotsMockData } from "@/features/stock/mock-lots-data";
import { getStockMovementsMockData } from "@/features/stock/mock-movements-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { ReportsNav } from "./components/reports-nav";
import { ReportsSkeleton } from "./components/reports-skeleton";
import { StockReportKpiSummary } from "./components/stock-report-kpi-summary";
import { computeStockReportKpis } from "./stock-report";

export type StockReportPageState = "loading" | "loaded" | "error";

export interface StockReportPageProps {
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  state?: StockReportPageState;
  onRetry?: () => void;
}

/**
 * Reports — Stock (UI-010ABC Gate 1), `/app/rapports/stock`. Reuses the
 * exact rows Stock's own dashboard reads (`buildItemRows`,
 * `getExpiryAttentionLots`) — never a second balance/attention derivation.
 * No period selector: every figure here is current-state (out-of-stock/
 * low-stock/expiring), not period activity — the same "not period-scoped"
 * precedent as Finance's own receivable/overdue (showing a selector that
 * changes nothing would be misleading, not merely decorative). Detail
 * rows/actions (adjust stock, view lots) already have a real home at
 * `/app/stock` — this page links out rather than duplicating that UI.
 */
export function StockReportPage({
  items: providedItems,
  lots: providedLots,
  movements: providedMovements,
  state = "loaded",
  onRetry,
}: StockReportPageProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return <ReportsSkeleton metricCount={3} />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("rapports.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("rapports.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const items = providedItems ?? getInventoryItemsMockData();
  const lots = providedLots ?? getInventoryLotsMockData();
  const movements = providedMovements ?? getStockMovementsMockData();

  const kpis = computeStockReportKpis(items, lots, movements, MOCK_BUSINESS_DATE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("rapports.stock.pageTitle")} description={t("rapports.stock.pageDescription")} />

      <ReportsNav />

      <div className="flex flex-col gap-6">
        <StockReportKpiSummary kpis={kpis} />

        <Link href="/app/stock" className={buttonClassNames("outline", "sm", "self-start")}>
          {t("rapports.stock.viewStockAction")}
        </Link>
      </div>
    </div>
  );
}

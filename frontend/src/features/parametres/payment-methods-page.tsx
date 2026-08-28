"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PaymentMethodRow } from "@/components/domain/settings/types";
import { getPaymentMethodRows } from "./mock-payment-methods-data";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type PaymentMethodsPageState = "loading" | "loaded" | "error";

export interface PaymentMethodsPageProps {
  rows?: PaymentMethodRow[];
  state?: PaymentMethodsPageState;
  onRetry?: () => void;
}

/**
 * Paiements (UI-010BC Gate 2), `/app/parametres/paiements` — read-only, per
 * `PaymentMethodRow`'s own doc comment: Finance can only ever process
 * `"cash"` in this prototype (CLAUDE.md §23), so an editable multi-method
 * toggle list would advertise capability that does not exist.
 */
export function PaymentMethodsPage({ rows: providedRows, state = "loaded", onRetry }: PaymentMethodsPageProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return <SettingsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("parametres.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("parametres.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const rows = providedRows ?? getPaymentMethodRows();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("parametres.paiements.pageTitle")} description={t("parametres.paiements.pageDescription")} />

      <ParametresNav />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("parametres.paiements.table.method")}</th>
              <th className="px-4 py-3 font-medium">{t("parametres.paiements.table.active")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.method} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-text">{t(row.labelKey)}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={row.active ? "success" : "neutral"}>
                    {t(row.active ? "parametres.services.activeYes" : "parametres.services.activeNo")}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-text-muted">{t("parametres.paiements.readOnlyNote")}</p>
    </div>
  );
}

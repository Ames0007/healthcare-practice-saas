"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SUBSCRIPTION_STATUS_MAP } from "@/components/domain/subscription/subscription-status";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getSubscriptionPlansMockData } from "@/features/subscription/mock-plans-data";
import { buildSubscriptionDirectoryRows } from "./subscriptions";

/**
 * Platform subscription directory (UI-013ABCDE Gate 3 §17/§18). Subscription
 * *detail* (task §19) and *actions* (task §20) live on Tenant 360° — Spec
 * #4 §55.2's own note that tenant detail exposes subscription/operational
 * metadata, and task §9's "do not invent unnecessarily deep routing" (no
 * `/admin/subscriptions/[id]` route is listed there) — so this list's own
 * row action navigates straight to `/admin/tenants/[id]` rather than a
 * second, parallel detail surface.
 */
export function SubscriptionsPage() {
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const rows = useMemo(() => {
    const subscriptions = getPlatformSubscriptionsMockData();
    const tenants = getTenantsMockData();
    const plans = getSubscriptionPlansMockData();
    return buildSubscriptionDirectoryRows(subscriptions, tenants, plans);
  }, []);

  const filteredRows = rows.filter((row) => {
    const matchesStatus = statusFilter.length === 0 || row.status === statusFilter;
    const matchesPlan = planFilter.length === 0 || row.planCode === planFilter;
    return matchesStatus && matchesPlan;
  });

  const statusOptions = (Object.keys(SUBSCRIPTION_STATUS_MAP) as Array<keyof typeof SUBSCRIPTION_STATUS_MAP>).map((status) => ({
    value: status,
    label: t(SUBSCRIPTION_STATUS_MAP[status].translationKey),
  }));
  const planOptions = [
    { value: "solo", label: "Solo" },
    { value: "cabinet", label: "Cabinet" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.subscriptions.pageTitle")} description={t("admin.subscriptions.pageDescription")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={t("admin.subscriptions.filters.status")}
          placeholder={t("admin.subscriptions.filters.allStatuses")}
          options={statusOptions}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Select
          label={t("admin.subscriptions.filters.plan")}
          placeholder={t("admin.subscriptions.filters.allPlans")}
          options={planOptions}
          value={planFilter}
          onChange={(event) => setPlanFilter(event.target.value)}
        />
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState title={t("admin.subscriptions.empty.title")} description={t("admin.subscriptions.empty.description")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">{t("admin.subscriptions.table.tenant")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.subscriptions.table.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.subscriptions.table.status")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.subscriptions.table.currentPeriodEnd")}</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">{t("admin.subscriptions.table.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const statusMeta = SUBSCRIPTION_STATUS_MAP[row.status];
                return (
                  <tr key={row.subscriptionId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text">{row.tenantName}</td>
                    <td className="px-4 py-3 text-text-secondary">{row.planName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.currentPeriodEnd ?? "—"}</td>
                    <td className="px-4 py-3 text-end">
                      <Link href={`/admin/tenants/${row.tenantId}`} className="text-sm font-medium text-primary hover:underline">
                        {t("admin.subscriptions.table.viewAction")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

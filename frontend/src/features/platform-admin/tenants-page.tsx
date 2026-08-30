"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SUBSCRIPTION_STATUS_MAP } from "@/components/domain/subscription/subscription-status";
import { TENANT_STATUS_MAP } from "@/components/domain/platform-admin/tenant-status";
import { CABINET_SPECIALTY_MAP } from "@/components/domain/settings/specialty";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getPlatformMembershipsMockData, getPlatformUsersMockData } from "./mock-platform-users-data";
import { getSubscriptionPlansMockData } from "@/features/subscription/mock-plans-data";
import { buildTenantDirectoryRows, EMPTY_TENANT_FILTERS, filterTenantDirectoryRows, type TenantDirectoryFilters } from "./tenants";

/**
 * SaaS tenant directory (UI-013ABCDE Gate 2 §12/§13, wireframe Screen 55).
 * Row shape/columns reproduce Screen 55's own worked example (`Cabinet /
 * Owner / Specialty / Plan / Status / Renewal`) plus the task's own "Users"
 * column (Spec #2 §55.2). Every row comes from `buildTenantDirectoryRows`
 * — no ad hoc join is ever performed inside this component.
 */
export function TenantsPage() {
  const { t } = useLocale();
  const [filters, setFilters] = useState<TenantDirectoryFilters>(EMPTY_TENANT_FILTERS);

  const rows = useMemo(() => {
    const tenants = getTenantsMockData();
    const subscriptions = getPlatformSubscriptionsMockData();
    const plans = getSubscriptionPlansMockData();
    const memberships = getPlatformMembershipsMockData();
    const users = getPlatformUsersMockData();
    return buildTenantDirectoryRows(tenants, subscriptions, plans, memberships, users);
  }, []);

  const filteredRows = useMemo(() => filterTenantDirectoryRows(rows, filters), [rows, filters]);

  const planOptions = [
    { value: "solo", label: "Solo" },
    { value: "cabinet", label: "Cabinet" },
  ];
  const statusOptions = (Object.keys(TENANT_STATUS_MAP) as Array<keyof typeof TENANT_STATUS_MAP>).map((status) => ({
    value: status,
    label: t(TENANT_STATUS_MAP[status].translationKey),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.tenants.pageTitle")} description={t("admin.tenants.pageDescription")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label={t("admin.tenants.filters.search")}
          placeholder={t("admin.tenants.filters.searchPlaceholder")}
          value={filters.query}
          onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
        />
        <Select
          label={t("admin.tenants.filters.plan")}
          placeholder={t("admin.tenants.filters.allPlans")}
          options={planOptions}
          value={filters.planCode}
          onChange={(event) => setFilters((current) => ({ ...current, planCode: event.target.value }))}
        />
        <Select
          label={t("admin.tenants.filters.status")}
          placeholder={t("admin.tenants.filters.allStatuses")}
          options={statusOptions}
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        />
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState title={t("admin.tenants.empty.title")} description={t("admin.tenants.empty.description")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.cabinet")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.owner")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.specialty")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.subscriptionStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.tenantStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.tenants.table.users")}</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">{t("admin.tenants.table.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const subscriptionMeta = row.subscriptionStatus ? SUBSCRIPTION_STATUS_MAP[row.subscriptionStatus] : null;
                const tenantMeta = TENANT_STATUS_MAP[row.tenantStatus];
                return (
                  <tr key={row.tenantId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text">{row.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{row.ownerName ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{t(CABINET_SPECIALTY_MAP[row.specialty].translationKey)}</td>
                    <td className="px-4 py-3 text-text-secondary">{row.planName ?? "—"}</td>
                    <td className="px-4 py-3">
                      {subscriptionMeta ? (
                        <StatusBadge tone={subscriptionMeta.tone}>{t(subscriptionMeta.translationKey)}</StatusBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={tenantMeta.tone}>{t(tenantMeta.translationKey)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.userCount}</td>
                    <td className="px-4 py-3 text-end">
                      <Link href={`/admin/tenants/${row.tenantId}`} className="text-sm font-medium text-primary hover:underline">
                        {t("admin.tenants.table.viewAction")}
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

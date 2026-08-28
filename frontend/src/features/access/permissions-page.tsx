"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PermissionDefinition } from "@/components/domain/access/types";
import { PERMISSION_DOMAIN_ORDER, getPermissionsByDomain } from "@/components/domain/access/permission-catalog";
import { PERMISSION_SENSITIVITY_MAP } from "@/components/domain/access/permission-sensitivity";
import { AccessGovernanceNav } from "./components/access-governance-nav";
import { AccessSkeleton } from "./components/access-skeleton";

export type PermissionsPageState = "loading" | "loaded" | "error";

export interface PermissionsPageProps {
  permissions?: PermissionDefinition[];
  state?: PermissionsPageState;
  onRetry?: () => void;
}

/**
 * Permissions (UI-011X Gate 1), `/app/parametres/access/permissions` —
 * the read-only catalog reference (key/label/sensitivity/delegatable),
 * grouped by domain (task §8). Editing which permissions a role holds
 * happens on the Rôles page, not here — this page answers "what
 * capabilities exist at all," Rôles answers "who has which."
 */
export function PermissionsPage({ permissions: providedPermissions, state = "loaded", onRetry }: PermissionsPageProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return <AccessSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("access.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("access.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const domains = PERMISSION_DOMAIN_ORDER.map((domain) => ({
    domain,
    permissions: providedPermissions
      ? providedPermissions.filter((permission) => permission.domain === domain)
      : getPermissionsByDomain(domain),
  })).filter((group) => group.permissions.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("access.permissions.pageTitle")} description={t("access.permissions.pageDescription")} />

      <AccessGovernanceNav />

      {domains.map(({ domain, permissions }) => (
        <Card key={domain} className="overflow-x-auto p-0">
          <h2 className="px-4 pt-4 text-sm font-semibold text-text">{t(`access.domain.${domain}`)}</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">{t("access.permissions.table.permission")}</th>
                <th className="px-4 py-3 font-medium">{t("access.permissions.table.sensitivity")}</th>
                <th className="px-4 py-3 font-medium">{t("access.permissions.table.delegatable")}</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => {
                const sensitivityMeta = PERMISSION_SENSITIVITY_MAP[permission.sensitivity];
                return (
                  <tr key={permission.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text">{t(permission.labelKey)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={sensitivityMeta.tone}>{t(sensitivityMeta.translationKey)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {t(permission.delegatable ? "access.permissions.delegatableYes" : "access.permissions.delegatableNo")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ))}

      <p className="text-xs text-text-muted">{t("access.permissions.footnote")}</p>
    </div>
  );
}

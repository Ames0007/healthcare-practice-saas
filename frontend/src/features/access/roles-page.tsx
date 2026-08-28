"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import type { AccessRole } from "@/components/domain/access/types";
import { PERMISSION_DOMAIN_ORDER, getPermissionsByDomain } from "@/components/domain/access/permission-catalog";
import { getAccessRolesMockData } from "./mock-roles-data";
import { roleHasPermission, toggleRolePermission } from "./roles";
import { AccessGovernanceNav } from "./components/access-governance-nav";
import { AccessSkeleton } from "./components/access-skeleton";

export type RolesPageState = "loading" | "loaded" | "error";

export interface RolesPageProps {
  roles?: AccessRole[];
  state?: RolesPageState;
  onRetry?: () => void;
}

/**
 * Rôles (UI-011X Gate 1), `/app/parametres/access/roles` — one
 * domain-grouped checkbox matrix per role (Spec #9 Screen 35's own
 * layout, task §10), stacked rather than a single 3-column table so
 * each role's own "Enregistrer" commits independently. All 3 roles are
 * `systemRole: true` (protected from a delete/rename affordance this
 * page never offers, task §11) but their permission membership stays
 * editable — that toggling is the entire point of Spec #2 §30's "Owner/
 * Admin sees a simple permission matrix."
 */
export function RolesPage({ roles: providedRoles, state = "loaded", onRetry }: RolesPageProps) {
  const { t } = useLocale();
  const [roles, setRoles] = useState<AccessRole[]>(() => providedRoles ?? getAccessRolesMockData());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  function handleToggle(roleId: string, permissionKey: string) {
    setRoles((current) => current.map((role) => (role.id === roleId ? toggleRolePermission(role, permissionKey) : role)));
  }

  function handleSave(role: AccessRole) {
    setToastMessage(t("access.roles.toast.saved", { role: t(role.nameKey) }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("access.roles.pageTitle")} description={t("access.roles.pageDescription")} />

      <AccessGovernanceNav />

      {roles.map((role) => (
        <Card key={role.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-text">{t(role.nameKey)}</h2>
              <p className="mt-1 text-sm text-text-muted">{t(role.descriptionKey)}</p>
            </div>
            {role.systemRole && <StatusBadge tone="neutral">{t("access.roles.systemRoleBadge")}</StatusBadge>}
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {PERMISSION_DOMAIN_ORDER.map((domain) => {
              const permissions = getPermissionsByDomain(domain);
              if (permissions.length === 0) return null;

              return (
                <div key={domain}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t(`access.domain.${domain}`)}</h3>
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {permissions.map((permission) => (
                      <label key={permission.key} className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          checked={roleHasPermission(role, permission.key)}
                          onChange={() => handleToggle(role.id, permission.key)}
                          className="h-4 w-4 rounded border-border-strong"
                        />
                        {t(permission.labelKey)}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <Button size="sm" onClick={() => handleSave(role)}>
              {t("access.roles.save")}
            </Button>
          </div>
        </Card>
      ))}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

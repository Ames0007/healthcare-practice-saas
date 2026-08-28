"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import type { AccessRole, Delegation, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { USER_ACCOUNT_STATUS_MAP } from "@/components/domain/access/user-account-status";
import { getUserAccountsMockData, getTenantMembershipsMockData } from "./mock-users-data";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { buildUserRows } from "./users";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { AccessGovernanceNav } from "./components/access-governance-nav";
import { AccessSkeleton } from "./components/access-skeleton";
import { UserAccessDrawer } from "./components/user-access-drawer";

export type UsersPageState = "loading" | "loaded" | "error";

export interface UsersPageProps {
  users?: UserAccount[];
  memberships?: TenantMembership[];
  roles?: AccessRole[];
  delegations?: Delegation[];
  businessDate?: string;
  state?: UsersPageState;
  onRetry?: () => void;
}

/**
 * Utilisateurs (UI-011X Gate 2), `/app/parametres/access` — the root of
 * the Accès & permissions module (task §5's own nav order names it
 * first, even though Rôles/Permissions were built in Gate 1). Reproduces
 * Spec #9 Screen 46's own column layout (Nom/Profil/Statut/Accès) plus
 * the task's own per-user grant/restriction/delegation counts (§14).
 */
export function UsersPage({
  users: providedUsers,
  memberships: providedMemberships,
  roles: providedRoles,
  delegations: providedDelegations,
  businessDate = MOCK_BUSINESS_DATE,
  state = "loaded",
  onRetry,
}: UsersPageProps) {
  const { t } = useLocale();
  const [memberships, setMemberships] = useState<TenantMembership[] | null>(null);
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
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

  const users = providedUsers ?? getUserAccountsMockData();
  const resolvedMemberships = memberships ?? providedMemberships ?? getTenantMembershipsMockData();
  const roles = providedRoles ?? getAccessRolesMockData();
  const delegations = providedDelegations ?? getDelegationsMockData();

  const rows = buildUserRows(users, resolvedMemberships, roles, businessDate, delegations);
  const managingUser = users.find((user) => user.id === managingUserId);
  const managingMembership = resolvedMemberships.find((membership) => membership.userId === managingUserId);

  function handleSave(updated: TenantMembership) {
    setMemberships((current) =>
      (current ?? resolvedMemberships).map((membership) => (membership.id === updated.id ? updated : membership)),
    );
    setManagingUserId(null);
    setToastMessage(t("access.users.toast.saved"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("access.users.pageTitle")} description={t("access.users.pageDescription")} />

      <AccessGovernanceNav />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("access.users.table.name")}</th>
              <th className="px-4 py-3 font-medium">{t("access.users.table.role")}</th>
              <th className="px-4 py-3 font-medium">{t("access.users.table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("access.users.table.access")}</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">{t("access.users.table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusMeta = USER_ACCOUNT_STATUS_MAP[row.status];
              return (
                <tr key={row.userId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{row.displayName}</p>
                    <p className="text-xs text-text-muted" dir="ltr">
                      {row.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text">{row.role ? t(row.role.nameKey) : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{t(row.accessSummaryLabelKey)}</td>
                  <td className="px-4 py-3 text-end">
                    <Button size="sm" variant="outline" onClick={() => setManagingUserId(row.userId)}>
                      {t("access.users.manageAction")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {managingUser && managingMembership && (
        <UserAccessDrawer
          key={managingUser.id}
          open
          onClose={() => setManagingUserId(null)}
          onSave={handleSave}
          user={managingUser}
          membership={managingMembership}
          roles={roles}
          businessDate={businessDate}
          delegations={delegations}
        />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

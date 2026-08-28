"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import type { AccessRole, Delegation, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { DELEGATION_STATUS_MAP } from "@/components/domain/access/delegation-status";
import { getPermissionDefinition } from "@/components/domain/access/permission-catalog";
import { getUserAccountsMockData, getTenantMembershipsMockData } from "./mock-users-data";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { resolveDelegationStatus } from "./delegation-lifecycle";
import { formatDayMonthYear } from "@/features/patients/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { ParametresNav } from "@/features/parametres/components/parametres-nav";
import { AccessGovernanceNav } from "./components/access-governance-nav";
import { AccessSkeleton } from "./components/access-skeleton";
import { CreateDelegationDialog } from "./components/create-delegation-dialog";

export type DelegationsPageState = "loading" | "loaded" | "error";

export interface DelegationsPageProps {
  delegations?: Delegation[];
  users?: UserAccount[];
  memberships?: TenantMembership[];
  roles?: AccessRole[];
  businessDate?: string;
  state?: DelegationsPageState;
  onRetry?: () => void;
}

function membershipLabel(membershipId: string, memberships: TenantMembership[], users: UserAccount[]): string {
  const membership = memberships.find((candidate) => candidate.id === membershipId);
  const user = users.find((candidate) => candidate.id === membership?.userId);
  return user?.displayName ?? membershipId;
}

/**
 * Délégations (UI-011X Gate 3), `/app/parametres/access/delegations` —
 * list + Create + revoke. Status is never stored directly on the row
 * being displayed — every badge is `resolveDelegationStatus`'s own live
 * derivation against `businessDate` (task §17), so a fixture never goes
 * stale relative to `MOCK_BUSINESS_DATE`. Revocation only ever sets
 * `revokedAt` — no delegation is ever deleted (mirrors CLAUDE.md §24's
 * "never silently edit/delete" discipline, applied to governance
 * records rather than financial ones).
 */
export function DelegationsPage({
  delegations: providedDelegations,
  users: providedUsers,
  memberships: providedMemberships,
  roles: providedRoles,
  businessDate = MOCK_BUSINESS_DATE,
  state = "loaded",
  onRetry,
}: DelegationsPageProps) {
  const { t, locale } = useLocale();
  const [overrideDelegations, setOverrideDelegations] = useState<Delegation[] | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
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
  const memberships = providedMemberships ?? getTenantMembershipsMockData();
  const roles = providedRoles ?? getAccessRolesMockData();
  const seedDelegations = providedDelegations ?? getDelegationsMockData();
  const delegations = overrideDelegations ?? seedDelegations;

  function handleCreate(delegation: Delegation) {
    setOverrideDelegations([...delegations, delegation]);
    setIsCreateOpen(false);
    setToastMessage(t("access.delegations.toast.created"));
  }

  function handleRevoke() {
    if (!revokingId) return;
    setOverrideDelegations(
      delegations.map((delegation) => (delegation.id === revokingId ? { ...delegation, revokedAt: businessDate } : delegation)),
    );
    setRevokingId(null);
    setToastMessage(t("access.delegations.toast.revoked"));
  }

  const revokingDelegation = delegations.find((delegation) => delegation.id === revokingId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("access.delegations.pageTitle")}
        description={t("access.delegations.pageDescription")}
        primaryAction={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            {t("access.delegations.addButton")}
          </Button>
        }
      />

      <ParametresNav />

      <AccessGovernanceNav />

      {delegations.length === 0 ? (
        <EmptyState title={t("access.delegations.emptyTitle")} description={t("access.delegations.emptyDescription")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">{t("access.delegations.table.from")}</th>
                <th className="px-4 py-3 font-medium">{t("access.delegations.table.to")}</th>
                <th className="px-4 py-3 font-medium">{t("access.delegations.table.permission")}</th>
                <th className="px-4 py-3 font-medium">{t("access.delegations.table.period")}</th>
                <th className="px-4 py-3 font-medium">{t("access.delegations.table.status")}</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">{t("access.delegations.table.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {delegations.map((delegation) => {
                const status = resolveDelegationStatus(delegation, businessDate);
                const statusMeta = DELEGATION_STATUS_MAP[status];
                const permission = getPermissionDefinition(delegation.permissionKey);
                const canRevoke = status === "scheduled" || status === "active";

                return (
                  <tr key={delegation.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">{membershipLabel(delegation.delegatorMembershipId, memberships, users)}</td>
                    <td className="px-4 py-3 text-text">{membershipLabel(delegation.delegateMembershipId, memberships, users)}</td>
                    <td className="px-4 py-3 text-text">{permission ? t(permission.labelKey) : delegation.permissionKey}</td>
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {formatDayMonthYear(delegation.startsAt, locale)} – {formatDayMonthYear(delegation.endsAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {canRevoke && (
                        <Button size="sm" variant="outline" onClick={() => setRevokingId(delegation.id)}>
                          {t("access.delegations.revokeAction")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <CreateDelegationDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        users={users}
        memberships={memberships}
        roles={roles}
        existingDelegations={delegations}
        businessDate={businessDate}
      />

      <ConfirmDialog
        open={revokingDelegation !== undefined}
        onClose={() => setRevokingId(null)}
        onConfirm={handleRevoke}
        title={t("access.delegations.revokeDialog.title")}
        description={t("access.delegations.revokeDialog.description")}
        cancelLabel={t("access.delegations.revokeDialog.cancel")}
        confirmLabel={t("access.delegations.revokeDialog.confirm")}
        tone="danger"
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

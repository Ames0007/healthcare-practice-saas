"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { USER_ACCOUNT_STATUS_MAP } from "@/components/domain/access/user-account-status";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformMembershipsMockData, getPlatformUsersMockData } from "./mock-platform-users-data";
import { applyUserAction, buildPlatformUserRows, type UserActionCode } from "./platform-users";
import { PlatformUserDrawer } from "./components/platform-user-drawer";

/**
 * Platform user directory (UI-013ABCDE Gate 4 §22/§23). No dedicated
 * wireframe/spec section names this screen (see `docs/implementation/
 * DECISIONS.md` for the recorded scope decision) — it is grounded instead
 * in Spec #4 §4.1/§4.2 `users`/`tenant_memberships` and the tenant
 * directory's own "Owner"/"Users" columns (Spec #2 §55.2). This is a
 * directory of the practice-side users the platform *observes* (owners/
 * practitioners/staff across every tenant) — never the SaaS operator's own
 * `platform_admin_users` login identity (task §6 defers that entirely).
 */
export function UsersPage() {
  const { t } = useLocale();
  const [users, setUsers] = useState(() => getPlatformUsersMockData());
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tenants = useMemo(() => getTenantsMockData(), []);
  const memberships = useMemo(() => getPlatformMembershipsMockData(), []);
  const rows = useMemo(() => buildPlatformUserRows(users, memberships, tenants), [users, memberships, tenants]);

  const managingRow = rows.find((row) => row.userId === managingUserId);

  function handleApplyAction(action: UserActionCode) {
    if (!managingUserId) return;
    setUsers((current) => current.map((user) => (user.id === managingUserId ? applyUserAction(user, action) : user)));
    setManagingUserId(null);
    setToastMessage(t("admin.users.toast.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("admin.users.pageTitle")} description={t("admin.users.pageDescription")} />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("admin.users.table.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.users.table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.users.table.tenants")}</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">{t("admin.users.table.actions")}</span>
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
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.memberships.length === 0 ? "—" : row.memberships.map((membership) => membership.tenantName).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button size="sm" variant="outline" onClick={() => setManagingUserId(row.userId)}>
                      {t("admin.users.manageAction")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {managingRow && (
        <PlatformUserDrawer
          key={managingRow.userId}
          open
          onClose={() => setManagingUserId(null)}
          row={managingRow}
          onApplyAction={handleApplyAction}
        />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

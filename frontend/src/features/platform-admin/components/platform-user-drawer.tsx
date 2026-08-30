"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { USER_ACCOUNT_STATUS_MAP } from "@/components/domain/access/user-account-status";
import type { PlatformUserRow } from "@/components/domain/platform-admin/types";
import { getAvailableUserActions, type UserActionCode } from "../platform-users";

export interface PlatformUserDrawerProps {
  open: boolean;
  onClose: () => void;
  row: PlatformUserRow;
  onApplyAction: (action: UserActionCode) => void;
}

/**
 * User detail (Gate 4 §24) — status, every tenant relationship (§23), and
 * bounded status actions (§25) behind a confirmation dialog, mirroring
 * `UserAccessDrawer`'s own established pattern
 * (`features/access/components/user-access-drawer.tsx`). No reason field
 * here (unlike Tenant 360's tenant/subscription actions) — this page has
 * no visible history surface to display one in (ADR-018 §3), so
 * collecting a reason nobody ever sees would be a discarded-audit-trail
 * code smell, not a real "controlled and audited" guarantee.
 */
export function PlatformUserDrawer({ open, onClose, row, onApplyAction }: PlatformUserDrawerProps) {
  const { t } = useLocale();
  const [pendingAction, setPendingAction] = useState<UserActionCode | null>(null);

  const statusMeta = USER_ACCOUNT_STATUS_MAP[row.status];
  const availableActions = getAvailableUserActions(row.status);

  function confirm() {
    if (!pendingAction) return;
    onApplyAction(pendingAction);
    setPendingAction(null);
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} variant="drawer" label={row.displayName} closeLabel={t("admin.users.drawer.close")}>
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-text">{row.displayName}</h2>
            <p className="text-sm text-text-muted" dir="ltr">
              {row.email}
            </p>
            <div className="mt-2">
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase text-text-muted">{t("admin.users.drawer.membershipsTitle")}</h3>
            {row.memberships.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">{t("admin.users.drawer.noMemberships")}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {row.memberships.map((membership) => (
                  <li key={membership.tenantId} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-text">{membership.tenantName}</p>
                    <p className="text-xs text-text-muted">
                      {t(`admin.users.profileType.${membership.profileType}`)}
                      {membership.isOwner && ` · ${t("admin.users.ownerBadge")}`}
                      {" · "}
                      {t(`admin.users.membershipStatus.${membership.status}`)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {availableActions.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              {availableActions.map((action) => (
                <Button
                  key={action}
                  variant={action === "user.disabled" ? "danger" : "primary"}
                  size="sm"
                  onClick={() => setPendingAction(action)}
                >
                  {t(`admin.users.actions.${action.replace(/\./g, "_")}`)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={confirm}
        title={pendingAction ? t(`admin.users.actions.${pendingAction.replace(/\./g, "_")}`) : ""}
        description={t("admin.users.actionPrompt")}
        cancelLabel={t("admin.users.actionCancel")}
        confirmLabel={t("admin.users.actionConfirm")}
        tone={pendingAction === "user.disabled" ? "danger" : "primary"}
      />
    </>
  );
}

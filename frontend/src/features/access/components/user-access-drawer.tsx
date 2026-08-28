"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AccessRole, Delegation, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { PERMISSION_DOMAIN_ORDER, getPermissionsByDomain } from "@/components/domain/access/permission-catalog";
import { assignMembershipRole, toggleMembershipPermission } from "../membership-access";
import { computeEffectivePermissions } from "../effective-access";
import { EffectiveAccessSummary } from "./effective-access-summary";

export interface UserAccessDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (membership: TenantMembership) => void;
  user: UserAccount;
  membership: TenantMembership;
  roles: AccessRole[];
  businessDate: string;
  /** Defaults to `[]` — callers that predate Gate 3 never need to pass one. */
  delegations?: Delegation[];
}

/**
 * "Gérer les accès" drawer (UI-011X Gate 2 §10-12, extended by Gate 4
 * §22) — role assignment, a unified per-permission toggle for individual
 * grants/restrictions (`toggleMembershipPermission`'s own doc comment
 * explains the single-checkbox design), and an `EffectiveAccessSummary`
 * at the top answering "what does this person actually have access to,
 * and why" at a glance — the same `computeEffectivePermissions` result
 * the checklist below reads permission-by-permission, never a second
 * computation. Local draft state only, committed on "Enregistrer" —
 * mirrors every other edit-form drawer in this codebase (e.g.
 * `PatientFormDialog`).
 */
export function UserAccessDrawer({ open, onClose, onSave, user, membership, roles, businessDate, delegations = [] }: UserAccessDrawerProps) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<TenantMembership>(membership);

  const draftRole = roles.find((role) => draft.roleIds.includes(role.id));
  const effective = computeEffectivePermissions(draft, roles, businessDate, delegations);
  const effectiveByKey = new Map(effective.map((entry) => [entry.permissionKey, entry]));

  function handleSubmit() {
    onSave(draft);
  }

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={t("access.users.drawer.title", { name: user.displayName })} closeLabel={t("access.users.drawer.close")}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">{user.displayName}</h2>
          <p className="text-sm text-text-muted" dir="ltr">
            {user.email}
          </p>
        </div>

        <Select
          label={t("access.users.drawer.roleLabel")}
          value={draft.roleIds[0] ?? ""}
          onChange={(event) => setDraft((current) => assignMembershipRole(current, event.target.value))}
          options={roles.map((role) => ({ value: role.id, label: t(role.nameKey) }))}
        />

        <EffectiveAccessSummary entries={effective} />

        <div className="flex flex-col gap-4">
          {PERMISSION_DOMAIN_ORDER.map((domain) => {
            const permissions = getPermissionsByDomain(domain);
            if (permissions.length === 0) return null;

            return (
              <div key={domain}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t(`access.domain.${domain}`)}</h3>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {permissions.map((permission) => {
                    const entry = effectiveByKey.get(permission.key);
                    const sourceKey = entry?.restricted
                      ? "restricted"
                      : entry?.sources.includes("grant")
                        ? "grant"
                        : entry?.sources.includes("delegation")
                          ? "delegation"
                          : entry?.sources.includes("role")
                            ? "role"
                            : null;

                    return (
                      <div key={permission.key} className="flex items-center gap-2 text-sm text-text">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={entry?.granted ?? false}
                            onChange={() => setDraft((current) => toggleMembershipPermission(current, draftRole, permission.key))}
                            className="h-4 w-4 rounded border-border-strong"
                          />
                          {t(permission.labelKey)}
                        </label>
                        {sourceKey && (
                          <span className="text-xs text-text-muted">{t(`access.users.drawer.source.${sourceKey}`)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("access.users.drawer.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {t("access.users.drawer.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

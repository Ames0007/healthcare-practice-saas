"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AccessRole, Delegation, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import {
  buildDelegationFromFormValues,
  buildInitialDelegationFormValues,
  validateDelegationForm,
  type DelegationFormValues,
} from "../delegation-constraints";

export interface CreateDelegationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (delegation: Delegation) => void;
  users: UserAccount[];
  memberships: TenantMembership[];
  roles: AccessRole[];
  existingDelegations: Delegation[];
  businessDate: string;
}

const DELEGATABLE_PERMISSIONS = PERMISSION_CATALOG.filter((permission) => permission.delegatable);

/**
 * Create Delegation (UI-011X Gate 3, task §16) — bounded to exactly one
 * permission per delegation (the objective diagram's own "temporary
 * transfer of *specific* authority"). `permissionKey` only ever offers
 * `delegatable: true` catalog entries in the dropdown; the deeper "does
 * the delegator actually hold it right now" check happens on submit via
 * `validateDelegationForm` (Gate 1's `delegatable` flag alone is not
 * sufficient — see that module's own doc comment).
 */
export function CreateDelegationDialog({
  open,
  onClose,
  onSubmit,
  users,
  memberships,
  roles,
  existingDelegations,
  businessDate,
}: CreateDelegationDialogProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<DelegationFormValues>(buildInitialDelegationFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const membershipItems: ComboboxItem[] = memberships.map((membership) => {
    const user = users.find((candidate) => candidate.id === membership.userId);
    return { id: membership.id, label: user?.displayName ?? membership.id };
  });

  const delegatorMembership = memberships.find((membership) => membership.id === values.delegatorMembershipId);

  function handleClose() {
    setValues(buildInitialDelegationFormValues());
    setErrors({});
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateDelegationForm(values, delegatorMembership, roles, businessDate, {
      required: t("access.delegations.form.requiredError"),
      sameMember: t("access.delegations.form.sameMemberError"),
      notDelegatable: t("access.delegations.form.notDelegatableError"),
      delegatorLacksPermission: t("access.delegations.form.delegatorLacksPermissionError"),
      endBeforeStart: t("access.delegations.form.endBeforeStartError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(buildDelegationFromFormValues(values, existingDelegations, businessDate));
    setValues(buildInitialDelegationFormValues());
    setErrors({});
  }

  return (
    <Dialog open={open} onClose={handleClose} variant="modal" size="md" label={t("access.delegations.form.title")} closeLabel={t("access.delegations.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">{t("access.delegations.form.title")}</h2>

        <Combobox
          label={t("access.delegations.form.delegatorLabel")}
          required
          items={membershipItems}
          value={values.delegatorMembershipId || null}
          onChange={(id) => setValues((current) => ({ ...current, delegatorMembershipId: id }))}
          emptyMessage={t("access.delegations.form.noMatch")}
          error={errors.delegatorMembershipId}
        />

        <Combobox
          label={t("access.delegations.form.delegateLabel")}
          required
          items={membershipItems}
          value={values.delegateMembershipId || null}
          onChange={(id) => setValues((current) => ({ ...current, delegateMembershipId: id }))}
          emptyMessage={t("access.delegations.form.noMatch")}
          error={errors.delegateMembershipId}
        />

        <Select
          label={t("access.delegations.form.permissionLabel")}
          required
          value={values.permissionKey}
          onChange={(event) => setValues((current) => ({ ...current, permissionKey: event.target.value }))}
          options={[
            { value: "", label: t("access.delegations.form.permissionPlaceholder") },
            ...DELEGATABLE_PERMISSIONS.map((permission) => ({ value: permission.key, label: t(permission.labelKey) })),
          ]}
          error={errors.permissionKey}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label={t("access.delegations.form.startsAtLabel")}
            required
            value={values.startsAt}
            onChange={(event) => setValues((current) => ({ ...current, startsAt: event.target.value }))}
            error={errors.startsAt}
          />
          <Input
            type="date"
            label={t("access.delegations.form.endsAtLabel")}
            required
            value={values.endsAt}
            onChange={(event) => setValues((current) => ({ ...current, endsAt: event.target.value }))}
            error={errors.endsAt}
          />
        </div>

        <Textarea
          label={t("access.delegations.form.reasonLabel")}
          value={values.reason}
          onChange={(event) => setValues((current) => ({ ...current, reason: event.target.value }))}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("access.delegations.form.cancel")}
          </Button>
          <Button type="submit">{t("access.delegations.form.save")}</Button>
        </div>
      </form>
    </Dialog>
  );
}

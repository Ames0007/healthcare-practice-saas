"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { CONTRACT_TYPE_MAP } from "@/components/domain/team/contract-type";
import { CONTRACT_STATUS_MAP } from "@/components/domain/team/contract-status";
import type { EmploymentContract, EmploymentContractFormValues } from "@/components/domain/team/types";
import { formatDayMonthYear } from "@/features/team/format";
import { ContractFormDialog } from "./contract-form-dialog";

export interface TeamMemberContractContentProps {
  contract: EmploymentContract | null;
  onContractChange: (contract: EmploymentContract) => void;
}

/**
 * The "Contrat" tab (UI-007B §23) — read-only contract summary + a
 * bounded edit action. No remuneration anywhere on this screen (§20).
 * When the member has no contract on file (§21D), shows a restrained
 * empty state instead of a summary — there is no "create a contract"
 * action here (§8 scopes this task to editing an existing contract).
 */
export function TeamMemberContractContent({ contract, onContractChange }: TeamMemberContractContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (!contract) {
    return <EmptyState title={t("teamDetail.contract.empty.title")} description={t("teamDetail.contract.empty.description")} />;
  }

  const typeMeta = CONTRACT_TYPE_MAP[contract.contractType];
  const statusMeta = CONTRACT_STATUS_MAP[contract.status];
  const currentContract: EmploymentContract = contract;

  function openEditForm() {
    setFormOpen(true);
    setFormKey((key) => key + 1);
  }

  function handleFormSubmit(values: EmploymentContractFormValues) {
    onContractChange({
      ...currentContract,
      contractType: values.contractType,
      status: values.status,
      jobTitle: values.jobTitle,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      weeklyHours: values.weeklyHours ? Number(values.weeklyHours) : undefined,
      notes: values.notes || undefined,
    });
    setFormOpen(false);
    setToastMessage(t("teamDetail.contract.toast.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.contract.title")}</h2>
          <Button type="button" variant="outline" size="sm" onClick={openEditForm}>
            {t("teamDetail.edit")}
          </Button>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.contract.typeLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t(typeMeta.translationKey)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.statusLabel")}</dt>
            <dd className="mt-1 text-sm">
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.contract.jobTitleLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{contract.jobTitle}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.startDateLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{formatDayMonthYear(contract.startDate, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.contract.endDateLabel")}</dt>
            <dd className="mt-1 text-sm text-text">
              {contract.endDate ? formatDayMonthYear(contract.endDate, locale) : t("teamDetail.contract.noEndDate")}
            </dd>
          </div>
          {contract.weeklyHours !== undefined && (
            <div>
              <dt className="text-xs text-text-muted">{t("teamDetail.contract.weeklyHoursLabel")}</dt>
              <dd className="mt-1 text-sm text-text">
                {t("teamDetail.contract.weeklyHoursValue", { hours: contract.weeklyHours })}
              </dd>
            </div>
          )}
        </dl>

        {contract.notes && (
          <div className="mt-4 border-t border-border pt-4">
            <dt className="text-xs text-text-muted">{t("teamDetail.contract.notesLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{contract.notes}</dd>
          </div>
        )}
      </Card>

      <ContractFormDialog
        key={formKey}
        open={formOpen}
        contractNumber={contract.contractNumber}
        initialValues={{
          contractType: contract.contractType,
          status: contract.status,
          jobTitle: contract.jobTitle,
          startDate: contract.startDate,
          endDate: contract.endDate ?? "",
          weeklyHours: contract.weeklyHours !== undefined ? String(contract.weeklyHours) : "",
          notes: contract.notes ?? "",
        }}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

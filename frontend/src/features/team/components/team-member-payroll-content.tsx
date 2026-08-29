"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { PAYROLL_ENTRY_STATUS_MAP, PAYROLL_PERIOD_STATUS_MAP } from "@/components/domain/team/payroll-status";
import type { PayrollAdjustment, PayrollEntry, PayrollPeriod, TeamMember } from "@/components/domain/team/types";
import { formatMad } from "@/features/today/format";
import { formatMinutesDuration } from "@/features/team/format";
import {
  computeBonusesTotal,
  computeDeductionsTotal,
  computeNetPayable,
  getPayrollEntryForMember,
  sortPayrollPeriodsDesc,
} from "@/features/team/payroll";
import { PayslipDialog } from "./payslip-dialog";

export interface TeamMemberPayrollContentProps {
  member: TeamMember;
  periods: PayrollPeriod[];
  entries: PayrollEntry[];
  onEntriesChange: (entries: PayrollEntry[]) => void;
}

type AdjustmentKind = "bonus" | "deduction";

/**
 * The "Paie" tab (UI-007CDEF §47) — a cabinet operational payroll
 * prototype, never a statutory Moroccan payroll/tax engine (§37/§77 —
 * no CNSS/AMO/IR line exists anywhere). Bonuses/deductions can only be
 * added while the period is still `draft` (§50 — a `finalized` period is
 * read-only, no edit/delete action of any kind).
 */
export function TeamMemberPayrollContent({ member, periods, entries, onEntriesChange }: TeamMemberPayrollContentProps) {
  const { t, locale } = useLocale();
  const sortedPeriods = sortPayrollPeriodsDesc(periods);
  const [selectedPeriodId, setSelectedPeriodId] = useState(sortedPeriods[0]?.id ?? "");
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentKind | null>(null);
  const [adjustmentLabel, setAdjustmentLabel] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const period = sortedPeriods.find((candidate) => candidate.id === selectedPeriodId) ?? null;
  const entry = period ? getPayrollEntryForMember(entries, period.id, member.id) : null;

  function resetAdjustmentForm() {
    setAdjustmentForm(null);
    setAdjustmentLabel("");
    setAdjustmentAmount("");
  }

  function handleAddAdjustment() {
    if (!entry || !adjustmentForm) return;
    const amount = Number(adjustmentAmount);
    if (!adjustmentLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const adjustment: PayrollAdjustment = { id: `adj-${entry.id}-${entry.bonuses.length + entry.deductions.length + 1}`, label: adjustmentLabel.trim(), amount };
    const updated: PayrollEntry =
      adjustmentForm === "bonus" ? { ...entry, bonuses: [...entry.bonuses, adjustment] } : { ...entry, deductions: [...entry.deductions, adjustment] };

    onEntriesChange(entries.map((candidate) => (candidate.id === entry.id ? updated : candidate)));
    resetAdjustmentForm();
    setToastMessage(adjustmentForm === "bonus" ? t("teamDetail.payroll.toast.bonusAdded") : t("teamDetail.payroll.toast.deductionAdded"));
  }

  if (!period) {
    return <EmptyState title={t("teamDetail.payroll.empty.title")} />;
  }

  const periodStatusMeta = PAYROLL_PERIOD_STATUS_MAP[period.status];
  const isEditable = period.status === "draft";

  return (
    <div className="flex flex-col gap-6">
      <Select
        aria-label={t("teamDetail.payroll.periodLabel")}
        value={selectedPeriodId}
        onChange={(event) => setSelectedPeriodId(event.target.value)}
        options={sortedPeriods.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
        className="w-auto"
      />

      {!entry ? (
        <EmptyState title={t("teamDetail.payroll.empty.title")} />
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{period.label}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge tone={periodStatusMeta.tone}>{t(periodStatusMeta.translationKey)}</StatusBadge>
              <StatusBadge tone={PAYROLL_ENTRY_STATUS_MAP[entry.status].tone}>{t(PAYROLL_ENTRY_STATUS_MAP[entry.status].translationKey)}</StatusBadge>
            </div>
          </div>

          {!isEditable && <p className="mt-3 text-sm text-text-muted">{t("teamDetail.payroll.finalizedNotice")}</p>}

          <dl className="mt-4 flex flex-col divide-y divide-border">
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-text-secondary">{t("teamDetail.payroll.baseLabel")}</dt>
              <dd className="text-sm tabular-nums text-text">{formatMad(entry.baseAmount, locale)}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-text-secondary">{t("teamDetail.payroll.overtimeLabel")}</dt>
              <dd className="text-sm tabular-nums text-text">
                {entry.overtimeMinutes > 0 ? formatMinutesDuration(entry.overtimeMinutes) : t("teamDetail.attendance.none")}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-text-secondary">{t("teamDetail.payroll.bonusesLabel")}</dt>
              <dd className="text-sm tabular-nums text-text">{formatMad(computeBonusesTotal(entry), locale)}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-text-secondary">{t("teamDetail.payroll.commissionLabel")}</dt>
              <dd className="text-sm tabular-nums text-text">{formatMad(entry.commissionAmount ?? 0, locale)}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-text-secondary">{t("teamDetail.payroll.deductionsLabel")}</dt>
              <dd className="text-sm tabular-nums text-danger">-{formatMad(computeDeductionsTotal(entry), locale)}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-semibold text-text">{t("teamDetail.payroll.netLabel")}</dt>
              <dd className="text-lg font-semibold tabular-nums text-text">{formatMad(computeNetPayable(entry), locale)}</dd>
            </div>
          </dl>

          {isEditable && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjustmentForm("bonus")}>
                {t("teamDetail.payroll.addBonus")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjustmentForm("deduction")}>
                {t("teamDetail.payroll.addDeduction")}
              </Button>
            </div>
          )}

          {adjustmentForm && (
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-border p-3">
              <Input label={t("teamDetail.payroll.adjustmentLabelLabel")} value={adjustmentLabel} onChange={(event) => setAdjustmentLabel(event.target.value)} />
              <Input
                type="number"
                min="0"
                label={t("teamDetail.payroll.adjustmentAmountLabel")}
                value={adjustmentAmount}
                onChange={(event) => setAdjustmentAmount(event.target.value)}
              />
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" onClick={handleAddAdjustment}>
                  {t("teamDetail.payroll.addAction")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetAdjustmentForm}>
                  {t("team.form.cancel")}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => setPayslipOpen(true)}>
              {t("teamDetail.payroll.viewPayslip")}
            </Button>
          </div>
        </Card>
      )}

      {entry && period && (
        <PayslipDialog
          open={payslipOpen}
          onClose={() => setPayslipOpen(false)}
          member={member}
          period={period}
          entry={entry}
          onDownload={(message) => setToastMessage(message)}
        />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

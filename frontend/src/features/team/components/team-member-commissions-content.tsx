"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import type { CommissionRule, PayrollPeriod, TeamMember } from "@/components/domain/team/types";
import { formatMad } from "@/features/today/format";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getPatientFullName } from "@/features/patients/format";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { computeCommissionAmount, computeEligibleBase, getEligibleCommissionActivity, resolvePractitionerName } from "@/features/team/commissions";
import { formatDayMonthYear } from "@/features/team/format";
import { sortPayrollPeriodsDesc } from "@/features/team/payroll";

export interface TeamMemberCommissionsContentProps {
  member: TeamMember;
  rule: CommissionRule;
  periods: PayrollPeriod[];
}

/**
 * The "Commissions" tab (UI-007CDEF §59) — practitioner-only (the shell
 * already gates this, §52/§62). Basis is always shown explicitly (§21 of
 * Screen 38's own wireframe: "Always display calculation basis") — always
 * "Montants encaissés" in this prototype (§54). Every figure is derived
 * live from the *existing* patient invoice/payment fixtures — never an
 * independent commissionRevenue number (§55). Only patient identity,
 * date, service and amount are shown per activity row — no clinical data
 * of any kind (§60).
 */
export function TeamMemberCommissionsContent({ member, rule, periods }: TeamMemberCommissionsContentProps) {
  const { t, locale } = useLocale();
  const sortedPeriods = sortPayrollPeriodsDesc(periods);
  const [selectedPeriodId, setSelectedPeriodId] = useState(sortedPeriods[0]?.id ?? "");
  const period = sortedPeriods.find((candidate) => candidate.id === selectedPeriodId) ?? null;

  const practitionerName = resolvePractitionerName(member);

  if (!period || !practitionerName) {
    return <EmptyState title={t("teamDetail.commissions.notApplicable.title")} />;
  }

  const patients = getPatientsMockData();
  const activity = getEligibleCommissionActivity(getPaymentsMockData(), getInvoicesMockData(), practitionerName, period.startDate, period.endDate);
  const eligibleBase = computeEligibleBase(activity);
  const commissionAmount = computeCommissionAmount(eligibleBase, rule.ratePercent);

  return (
    <div className="flex flex-col gap-6">
      <Select
        aria-label={t("teamDetail.payroll.periodLabel")}
        value={selectedPeriodId}
        onChange={(event) => setSelectedPeriodId(event.target.value)}
        options={sortedPeriods.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
        className="w-auto"
      />

      <Card>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{period.label}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("teamDetail.commissions.basisLabel")} — {t("teamDetail.commissions.basisValue")}</p>

        <dl className="mt-4 flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-text-secondary">{t("teamDetail.commissions.eligibleBaseLabel")}</dt>
            <dd className="text-sm tabular-nums text-text">{formatMad(eligibleBase, locale)}</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-text-secondary">{t("teamDetail.commissions.rateLabel")}</dt>
            <dd className="text-sm tabular-nums text-text">{rule.ratePercent}%</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm font-semibold text-text">{t("teamDetail.commissions.commissionLabel")}</dt>
            <dd className="text-lg font-semibold tabular-nums text-text">{formatMad(commissionAmount, locale)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.commissions.detailTitle")}</h2>

        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">{t("teamDetail.commissions.noActivity")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
                  <th className="px-2 py-2 text-start">{t("teamDetail.commissions.table.date")}</th>
                  <th className="px-2 py-2 text-start">{t("teamDetail.commissions.table.patientService")}</th>
                  <th className="px-2 py-2 text-start">{t("teamDetail.commissions.table.base")}</th>
                  <th className="px-2 py-2 text-start">{t("teamDetail.commissions.table.commission")}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => {
                  const patient = patients.find((candidate) => candidate.id === item.patientId);
                  return (
                    <tr key={item.paymentId} className="border-b border-border last:border-b-0">
                      <td className="px-2 py-2 text-text-secondary">{formatDayMonthYear(item.date, locale)}</td>
                      <td className="px-2 py-2 text-text-secondary">
                        {patient ? getPatientFullName(patient) : t("team.notProvided")}
                        {item.description && <span className="text-text-muted"> · {item.description}</span>}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-text-secondary">{formatMad(item.amount, locale)}</td>
                      <td className="px-2 py-2 tabular-nums text-text-secondary">{formatMad(computeCommissionAmount(item.amount, rule.ratePercent), locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

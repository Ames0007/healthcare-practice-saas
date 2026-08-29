import type { PayrollEntry, PayrollPeriod, TeamMember } from "@/components/domain/team/types";
import type { CabinetProfile, DocumentSettings } from "@/components/domain/settings/types";
import { formatMad } from "@/features/today/format";
import { formatMinutesDuration, getTeamMemberFullName } from "@/features/team/format";
import { computeBonusesTotal, computeDeductionsTotal, computeNetPayable } from "@/features/team/payroll";
import { buildDocumentFilename } from "./filename";
import { createDocumentTranslator } from "./translate";
import type { GeneratedDocumentBase } from "./types";

export interface PayslipDocumentAdjustmentLine {
  id: string;
  label: string;
  amountLabel: string;
}

export interface PayslipDocumentModel extends GeneratedDocumentBase {
  type: "payslip";
  employeeLabel: string;
  employeeName: string;
  employeeNumberLabel: string;
  employeeNumber: string;
  periodLabel: string;
  periodValue: string;
  baseLabel: string;
  baseAmountLabel: string;
  overtimeLabel: string;
  overtimeValueLabel: string;
  bonusesLabel: string;
  bonuses: PayslipDocumentAdjustmentLine[];
  bonusesTotalLabel: string;
  commissionLabel: string;
  commissionAmountLabel: string;
  deductionsLabel: string;
  deductions: PayslipDocumentAdjustmentLine[];
  deductionsTotalLabel: string;
  netLabel: string;
  /** Reconciled 1:1 against `computeNetPayable(entry)` — never a second payroll formula (task §24). */
  netAmount: number;
  netAmountLabel: string;
  prototypeNotice: string;
}

/**
 * Pure payroll entry → document projection (task §24). Every amount is
 * either read directly off `PayrollEntry` or produced by the existing
 * `features/team/payroll.ts` computations `TeamMemberPayrollContent`/
 * `PayslipDialog` already render on screen — no new arithmetic here.
 */
export function buildPayslipDocument(
  member: Pick<TeamMember, "firstName" | "lastName" | "employeeNumber">,
  period: PayrollPeriod,
  entry: PayrollEntry,
  cabinet: CabinetProfile,
  documentSettings: DocumentSettings,
): PayslipDocumentModel {
  const locale = documentSettings.documentLanguage;
  const t = createDocumentTranslator(locale);
  const periodMonth = period.startDate.slice(0, 7);
  const noneLabel = t("teamDetail.attendance.none");

  return {
    type: "payslip",
    reference: period.label,
    title: t("documents.payslip.title"),
    filename: buildDocumentFilename("Bulletin-Paie", member.employeeNumber, periodMonth),
    locale,
    generatedAtPrototype: new Date().toISOString(),
    sourceRecordId: entry.id,
    cabinet: {
      name: cabinet.name,
      address: cabinet.address,
      city: cabinet.city,
      phone: cabinet.phone,
      email: cabinet.email,
    },
    headerNote: documentSettings.headerNote,
    footerText: documentSettings.footerText,
    employeeLabel: t("documents.payslip.employeeLabel"),
    employeeName: getTeamMemberFullName(member),
    employeeNumberLabel: t("documents.payslip.employeeNumberLabel"),
    employeeNumber: member.employeeNumber,
    periodLabel: t("documents.payslip.periodLabel"),
    periodValue: period.label,
    baseLabel: t("documents.payslip.baseLabel"),
    baseAmountLabel: formatMad(entry.baseAmount, locale),
    overtimeLabel: t("documents.payslip.overtimeLabel"),
    overtimeValueLabel: entry.overtimeMinutes > 0 ? formatMinutesDuration(entry.overtimeMinutes) : noneLabel,
    bonusesLabel: t("documents.payslip.bonusesLabel"),
    bonuses: entry.bonuses.map((bonus) => ({ id: bonus.id, label: bonus.label, amountLabel: formatMad(bonus.amount, locale) })),
    bonusesTotalLabel: formatMad(computeBonusesTotal(entry), locale),
    commissionLabel: t("documents.payslip.commissionLabel"),
    commissionAmountLabel: formatMad(entry.commissionAmount ?? 0, locale),
    deductionsLabel: t("documents.payslip.deductionsLabel"),
    deductions: entry.deductions.map((deduction) => ({ id: deduction.id, label: deduction.label, amountLabel: formatMad(deduction.amount, locale) })),
    deductionsTotalLabel: formatMad(computeDeductionsTotal(entry), locale),
    netLabel: t("documents.payslip.netLabel"),
    netAmount: computeNetPayable(entry),
    netAmountLabel: formatMad(computeNetPayable(entry), locale),
    prototypeNotice: t("documents.prototypeNotice"),
  };
}

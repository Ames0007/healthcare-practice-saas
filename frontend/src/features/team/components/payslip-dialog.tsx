"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PayrollEntry, PayrollPeriod, TeamMember } from "@/components/domain/team/types";
import { formatMad } from "@/features/today/format";
import { formatMinutesDuration, getTeamMemberFullName } from "@/features/team/format";
import { computeBonusesTotal, computeDeductionsTotal, computeNetPayable } from "@/features/team/payroll";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildPayslipDocument } from "@/features/documents/payslip-document";
import { PayslipDocumentPdf } from "@/features/documents/payslip-document-pdf";
import { generateDocumentBlob, triggerBlobDownload, triggerBlobPrint } from "@/features/documents/download";
import { isDocumentLanguageSupported } from "@/features/documents/capabilities";

export interface PayslipDialogProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
  period: PayrollPeriod;
  entry: PayrollEntry;
  /** Fires only if PDF generation itself fails (UI-DOCS-X) — mirrors UI-005D's `onFutureFeature` error-reporting pattern. */
  onDownload: (message: string) => void;
}

/**
 * Read-only payslip detail (UI-007CDEF §49) — this dialog's own visible
 * breakdown already serves as the document's preview surface (UI-DOCS-X);
 * "Télécharger"/"Imprimer" generate a real PDF from this exact
 * `PayrollEntry`, reusing `computeNetPayable` verbatim rather than a second
 * payroll formula.
 */
export function PayslipDialog({ open, onClose, member, period, entry, onDownload }: PayslipDialogProps) {
  const { t, locale } = useLocale();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  async function generatePayslipBlob() {
    const model = buildPayslipDocument(member, period, entry, getCabinetProfileMockData(), getDocumentSettingsMockData());
    const blob = await generateDocumentBlob(<PayslipDocumentPdf model={model} />);
    return { blob, filename: model.filename };
  }

  async function handleDownload() {
    if (!isDocumentLanguageSupported(getDocumentSettingsMockData().documentLanguage)) {
      onDownload(t("documents.languageUnsupportedNotice"));
      return;
    }
    setIsDownloading(true);
    try {
      const { blob, filename } = await generatePayslipBlob();
      triggerBlobDownload(blob, filename);
    } catch {
      onDownload(t("teamDetail.payroll.payslip.downloadNotice"));
    } finally {
      setIsDownloading(false);
    }
  }

  async function handlePrint() {
    if (!isDocumentLanguageSupported(getDocumentSettingsMockData().documentLanguage)) {
      onDownload(t("documents.languageUnsupportedNotice"));
      return;
    }
    setIsPrinting(true);
    try {
      const { blob } = await generatePayslipBlob();
      triggerBlobPrint(blob);
    } catch {
      onDownload(t("teamDetail.payroll.payslip.downloadNotice"));
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} variant="modal" size="sm" label={t("teamDetail.payroll.payslip.title")} closeLabel={t("team.form.close")}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">{t("teamDetail.payroll.payslip.title")}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {getTeamMemberFullName(member)} — {period.label}
          </p>
        </div>

        <dl className="flex flex-col divide-y divide-border">
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

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={handlePrint} loading={isPrinting}>
            {t("patientDetail.invoices.print")}
          </Button>
          <Button type="button" variant="outline" onClick={handleDownload} loading={isDownloading}>
            {t("teamDetail.payroll.payslip.download")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

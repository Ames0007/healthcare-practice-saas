"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import type { TeamMember } from "@/components/domain/team/types";
import type { Patient } from "@/features/patients/types";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { computeNumberingSummary } from "./numbering";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type NumberingPageState = "loading" | "loaded" | "error";

export interface NumberingPageProps {
  patients?: Patient[];
  teamMembers?: TeamMember[];
  invoices?: Invoice[];
  payments?: Payment[];
  state?: NumberingPageState;
  onRetry?: () => void;
}

/**
 * Numbering & Documents (UI-010ABC Gate 3), `/app/parametres/numerotation`
 * — read-only, per `NumberingSequenceRow`'s own doc comment: concurrency-
 * safe sequence allocation is a backend concern, not simulated here.
 */
export function NumberingPage({
  patients: providedPatients,
  teamMembers: providedTeamMembers,
  invoices: providedInvoices,
  payments: providedPayments,
  state = "loaded",
  onRetry,
}: NumberingPageProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return <SettingsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("parametres.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("parametres.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const rows = computeNumberingSummary(
    providedPatients ?? getPatientsMockData(),
    providedTeamMembers ?? getTeamMembersMockData(),
    providedInvoices ?? getInvoicesMockData(),
    providedPayments ?? getPaymentsMockData(),
    MOCK_BUSINESS_DATE,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("parametres.numbering.pageTitle")} description={t("parametres.numbering.pageDescription")} />

      <ParametresNav />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">{t("parametres.numbering.table.type")}</th>
              <th className="px-4 py-3 font-medium">{t("parametres.numbering.table.prefix")}</th>
              <th className="px-4 py-3 font-medium">{t("parametres.numbering.table.yearReset")}</th>
              <th className="px-4 py-3 font-medium">{t("parametres.numbering.table.nextNumber")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sequenceType} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-text">{t(row.labelKey)}</td>
                <td className="px-4 py-3 font-mono text-text-secondary">{row.prefix}</td>
                <td className="px-4 py-3">{t(row.yearReset ? "parametres.numbering.yearResetYes" : "parametres.numbering.yearResetNo")}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{row.nextNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-text-muted">{t("parametres.numbering.readOnlyNote")}</p>
    </div>
  );
}

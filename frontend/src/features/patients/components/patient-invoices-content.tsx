"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { InvoiceCard } from "@/components/domain/finance/invoice-card";
import type { Invoice } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { formatDayMonth, formatMad, getPatientFullName } from "@/features/patients/format";
import { getFinancialSummary, getInvoicesForPatient, matchesInvoiceFilter, type InvoiceFilterGroup } from "@/features/patients/finance";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { InvoiceDetailDrawer } from "./invoice-detail-drawer";
import { PatientInvoiceFilters } from "./patient-invoice-filters";

export type PatientInvoicesState = "loading" | "loaded" | "error";

export interface PatientInvoicesContentProps {
  patientId: string;
  /** Prototype seam for tests (UI-004D §13) — defaults to the centralized mock invoices, filtered by `patientId`. */
  invoices?: Invoice[];
  /** Prototype seam for tests — defaults to the centralized patient seed dataset, used only to resolve the display name shown inside the drawer. */
  patients?: Patient[];
  state?: PatientInvoicesState;
  onRetry?: () => void;
}

/**
 * Factures tab (UI-004D). Reads the centralized invoice fixtures filtered
 * by `patientId` — the same fixtures the Aperçu overview's balance/next-
 * installment and the PatientHeader balance derive from (§15-16), so all
 * three can never disagree. Invoice/installment data is local seed
 * prototype only; real cross-route synchronization arrives with the
 * Laravel API — same reasoning as UI-004B/C's own documented limitations.
 */
export function PatientInvoicesContent({
  patientId,
  invoices: providedInvoices,
  patients: providedPatients,
  state = "loaded",
  onRetry,
}: PatientInvoicesContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [filter, setFilter] = useState<InvoiceFilterGroup>("all");

  function openInvoiceDrawer(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    setDrawerKey((key) => key + 1);
  }

  function showFutureNotice(message: string) {
    setToastMessage(message);
  }

  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">{t("common.loading")}</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex justify-end">
            <Skeleton className="h-9 w-44" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.invoices.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.invoices.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const allInvoices = providedInvoices ?? getInvoicesMockData();
  const patientInvoices = getInvoicesForPatient(allInvoices, patientId);
  const selectedInvoice = patientInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const patients = providedPatients ?? getPatientsMockData();
  const patient = patients.find((candidate) => candidate.id === patientId);
  const patientName = patient ? getPatientFullName(patient) : "";

  const newInvoiceButton = (
    <Button size="sm" onClick={() => showFutureNotice(t("patientDetail.invoices.newInvoiceNotice"))}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      {t("patientDetail.invoices.newInvoice")}
    </Button>
  );

  if (patientInvoices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          title={t("patientDetail.invoices.emptyAllTitle")}
          description={t("patientDetail.invoices.emptyAllDescription")}
          primaryAction={newInvoiceButton}
        />
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </div>
    );
  }

  const summary = getFinancialSummary(patientInvoices);
  const filtered = patientInvoices
    .filter((invoice) => matchesInvoiceFilter(invoice, filter))
    .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">{newInvoiceButton}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t("patientDetail.invoices.totalInvoicedLabel")} value={formatMad(summary.totalAmount, locale)} />
        <MetricCard label={t("patientDetail.invoices.paidLabel")} value={formatMad(summary.paidAmount, locale)} />
        <MetricCard label={t("patientDetail.invoices.remainingLabel")} value={formatMad(summary.remainingAmount, locale)} />
      </div>

      <PatientInvoiceFilters active={filter} onChange={setFilter} resultCount={filtered.length} />

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">{t("patientDetail.invoices.emptyFilteredTitle")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((invoice) => {
            const canCollect = invoice.remainingAmount > 0 && invoice.status !== "cancelled";
            return (
              <InvoiceCard
                key={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                description={invoice.description}
                issuedDateLabel={formatDayMonth(invoice.issuedDate, locale)}
                status={invoice.status}
                totalLabel={formatMad(invoice.totalAmount, locale)}
                paidLabel={formatMad(invoice.paidAmount, locale)}
                remainingLabel={formatMad(invoice.remainingAmount, locale)}
                actions={
                  <>
                    <Button variant="outline" size="sm" onClick={() => openInvoiceDrawer(invoice.id)}>
                      {t("patientDetail.invoices.viewInvoice")}
                    </Button>
                    {canCollect && (
                      <Link href={`/app/patients/${patientId}/payments`} className={buttonClassNames("ghost", "sm")}>
                        {t("patientDetail.header.collectPayment")}
                      </Link>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <InvoiceDetailDrawer
        key={drawerKey}
        invoice={selectedInvoice}
        patientId={patientId}
        patientName={patientName}
        open={selectedInvoiceId !== null}
        onClose={() => setSelectedInvoiceId(null)}
        onFutureFeature={showFutureNotice}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}


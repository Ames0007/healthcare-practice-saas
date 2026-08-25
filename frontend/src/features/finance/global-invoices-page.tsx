"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import type { Invoice } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getFinancialSummary } from "@/features/patients/finance";
import { getPatientFullName } from "@/features/patients/format";
import { InvoiceDetailDrawer } from "@/features/patients/components/invoice-detail-drawer";
import type { Patient } from "@/features/patients/types";
import { buildGlobalInvoiceRows, matchesGlobalInvoiceFilter, matchesGlobalInvoiceSearch } from "./global-invoices";
import type { GlobalInvoiceFilterGroup } from "./types";
import { GlobalInvoiceSummary } from "./components/global-invoice-summary";
import { GlobalInvoiceFilters } from "./components/global-invoice-filters";
import { GlobalInvoiceTable } from "./components/global-invoice-table";
import { GlobalInvoiceCardList } from "./components/global-invoice-card-list";
import { GlobalInvoicesSkeleton } from "./components/global-invoices-skeleton";

export type GlobalInvoicesPageState = "loading" | "loaded" | "error";

export interface GlobalInvoicesPageProps {
  /** Prototype seams (mirrors Aujourd'hui/Patients/Finance dashboard): swap for real query results later. */
  invoices?: Invoice[];
  patients?: Patient[];
  state?: GlobalInvoicesPageState;
  onRetry?: () => void;
}

/**
 * Global Invoices & Receivables (UI-006B) — the cabinet-wide operational
 * workspace at `/app/finance/invoices`, distinct from Patient 360°'s own
 * Factures tab and from the Finance dashboard's compact Receivables
 * attention list. Every row/total is derived from the same
 * `getInvoicesMockData()`/`getPatientsMockData()` fixtures already used by
 * UI-004D and UI-006A — no second invoice universe. Read/operate/navigate
 * only: no invoice creation/editing/cancellation, no payment capture (that
 * remains Patient 360° → Paiements, UI-004E) anywhere on this screen.
 */
export function GlobalInvoicesPage({
  invoices: providedInvoices,
  patients: providedPatients,
  state = "loaded",
  onRetry,
}: GlobalInvoicesPageProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GlobalInvoiceFilterGroup>("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (state === "loading") {
    return <GlobalInvoicesSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("finance.invoices.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("finance.invoices.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const allInvoices = providedInvoices ?? getInvoicesMockData();
  const patients = providedPatients ?? getPatientsMockData();

  if (allInvoices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("finance.invoices.pageTitle")} description={t("finance.invoices.pageDescription")} />
        <EmptyState
          title={t("finance.invoices.emptyAllTitle")}
          description={t("finance.invoices.emptyAllDescription")}
        />
      </div>
    );
  }

  function openInvoiceDrawer(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    setDrawerKey((key) => key + 1);
  }

  const rows = buildGlobalInvoiceRows(allInvoices, patients);
  const searched = rows.filter((row) => matchesGlobalInvoiceSearch(row, search));
  const filtered = searched.filter((row) => matchesGlobalInvoiceFilter(row, filter));
  const summary = getFinancialSummary(filtered.map((row) => row.invoice));

  const selectedRow = rows.find((row) => row.invoice.id === selectedInvoiceId) ?? null;
  const selectedPatient = selectedRow ? patients.find((patient) => patient.id === selectedRow.patientId) : undefined;
  const selectedPatientName = selectedRow
    ? (selectedPatient ? getPatientFullName(selectedPatient) : selectedRow.patientName)
    : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("finance.invoices.pageTitle")} description={t("finance.invoices.pageDescription")} />

      <GlobalInvoiceSummary summary={summary} />

      <GlobalInvoiceFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        search.trim() !== "" ? (
          <EmptyState
            title={t("finance.invoices.searchEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                {t("finance.invoices.clearSearch")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t("finance.invoices.filteredEmptyTitle")}
            primaryAction={
              <Button size="sm" variant="outline" onClick={() => setFilter("all")}>
                {t("finance.invoices.clearFilters")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <GlobalInvoiceTable rows={filtered} onSelect={openInvoiceDrawer} />
          <GlobalInvoiceCardList rows={filtered} onSelect={openInvoiceDrawer} />
        </>
      )}

      <InvoiceDetailDrawer
        key={drawerKey}
        invoice={selectedRow?.invoice ?? null}
        patientId={selectedRow?.patientId ?? ""}
        patientName={selectedPatientName}
        open={selectedInvoiceId !== null}
        onClose={() => setSelectedInvoiceId(null)}
        onFutureFeature={(message) => setToastMessage(message)}
        showPatientNavigation
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

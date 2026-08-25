"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { PaymentRow } from "@/components/domain/finance/payment-row";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getInvoicesForPatient } from "@/features/patients/finance";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { formatDayMonth, formatMad, getPatientFullName } from "@/features/patients/format";
import { getPaymentsForPatient, getPaymentSummary, sortPaymentsDesc } from "@/features/patients/payments";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { PatientPaymentCaptureDialog } from "./patient-payment-capture-dialog";
import { PaymentDetailDrawer } from "./payment-detail-drawer";

export type PatientPaymentsState = "loading" | "loaded" | "error";

export interface PatientPaymentsContentProps {
  patientId: string;
  /** Prototype seam for tests (UI-004E §13) — defaults to the centralized mock payments, filtered by `patientId`. */
  payments?: Payment[];
  /** Prototype seam for tests — defaults to the centralized mock invoices (UI-004D), filtered by `patientId`. */
  invoices?: Invoice[];
  patients?: Patient[];
  state?: PatientPaymentsState;
  onRetry?: () => void;
}

/**
 * Paiements tab (UI-004E). Invoices remain the authoritative prototype
 * balance schedule (UI-004D) — this tab never mutates them; payments here
 * are historical evidence explaining the paid amounts already reflected in
 * those invoice fixtures (§16). A newly captured payment is appended only
 * to this component's own local state (`localPayments`) so the history/
 * summary/allocatable-balance update immediately within this tab, without a
 * global store — navigating back to Factures and returning resets to the
 * seed state, matching UI-004B/C/D's own documented cross-route limitation
 * (§33-34).
 */
export function PatientPaymentsContent({
  patientId,
  payments: providedPayments,
  invoices: providedInvoices,
  patients: providedPatients,
  state = "loaded",
  onRetry,
}: PatientPaymentsContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localPayments, setLocalPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [detailDrawerKey, setDetailDrawerKey] = useState(0);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureDialogKey, setCaptureDialogKey] = useState(0);

  function openDetail(paymentId: string) {
    setSelectedPaymentId(paymentId);
    setDetailDrawerKey((key) => key + 1);
  }

  function openCapture() {
    setCaptureDialogKey((key) => key + 1);
    setCaptureOpen(true);
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
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.payments.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.payments.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const allInvoices = providedInvoices ?? getInvoicesMockData();
  const patientInvoices = getInvoicesForPatient(allInvoices, patientId);
  const seedPayments = getPaymentsForPatient(providedPayments ?? getPaymentsMockData(), patientId);
  const allPatientPayments = sortPaymentsDesc([...localPayments, ...seedPayments]);
  const selectedPayment = allPatientPayments.find((payment) => payment.id === selectedPaymentId) ?? null;

  const patients = providedPatients ?? getPatientsMockData();
  const patient = patients.find((candidate) => candidate.id === patientId);
  const patientName = patient ? getPatientFullName(patient) : "";

  const summary = getPaymentSummary(allPatientPayments);

  function handleCaptureSubmit(payment: Payment) {
    setLocalPayments((current) => [...current, payment]);
    setCaptureOpen(false);
    setToastMessage(t("patientDetail.payments.paymentSuccess"));
    openDetail(payment.id);
  }

  const encaisserButton = (
    <Button size="sm" onClick={openCapture}>
      {t("patientDetail.payments.encaisser")}
    </Button>
  );

  const captureDialog = (
    <PatientPaymentCaptureDialog
      key={captureDialogKey}
      open={captureOpen}
      onClose={() => setCaptureOpen(false)}
      patientId={patientId}
      patientName={patientName}
      invoices={patientInvoices}
      localPayments={localPayments}
      existingPaymentCount={seedPayments.length + localPayments.length}
      onSubmit={handleCaptureSubmit}
    />
  );

  const detailDrawer = (
    <PaymentDetailDrawer
      key={detailDrawerKey}
      payment={selectedPayment}
      invoices={patientInvoices}
      patientId={patientId}
      patientName={patientName}
      open={selectedPaymentId !== null}
      onClose={() => setSelectedPaymentId(null)}
      onFutureFeature={showFutureNotice}
    />
  );

  if (allPatientPayments.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          title={t("patientDetail.payments.emptyAllTitle")}
          description={t("patientDetail.payments.emptyAllDescription")}
          primaryAction={encaisserButton}
        />
        {captureDialog}
        {detailDrawer}
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">{encaisserButton}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t("patientDetail.payments.totalCollectedLabel")} value={formatMad(summary.totalCollected, locale)} />
        <MetricCard label={t("patientDetail.payments.paymentCountLabel")} value={summary.paymentCount} />
        <MetricCard
          label={t("patientDetail.payments.lastPaymentLabel")}
          value={summary.lastPaymentDate ? formatDayMonth(summary.lastPaymentDate, locale) : t("patientDetail.payments.noLastPayment")}
        />
      </div>

      <div className="flex flex-col">
        {allPatientPayments.map((payment) => {
          const allocation = payment.allocations[0];
          const invoice = allocation ? patientInvoices.find((candidate) => candidate.id === allocation.invoiceId) : undefined;

          return (
            <PaymentRow
              key={payment.id}
              dateLabel={formatDayMonth(payment.paymentDate, locale)}
              reference={payment.receipt?.receiptNumber ?? payment.paymentNumber}
              amountLabel={formatMad(payment.amount, locale)}
              methodLabel={t(`patientDetail.payments.method.${payment.method}`)}
              invoiceNumber={invoice?.invoiceNumber ?? ""}
              status={payment.status}
              reversalReasonLabel={payment.reversalReason}
              onSelect={() => openDetail(payment.id)}
            />
          );
        })}
      </div>

      {captureDialog}
      {detailDrawer}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

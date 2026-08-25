"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import { formatMad } from "@/features/patients/format";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";
import { isValidPaymentAmount } from "@/features/patients/payment-form-validation";
import {
  computeEffectiveRemaining,
  generatePaymentNumber,
  generateReceiptNumber,
  getAllocatableInvoices,
  getPayableInstallments,
} from "@/features/patients/payments";

export interface PatientPaymentCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  /** The patient's own invoices — never mutated here (UI-004E §33). */
  invoices: Invoice[];
  /** Payments already captured this session, used to compute an effective remaining balance without touching the invoice fixtures (UI-004E §7/§33). */
  localPayments: Payment[];
  /** Count of every payment already known (seed + local) — feeds the prototype reference/receipt numbering (UI-004E §32). */
  existingPaymentCount: number;
  onSubmit: (payment: Payment) => void;
}

/**
 * Cash-payment capture prototype (Spec #9 Screen 27, UI-004E §22-31). The
 * only interactive payment surface in this task — reuses the shared
 * `Dialog` drawer unmodified (§23: "do not create another modal system").
 * An installment target locks the amount to its exact value (no partial-
 * installment lifecycle, UI-004E §29's simpler-UX choice); only an
 * invoice with no installment schedule of its own allows a free amount up
 * to its remaining balance. No backend, no persistence past this session.
 */
export function PatientPaymentCaptureDialog({
  open,
  onClose,
  patientId,
  patientName,
  invoices,
  localPayments,
  existingPaymentCount,
  onSubmit,
}: PatientPaymentCaptureDialogProps) {
  const { t, locale } = useLocale();

  const effectiveRemaining = computeEffectiveRemaining(invoices, localPayments);
  const allocatableInvoices = getAllocatableInvoices(invoices, effectiveRemaining);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(allocatableInvoices[0]?.id ?? "");
  const selectedInvoice = allocatableInvoices.find((invoice) => invoice.id === selectedInvoiceId);
  const payableInstallments = selectedInvoice ? getPayableInstallments(selectedInvoice, localPayments) : [];

  const [selectedInstallmentId, setSelectedInstallmentId] = useState(payableInstallments[0]?.id ?? "");
  const selectedInstallment = payableInstallments.find((installment) => installment.id === selectedInstallmentId);

  const [amount, setAmount] = useState(() =>
    selectedInstallment
      ? String(selectedInstallment.amount)
      : selectedInvoice
        ? String(effectiveRemaining.get(selectedInvoice.id) ?? 0)
        : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleInvoiceChange(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    const invoice = allocatableInvoices.find((candidate) => candidate.id === invoiceId);
    const installments = invoice ? getPayableInstallments(invoice, localPayments) : [];
    const nextInstallment = installments[0];
    setSelectedInstallmentId(nextInstallment?.id ?? "");
    setAmount(nextInstallment ? String(nextInstallment.amount) : invoice ? String(effectiveRemaining.get(invoice.id) ?? 0) : "");
    setErrors({});
  }

  function handleInstallmentChange(installmentId: string) {
    setSelectedInstallmentId(installmentId);
    const installment = payableInstallments.find((candidate) => candidate.id === installmentId);
    setAmount(
      installment
        ? String(installment.amount)
        : selectedInvoice
          ? String(effectiveRemaining.get(selectedInvoice.id) ?? 0)
          : "",
    );
    setErrors({});
  }

  function validate(): Record<string, string> {
    if (!selectedInvoice) {
      return {};
    }

    const allocatable = effectiveRemaining.get(selectedInvoice.id) ?? 0;
    if (!isValidPaymentAmount(amount)) {
      return { amount: t("patientDetail.payments.form.invalidAmountError") };
    }
    if (Number(amount) > allocatable) {
      return { amount: t("patientDetail.payments.form.overpaymentError") };
    }
    return {};
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedInvoice) {
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const paymentId = `pay-new-${existingPaymentCount + 1}`;
    const payment: Payment = {
      id: paymentId,
      patientId,
      paymentNumber: generatePaymentNumber(existingPaymentCount),
      paymentDate: PATIENTS_TODAY_DATE,
      amount: Number(amount),
      method: "cash",
      status: "posted",
      allocations: [
        {
          id: `${paymentId}-a1`,
          paymentId,
          invoiceId: selectedInvoice.id,
          installmentId: selectedInstallment?.id,
          amount: Number(amount),
        },
      ],
      receipt: {
        id: `${paymentId}-rec`,
        receiptNumber: generateReceiptNumber(existingPaymentCount),
        paymentId,
        issuedAt: PATIENTS_TODAY_DATE,
      },
    };

    onSubmit(payment);
  }

  const title = t("patientDetail.payments.captureTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("patients.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{patientName}</p>
        </div>

        {!selectedInvoice ? (
          <p className="text-sm text-text-muted">{t("patientDetail.payments.form.noAllocatableInvoice")}</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("patientDetail.payments.form.balanceDueLabel")}</p>
              <p className="text-2xl font-semibold tabular-nums text-text" dir="ltr">
                {formatMad(effectiveRemaining.get(selectedInvoice.id) ?? 0, locale)}
              </p>
            </div>

            <Select
              label={t("patientDetail.payments.form.allocateToLabel")}
              value={selectedInvoiceId}
              onChange={(event) => handleInvoiceChange(event.target.value)}
              options={allocatableInvoices.map((invoice) => ({ value: invoice.id, label: invoice.invoiceNumber }))}
            />

            {payableInstallments.length > 0 && (
              <Select
                label={t("patientDetail.payments.form.installmentLabel")}
                value={selectedInstallmentId}
                onChange={(event) => handleInstallmentChange(event.target.value)}
                options={payableInstallments.map((installment) => ({
                  value: installment.id,
                  label: `${t("patientDetail.invoices.installmentLabel", { n: installment.sequenceNumber })} — ${formatMad(installment.amount, locale)}`,
                }))}
              />
            )}

            <Input
              label={t("patientDetail.payments.form.amountLabel")}
              required
              inputMode="numeric"
              dir="ltr"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={Boolean(selectedInstallment)}
              error={errors.amount}
            />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("patientDetail.payments.form.methodLabel")}</p>
              <p className="text-sm text-text">{t("patientDetail.payments.method.cash")}</p>
            </div>

            <p className="text-xs text-text-muted">{t("patientDetail.payments.form.caisseNotice")}</p>
          </>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t("patients.form.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={!selectedInvoice}>
            {selectedInvoice
              ? t("patientDetail.payments.form.submitLabel", { amount: formatMad(Number(amount) || 0, locale) })
              : t("patientDetail.payments.encaisser")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

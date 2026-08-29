import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import { PatientPaymentsContent } from "./patient-payments-content";
import { generateDocumentBlob, triggerBlobDownload } from "@/features/documents/download";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/payments",
}));

vi.mock("@/features/documents/download", () => ({
  generateDocumentBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
  triggerBlobDownload: vi.fn(),
  triggerBlobPrint: vi.fn(),
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderContent(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientPaymentsContent> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientPaymentsContent {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const PAYABLE_INVOICE: Invoice = {
  id: "inv-1",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00142",
  issuedDate: "2026-08-01",
  status: "partially_paid",
  currency: "MAD",
  description: "Traitement de rééducation",
  practitionerName: "Dr. Benali",
  totalAmount: 3000,
  paidAmount: 1500,
  remainingAmount: 1500,
  lines: [{ id: "l1", label: "Traitement de rééducation — 20 séances", quantity: 1, unitPriceAmount: 3000, totalAmount: 3000 }],
  installments: [
    { id: "i1", invoiceId: "inv-1", sequenceNumber: 1, dueDate: "2026-08-01", amount: 500, status: "paid", paidDate: "2026-08-01" },
    { id: "i2", invoiceId: "inv-1", sequenceNumber: 2, dueDate: "2026-08-15", amount: 500, status: "paid", paidDate: "2026-08-15" },
    { id: "i3", invoiceId: "inv-1", sequenceNumber: 3, dueDate: "2026-08-22", amount: 500, status: "paid", paidDate: "2026-08-22" },
    { id: "i4", invoiceId: "inv-1", sequenceNumber: 4, dueDate: "2026-09-01", amount: 500, status: "due" },
    { id: "i5", invoiceId: "inv-1", sequenceNumber: 5, dueDate: "2026-09-15", amount: 500, status: "future" },
    { id: "i6", invoiceId: "inv-1", sequenceNumber: 6, dueDate: "2026-10-01", amount: 500, status: "future" },
  ],
};

const PAID_INVOICE: Invoice = {
  id: "inv-1b",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00099",
  issuedDate: "2026-07-15",
  status: "paid",
  currency: "MAD",
  description: "Consultation initiale",
  practitionerName: "Dr. Benali",
  totalAmount: 1500,
  paidAmount: 1500,
  remainingAmount: 0,
  lines: [],
  installments: [],
};

const LUMP_SUM_INVOICE: Invoice = {
  id: "inv-lump",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00201",
  issuedDate: "2026-08-10",
  status: "issued",
  currency: "MAD",
  description: "Bilan initial",
  practitionerName: "Dr. Benali",
  totalAmount: 1000,
  paidAmount: 0,
  remainingAmount: 1000,
  lines: [{ id: "ll1", label: "Bilan initial", quantity: 1, unitPriceAmount: 1000, totalAmount: 1000 }],
  installments: [],
};

const PAYMENTS_PAT1: Payment[] = [
  {
    id: "pay-3",
    patientId: "pat-1",
    paymentNumber: "PAY-2026-0003",
    paymentDate: "2026-08-01",
    amount: 500,
    method: "cash",
    status: "posted",
    allocations: [{ id: "pay-3-a1", paymentId: "pay-3", invoiceId: "inv-1", installmentId: "i1", amount: 500 }],
    receipt: { id: "rec-3", receiptNumber: "REC-2026-00380", paymentId: "pay-3", issuedAt: "2026-08-01" },
  },
  {
    id: "pay-5",
    patientId: "pat-1",
    paymentNumber: "PAY-2026-0005",
    paymentDate: "2026-08-15",
    amount: 500,
    method: "cash",
    status: "posted",
    allocations: [{ id: "pay-5-a1", paymentId: "pay-5", invoiceId: "inv-1", installmentId: "i2", amount: 500 }],
    receipt: { id: "rec-5", receiptNumber: "REC-2026-00381", paymentId: "pay-5", issuedAt: "2026-08-15" },
  },
  {
    id: "pay-6",
    patientId: "pat-1",
    paymentNumber: "PAY-2026-0006",
    paymentDate: "2026-08-22",
    amount: 500,
    method: "cash",
    status: "posted",
    allocations: [{ id: "pay-6-a1", paymentId: "pay-6", invoiceId: "inv-1", installmentId: "i3", amount: 500 }],
    receipt: { id: "rec-6", receiptNumber: "REC-2026-00382", paymentId: "pay-6", issuedAt: "2026-08-22" },
  },
];

const REVERSED_PAYMENT: Payment = {
  id: "pay-4",
  patientId: "pat-9",
  paymentNumber: "PAY-2026-0004",
  paymentDate: "2026-08-05",
  amount: 2200,
  method: "cash",
  status: "reversed",
  allocations: [{ id: "pay-4-a1", paymentId: "pay-4", invoiceId: "inv-3", installmentId: "inv-3-i1", amount: 2200 }],
  reversalReason: "Paiement annulé — erreur de saisie.",
};

const OVERDUE_INVOICE_PAT9: Invoice = {
  id: "inv-3",
  patientId: "pat-9",
  invoiceNumber: "FAC-2026-00120",
  issuedDate: "2026-07-20",
  status: "overdue",
  currency: "MAD",
  description: "Traitement",
  practitionerName: "Dr. Amal",
  totalAmount: 2200,
  paidAmount: 0,
  remainingAmount: 2200,
  lines: [],
  installments: [{ id: "inv-3-i1", invoiceId: "inv-3", sequenceNumber: 1, dueDate: "2026-08-05", amount: 2200, status: "overdue" }],
};

describe("PatientPaymentsContent", () => {
  it("renders the payment summary: total collected, count and last payment (2/4/5)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    expect(screen.getByText("Total encaissé")).toBeInTheDocument();
    expect(screen.getByText("1 500 MAD")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("22 août").length).toBeGreaterThan(0);
  });

  it("renders payment history newest-first (3)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    const references = screen.getAllByText(/REC-2026-/).map((el) => el.textContent);
    expect(references.indexOf("REC-2026-00382")).toBeLessThan(references.indexOf("REC-2026-00380"));
  });

  it("shows the cash method on each payment row (6)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    expect(screen.getAllByText("Espèces").length).toBe(3);
  });

  it("opens the payment detail drawer with receipt, amount, date, allocation and patient (7/8/9/40)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByText("REC-2026-00382"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("REC-2026-00382")).toBeInTheDocument();
    expect(within(dialog).getAllByText("500 MAD").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("22 août")).toBeInTheDocument();
    expect(within(dialog).getByText("FAC-2026-00142")).toBeInTheDocument();
    expect(within(dialog).getByText("Échéance 3")).toBeInTheDocument();
    expect(within(dialog).getByText("Ahmed El Mansouri")).toBeInTheDocument();
  });

  it("links payment detail to the related invoice, not a duplicated drawer (40)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByText("REC-2026-00382"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Voir la facture" })).toHaveAttribute("href", "/app/patients/pat-1/invoices");
  });

  it("generates and downloads a real receipt PDF from Télécharger le reçu (UI-DOCS-X)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByText("REC-2026-00382"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Télécharger le reçu" }));

    await waitFor(() => expect(generateDocumentBlob).toHaveBeenCalled());
    expect(triggerBlobDownload).toHaveBeenCalledWith(expect.any(Blob), "Recu-REC-2026-00382.pdf");
  });

  it("shows no edit/delete action anywhere for a payment (37)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByText("REC-2026-00382"));
    await screen.findByRole("dialog");
    expect(screen.queryByText(/Modifier/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Supprimer/)).not.toBeInTheDocument();
  });

  it("opens the capture dialog via Encaisser (10)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    expect(within(dialog).getByText("Ahmed El Mansouri")).toBeInTheDocument();
  });

  it("shows the outstanding balance for the default allocatable invoice (11/25)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    expect(within(dialog).getByText("Solde à payer")).toBeInTheDocument();
    expect(within(dialog).getByText("1 500 MAD")).toBeInTheDocument();
  });

  it("only offers payable invoices — excludes a fully paid invoice (12/13/26)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE, PAID_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const options = within(dialog).getByLabelText("Affecter à") as HTMLSelectElement;
    expect(within(options).getAllByRole("option").map((option) => option.textContent)).toEqual(["FAC-2026-00142"]);
  });

  it("defaults to the next unpaid installment, with the amount locked to it (14/27/28/29)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const installmentSelect = within(dialog).getByLabelText("Échéance") as HTMLSelectElement;
    expect(installmentSelect.value).toBe("i4");
    const amountInput = within(dialog).getByLabelText("Montant reçu *") as HTMLInputElement;
    expect(amountInput.value).toBe("500");
    expect(amountInput).toBeDisabled();
  });

  it("shows no allocatable invoice message and disables submit when nothing is payable (13/26)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAID_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    expect(within(dialog).getByText("Ce patient n'a aucune facture à encaisser.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Encaisser" })).toBeDisabled();
  });

  it("rejects a zero amount (16)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [LUMP_SUM_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const amountInput = within(dialog).getByLabelText("Montant reçu *");
    fireEvent.change(amountInput, { target: { value: "0" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Encaisser/ }));
    expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
  });

  it("rejects a negative amount (17)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [LUMP_SUM_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const amountInput = within(dialog).getByLabelText("Montant reçu *");
    fireEvent.change(amountInput, { target: { value: "-5" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Encaisser/ }));
    expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
  });

  it("rejects a non-numeric amount", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [LUMP_SUM_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const amountInput = within(dialog).getByLabelText("Montant reçu *");
    fireEvent.change(amountInput, { target: { value: "abc" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Encaisser/ }));
    expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
  });

  it("blocks an overpayment (15/30)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [LUMP_SUM_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const amountInput = within(dialog).getByLabelText("Montant reçu *");
    fireEvent.change(amountInput, { target: { value: "1500" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Encaisser/ }));
    expect(within(dialog).getByText("Le montant dépasse le solde à payer.")).toBeInTheDocument();
  });

  it("accepts a valid free amount within balance for an invoice with no installment schedule", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [LUMP_SUM_INVOICE], payments: [] });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    const amountInput = within(dialog).getByLabelText("Montant reçu *") as HTMLInputElement;
    expect(amountInput).not.toBeDisabled();
    fireEvent.change(amountInput, { target: { value: "400" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Encaisser/ }));

    expect(screen.getByText("Paiement enregistré.")).toBeInTheDocument();
  });

  it("captures a valid payment: closes the form, shows success, and opens the receipt (18/24/31/36)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const captureDialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    fireEvent.click(within(captureDialog).getByRole("button", { name: /Encaisser/ }));

    expect(screen.queryByRole("dialog", { name: "Encaisser un paiement" })).not.toBeInTheDocument();
    expect(screen.getByText("Paiement enregistré.")).toBeInTheDocument();
    const receiptDialog = await screen.findByRole("dialog", { name: "REC-2026-00503" });
    expect(within(receiptDialog).getAllByText("500 MAD").length).toBeGreaterThan(0);
  });

  it("adds the new payment to history and updates the local summary (19/20/21/22)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const captureDialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    fireEvent.click(within(captureDialog).getByRole("button", { name: /Encaisser/ }));

    const receiptDialog = await screen.findByRole("dialog", { name: "REC-2026-00503" });
    fireEvent.click(within(receiptDialog).getByRole("button", { name: "Fermer" }));

    expect(screen.getByText("REC-2026-00503")).toBeInTheDocument();
    expect(screen.getByText("2 000 MAD")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("updates the local outstanding balance and next default after a captured payment (23/33-34)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const captureDialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    fireEvent.click(within(captureDialog).getByRole("button", { name: /Encaisser/ }));

    const receiptDialog = await screen.findByRole("dialog", { name: "REC-2026-00503" });
    fireEvent.click(within(receiptDialog).getByRole("button", { name: "Fermer" }));

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const secondCapture = await screen.findByRole("dialog", { name: "Encaisser un paiement" });
    expect(within(secondCapture).getByText("1 000 MAD")).toBeInTheDocument();
    const installmentSelect = within(secondCapture).getByLabelText("Échéance") as HTMLSelectElement;
    expect(installmentSelect.value).toBe("i5");
  });

  it("shows a reversed payment distinctly and excludes it from the summary (33)", () => {
    renderContent("fr", { patientId: "pat-9", invoices: [OVERDUE_INVOICE_PAT9], payments: [REVERSED_PAYMENT] });

    expect(screen.getByText("Annulé")).toBeInTheDocument();
    expect(screen.getByText("Paiement annulé — erreur de saisie.")).toBeInTheDocument();
    expect(screen.getByText("0 MAD")).toBeInTheDocument();
    expect(screen.getByText("Aucun paiement")).toBeInTheDocument();
  });

  it("shows the empty state with an Encaisser action when the patient has no payments (26)", () => {
    renderContent("fr", { patientId: "pat-2", invoices: [], payments: [] });

    expect(screen.getByText("Aucun paiement pour ce patient.")).toBeInTheDocument();
    expect(screen.getByText("Les encaissements du patient apparaîtront ici.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Encaisser" })).toBeInTheDocument();
  });

  it("shows the loading skeleton without payment content (27)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1, state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Total encaissé")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action (28)", () => {
    const onRetry = vi.fn();
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1, state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les paiements du patient.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (30)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    expect(screen.getByText("Nombre de paiements")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (31/32)", () => {
    const { container } = renderContent("ar", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    expect(screen.getByText("إجمالي المحصّل")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تحصيل دفعة" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("shows no Caisse UI anywhere (33)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    await screen.findByRole("dialog", { name: "Encaisser un paiement" });

    expect(screen.queryByText(/Solde initial/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fermeture de caisse/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Écart/)).not.toBeInTheDocument();
    expect(screen.queryByText(/comptées/)).not.toBeInTheDocument();
  });

  it("offers no online payment method (34)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAYABLE_INVOICE], payments: PAYMENTS_PAT1 });

    fireEvent.click(screen.getByRole("button", { name: "Encaisser" }));
    const dialog = await screen.findByRole("dialog", { name: "Encaisser un paiement" });

    expect(within(dialog).queryByRole("combobox", { name: "Mode de paiement" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Carte/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stripe/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PayPal/)).not.toBeInTheDocument();
  });
});

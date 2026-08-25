import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { Invoice } from "@/components/domain/finance/types";
import { PatientInvoicesContent } from "./patient-invoices-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/invoices",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderContent(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientInvoicesContent> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientInvoicesContent {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const PARTIAL_INVOICE: Invoice = {
  id: "inv-partial",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00142",
  issuedDate: "2026-08-01",
  status: "partially_paid",
  currency: "MAD",
  description: "Traitement de rééducation",
  practitionerName: "Dr. Benali",
  treatmentPlanId: "tp-1",
  totalAmount: 3000,
  paidAmount: 1500,
  remainingAmount: 1500,
  lines: [{ id: "l1", label: "Traitement de rééducation — 20 séances", quantity: 1, unitPriceAmount: 3000, totalAmount: 3000 }],
  installments: [
    { id: "i1", invoiceId: "inv-partial", sequenceNumber: 1, dueDate: "2026-08-01", amount: 500, status: "paid", paidDate: "2026-08-01" },
    { id: "i2", invoiceId: "inv-partial", sequenceNumber: 2, dueDate: "2026-08-15", amount: 500, status: "paid", paidDate: "2026-08-15" },
    { id: "i3", invoiceId: "inv-partial", sequenceNumber: 3, dueDate: "2026-08-22", amount: 500, status: "paid", paidDate: "2026-08-22" },
    { id: "i4", invoiceId: "inv-partial", sequenceNumber: 4, dueDate: "2026-09-01", amount: 500, status: "due" },
    { id: "i5", invoiceId: "inv-partial", sequenceNumber: 5, dueDate: "2026-09-15", amount: 500, status: "future" },
    { id: "i6", invoiceId: "inv-partial", sequenceNumber: 6, dueDate: "2026-10-01", amount: 500, status: "future" },
  ],
};

const PAID_INVOICE: Invoice = {
  id: "inv-paid",
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
  lines: [{ id: "l2", label: "Consultation initiale", quantity: 1, unitPriceAmount: 1500, totalAmount: 1500 }],
  installments: [],
};

const CANCELLED_INVOICE: Invoice = {
  id: "inv-cancelled",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00075",
  issuedDate: "2026-06-10",
  status: "cancelled",
  currency: "MAD",
  description: "Consultation",
  practitionerName: "Dr. Benali",
  totalAmount: 400,
  paidAmount: 0,
  remainingAmount: 0,
  lines: [{ id: "l3", label: "Consultation", quantity: 1, unitPriceAmount: 400, totalAmount: 400 }],
  installments: [],
};

const OVERDUE_INVOICE: Invoice = {
  id: "inv-overdue",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00120",
  issuedDate: "2026-07-20",
  status: "overdue",
  currency: "MAD",
  description: "Traitement",
  practitionerName: "Dr. Amal",
  totalAmount: 2200,
  paidAmount: 0,
  remainingAmount: 2200,
  lines: [{ id: "l4", label: "Traitement", quantity: 1, unitPriceAmount: 2200, totalAmount: 2200 }],
  installments: [{ id: "i7", invoiceId: "inv-overdue", sequenceNumber: 1, dueDate: "2026-08-05", amount: 2200, status: "overdue" }],
};

const ALL_INVOICES = [PARTIAL_INVOICE, PAID_INVOICE, CANCELLED_INVOICE, OVERDUE_INVOICE];

describe("PatientInvoicesContent", () => {
  it("renders the financial summary (4)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    expect(screen.getByText("Total facturé")).toBeInTheDocument();
    expect(screen.getByText("6 700 MAD")).toBeInTheDocument();
  });

  it("renders the invoice list newest-first (5)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    const numbers = screen.getAllByText(/FAC-2026-/).map((el) => el.textContent);
    expect(numbers.indexOf("FAC-2026-00142")).toBeLessThan(numbers.indexOf("FAC-2026-00099"));
  });

  it("renders a partially paid invoice (6)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    expect(screen.getByText("Partiellement payée")).toBeInTheDocument();
  });

  it("renders a paid invoice (7)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAID_INVOICE] });

    expect(screen.getByText("Payée")).toBeInTheDocument();
  });

  it("renders an overdue invoice (8)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [OVERDUE_INVOICE] });

    expect(screen.getAllByText("En retard").length).toBeGreaterThan(0);
  });

  it("keeps a cancelled invoice visible under All (9)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    expect(screen.getByText("FAC-2026-00075")).toBeInTheDocument();
    expect(screen.getByText("Annulée")).toBeInTheDocument();
  });

  it("filters to due invoices (11/12)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    fireEvent.click(screen.getByRole("button", { name: "À payer" }));
    expect(screen.getByText("FAC-2026-00142")).toBeInTheDocument();
    expect(screen.queryByText("FAC-2026-00099")).not.toBeInTheDocument();
    expect(screen.queryByText("FAC-2026-00120")).not.toBeInTheDocument();
  });

  it("filters to paid invoices (13)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    fireEvent.click(screen.getByRole("button", { name: "Payées" }));
    expect(screen.getByText("FAC-2026-00099")).toBeInTheDocument();
    expect(screen.queryByText("FAC-2026-00142")).not.toBeInTheDocument();
  });

  it("filters to overdue invoices (14) and updates the result count (15)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES });

    fireEvent.click(screen.getByRole("button", { name: "En retard" }));
    expect(screen.getByText("FAC-2026-00120")).toBeInTheDocument();
    expect(screen.getByText("1 factures")).toBeInTheDocument();
  });

  it("opens the invoice drawer with lines and total/paid/remaining (16/17/18)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Traitement de rééducation — 20 séances")).toBeInTheDocument();
    expect(within(dialog).getAllByText("3 000 MAD").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("1 500 MAD").length).toBe(2);
  });

  it("renders the installment schedule with paid/due/future statuses (19/20/21/24)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("Échéancier")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Payée").length).toBe(3);
    expect(within(dialog).getByText("À payer")).toBeInTheDocument();
    expect(within(dialog).getAllByText("À venir").length).toBe(2);
  });

  it("shows an overdue installment distinctly (22/23)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [OVERDUE_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText("En retard").length).toBeGreaterThan(0);
  });

  it("represents the down payment on the first installment (26)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Acompte — payé à l'émission")).toBeInTheDocument();
  });

  it("shows no Encaisser action for a paid invoice (27)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PAID_INVOICE] });

    expect(screen.queryByRole("link", { name: "Encaisser" })).not.toBeInTheDocument();
  });

  it("navigates to the Payments tab instead of executing a payment (28)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    const link = screen.getByRole("link", { name: "Encaisser" });
    expect(link).toHaveAttribute("href", "/app/patients/pat-1/payments");
  });

  it("shows a future-feature notice for Télécharger PDF instead of generating a document (29)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Télécharger PDF" }));
    expect(screen.getByText("La génération PDF sera connectée au moteur documentaire ultérieurement.")).toBeInTheDocument();
  });

  it("links to the related treatment plan (30)", async () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Voir la facture" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Voir le traitement" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/treatments",
    );
  });

  it("shows the fully-empty state when the patient has no invoices (31)", () => {
    renderContent("fr", { patientId: "pat-2", invoices: ALL_INVOICES });

    expect(screen.getByText("Aucune facture pour ce patient.")).toBeInTheDocument();
  });

  it("shows the filtered-empty state without suggesting invoice creation (32)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: "Payées" }));
    expect(screen.getByText("Aucune facture ne correspond à ce filtre.")).toBeInTheDocument();
  });

  it("shows the loading skeleton without invoice content (33)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES, state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Total facturé")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action (34)", () => {
    const onRetry = vi.fn();
    renderContent("fr", { patientId: "pat-1", invoices: ALL_INVOICES, state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les factures du patient.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (36)", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    expect(screen.getByText("Reste à payer")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (37/38)", () => {
    const { container } = renderContent("ar", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    expect(screen.getByText("المتبقي")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض الفاتورة" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("shows a future-feature notice for + Nouvelle facture instead of a creation form", () => {
    renderContent("fr", { patientId: "pat-1", invoices: [PARTIAL_INVOICE] });

    fireEvent.click(screen.getByRole("button", { name: /Nouvelle facture/ }));
    expect(screen.getByText("La création d'une facture sera connectée au workflow métier ultérieurement.")).toBeInTheDocument();
  });
});

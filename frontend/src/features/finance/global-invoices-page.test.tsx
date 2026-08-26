import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { GlobalInvoicesPage } from "./global-invoices-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/finance/invoices",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof GlobalInvoicesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <GlobalInvoicesPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

/** Opens a specific invoice's detail drawer via the desktop table row (both table and mobile card render the same "Voir" action). */
function openInvoiceFromTable(invoiceNumber: string) {
  const table = screen.getByRole("table");
  const row = within(table).getByText(invoiceNumber).closest("tr")!;
  fireEvent.click(within(row).getByRole("button", { name: "Voir" }));
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("GlobalInvoicesPage", () => {
  it("renders the header", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Factures" })).toBeInTheDocument();
    expect(screen.getByText("Suivez les factures et montants à encaisser du cabinet.")).toBeInTheDocument();
  });

  it("renders FinanceNav with Factures marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("link", { name: "Factures" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("href", "/app/finance");
    expect(screen.getByRole("link", { name: "Caisse" })).not.toHaveAttribute("aria-current");
  });

  it("renders the financial summary for the filtered result set, reconciling with the real invoice fixtures", () => {
    renderPage("fr");

    expect(screen.getByText("Total facturé")).toBeInTheDocument();
    expect(screen.getAllByText("7 500 MAD").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3 800 MAD").length).toBeGreaterThan(0); // paid
    expect(screen.getAllByText("3 700 MAD").length).toBeGreaterThan(0); // remaining
    expect(screen.getAllByText("2 200 MAD").length).toBeGreaterThan(0); // overdue
  });

  it("renders the invoice table with patient identity, invoice reference, and operational ordering", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1); // drop header row
    const invoiceNumbers = rows.map((row) => within(row).getByText(/^FAC-2026-/).textContent);

    expect(invoiceNumbers).toEqual([
      "FAC-2026-00120", // overdue first
      "FAC-2026-00142", // partially paid
      "FAC-2026-00099", // paid, newest issued
      "FAC-2026-00098", // paid, older
      "FAC-2026-00075", // cancelled last
    ]);

    expect(screen.getAllByText("Mehdi Berrada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PAT-00289").length).toBeGreaterThan(0);
  });

  it("renders the mobile card list structurally alongside the desktop table", () => {
    renderPage("fr");

    // Exact match text node in both the table cell and the mobile card — proves both render.
    expect(screen.getAllByText("FAC-2026-00142")).toHaveLength(2);
  });

  it("derives and displays the next installment, never hardcoded", () => {
    renderPage("fr");

    expect(screen.getAllByText(/1 septembre/).length).toBeGreaterThan(0); // inv-1's next due installment
    expect(screen.getAllByText(/5 août/).length).toBeGreaterThan(0); // inv-3's overdue installment

    // Invoices with no staged schedule (inv-1b, inv-2) show the placeholder.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("searches by patient name, case-insensitively", () => {
    renderPage("fr");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "mehdi" } });

    expect(screen.getAllByText("Mehdi Berrada")).toHaveLength(2);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
    expect(screen.getByText("1 factures")).toBeInTheDocument();
  });

  it("searches by patient number", () => {
    renderPage("fr");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "PAT-00281" } });

    // Ahmed's three invoices (inv-1, inv-1b, inv-1c).
    expect(screen.getByText("3 factures")).toBeInTheDocument();
    expect(screen.queryByText("Mehdi Berrada")).not.toBeInTheDocument();
  });

  it("searches by invoice number", () => {
    renderPage("fr");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "FAC-2026-00098" } });

    expect(screen.getByText("1 factures")).toBeInTheDocument();
    expect(screen.getAllByText("Youssef Amrani").length).toBeGreaterThan(0);
  });

  it("'Partiellement payées' filter matches only partially_paid invoices", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Partiellement payées" }));

    expect(screen.getByText("1 factures")).toBeInTheDocument();
    expect(screen.getAllByText("FAC-2026-00142").length).toBeGreaterThan(0);
  });

  it("'Payées' filter matches only paid invoices", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Payées" }));

    expect(screen.getByText("2 factures")).toBeInTheDocument();
  });

  it("'En retard' filter matches only overdue invoices", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "En retard" }));

    expect(screen.getByText("1 factures")).toBeInTheDocument();
    expect(screen.getAllByText("FAC-2026-00120").length).toBeGreaterThan(0);
  });

  it("'À payer' filter yields none of the real fixtures (no issued-status invoice exists) — doubling as the filtered-empty state", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "À payer" }));

    expect(screen.getByText("Aucune facture ne correspond à ce filtre.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));

    expect(screen.getByRole("button", { name: "Toutes" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("5 factures")).toBeInTheDocument();
  });

  it("composes search and filter together", () => {
    renderPage("fr");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Ahmed" } });
    fireEvent.click(screen.getByRole("button", { name: "Payées" }));

    // Only inv-1b is both Ahmed's and paid (inv-1 is partial, inv-1c is cancelled).
    expect(screen.getByText("1 factures")).toBeInTheDocument();
    expect(screen.getAllByText("FAC-2026-00099").length).toBeGreaterThan(0);
  });

  it("opens invoice detail with lines and the installment schedule", () => {
    renderPage("fr");
    openInvoiceFromTable("FAC-2026-00142");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "FAC-2026-00142" })).toBeInTheDocument();
    expect(within(dialog).getByText("Traitement de rééducation — 20 séances")).toBeInTheDocument();
    expect(within(dialog).getByText("Échéancier")).toBeInTheDocument();
    expect(within(dialog).getByText("Échéance 4")).toBeInTheDocument();
  });

  it("provides 'Ouvrir le patient' and 'Voir les factures du patient' navigation from the detail drawer", () => {
    renderPage("fr");
    openInvoiceFromTable("FAC-2026-00142");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Ouvrir le patient" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1",
    );
    expect(within(dialog).getByRole("link", { name: "Voir les factures du patient" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/invoices",
    );
  });

  it("'Encaisser' navigates to the existing Patient 360° Payments workflow, never a duplicate payment modal", () => {
    renderPage("fr");
    openInvoiceFromTable("FAC-2026-00142");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Encaisser" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/payments",
    );

    // No payment-capture form anywhere on this page.
    expect(screen.queryByText("Montant reçu")).not.toBeInTheDocument();
    expect(screen.queryByText("Mode de paiement")).not.toBeInTheDocument();
  });

  it("a paid invoice has no Encaisser action", () => {
    renderPage("fr");
    openInvoiceFromTable("FAC-2026-00099");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("link", { name: "Encaisser" })).not.toBeInTheDocument();
  });

  it("a cancelled invoice is historical and non-actionable", () => {
    renderPage("fr");
    openInvoiceFromTable("FAC-2026-00075");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "FAC-2026-00075" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("link", { name: "Encaisser" })).not.toBeInTheDocument();
  });

  it("shows a search-empty state with a working clear-search action", () => {
    renderPage("fr");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });
    expect(screen.getByText("Aucune facture ne correspond à votre recherche.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByText("5 factures")).toBeInTheDocument();
  });

  it("shows the fully-empty state when the cabinet has no invoices at all, with no search/filter chrome", () => {
    renderPage("fr", { invoices: [] });

    expect(screen.getByText("Aucune facture pour le moment.")).toBeInTheDocument();
    expect(screen.getByText("Les factures du cabinet apparaîtront ici.")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders a shape-matched skeleton while loading", () => {
    renderPage("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders an error state with retry", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les factures.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الفواتير" })).toBeInTheDocument();
    expect(screen.getByText("متأخر")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();
  });

  it("never introduces invoice creation, accounting terminology, Caisse controls, or expense controls", () => {
    renderPage("fr");

    expect(screen.queryByRole("button", { name: /Nouvelle facture/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nouvelle facture/i })).not.toBeInTheDocument();

    for (const forbidden of ["Profit", "Marge", "Résultat net", "EBITDA", "Débit", "Crédit", "Grand livre"]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
    for (const control of [/Ouvrir la caisse/i, /Fermer la caisse/i, /Nouveau décaissement/i]) {
      expect(screen.queryByRole("button", { name: control })).not.toBeInTheDocument();
    }
  });
});

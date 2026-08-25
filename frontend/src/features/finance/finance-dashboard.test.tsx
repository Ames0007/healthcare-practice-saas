import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { FinanceDashboard } from "./finance-dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/finance",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderDashboard(initialLocale: Locale, props: React.ComponentProps<typeof FinanceDashboard> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <FinanceDashboard {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("FinanceDashboard", () => {
  it("renders the header and defaults to the 'Ce mois' period (Spec #9 Screen 24)", () => {
    renderDashboard("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Finance" })).toBeInTheDocument();
    expect(screen.getByText("Vue d'ensemble de l'activité financière du cabinet.")).toBeInTheDocument();

    const periodGroup = screen.getByRole("group", { name: "Période" });
    expect(within(periodGroup).getByRole("button", { name: "Ce mois" })).toHaveAttribute("aria-pressed", "true");
    expect(within(periodGroup).getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders all five KPIs for the default (month) period from the real invoice/payment/expense fixtures", () => {
    renderDashboard("fr");

    // "À encaisser" appears twice: the KPI label and the Receivables section heading.
    expect(screen.getAllByText("À encaisser")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "À encaisser" })).toBeInTheDocument();
    // "En retard" appears twice: the KPI label and the overdue invoice's status badge.
    expect(screen.getAllByText("En retard")).toHaveLength(2);
    expect(screen.getByText("Encaissé")).toBeInTheDocument();
    expect(screen.getByText("Décaissements")).toBeInTheDocument();
    expect(screen.getByText("Position caisse")).toBeInTheDocument();

    // Scoped to the KPI grid (immediately after the period group in the DOM) since two KPI
    // values coincidentally match a receivable row's own remaining amount elsewhere on the
    // page (inv-1's 1 500 MAD, inv-3's 2 200 MAD) — a fixture coincidence, not a bug.
    const periodGroup = screen.getByRole("group", { name: "Période" });
    const kpiGrid = periodGroup.nextElementSibling as HTMLElement;

    expect(within(kpiGrid).getByText("1 500 MAD")).toBeInTheDocument(); // collected
    expect(within(kpiGrid).getByText("3 700 MAD")).toBeInTheDocument(); // receivable
    expect(within(kpiGrid).getByText("2 200 MAD")).toBeInTheDocument(); // overdue
    expect(within(kpiGrid).getByText("900 MAD")).toBeInTheDocument(); // disbursed
    expect(within(kpiGrid).getByText("1 100 MAD")).toBeInTheDocument(); // cash position
  });

  it("switching period actually recomputes Encaissé/Décaissements/Position caisse but leaves À encaisser/En retard unchanged", () => {
    renderDashboard("fr");

    fireEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));

    expect(screen.getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-pressed", "true");

    const periodGroup = screen.getByRole("group", { name: "Période" });
    const kpiGrid = periodGroup.nextElementSibling as HTMLElement;

    expect(within(kpiGrid).getByText("0 MAD")).toBeInTheDocument(); // collected — no payment fixture is dated today
    expect(within(kpiGrid).getByText("150 MAD")).toBeInTheDocument(); // disbursed — exp-1 only
    expect(within(kpiGrid).getByText("350 MAD")).toBeInTheDocument(); // cash position — 500 + 0 - 150

    // Point-in-time balances stay the same regardless of period.
    expect(within(kpiGrid).getByText("3 700 MAD")).toBeInTheDocument();
    expect(within(kpiGrid).getByText("2 200 MAD")).toBeInTheDocument();
  });

  it("renders receivables overdue-first and excludes cancelled/paid invoices", () => {
    renderDashboard("fr");

    const receivablesSection = screen.getByRole("heading", { name: "À encaisser" }).closest("section")!;

    expect(within(receivablesSection).getByText("Mehdi Berrada")).toBeInTheDocument();
    expect(within(receivablesSection).getByText("Ahmed El Mansouri")).toBeInTheDocument();
    expect(within(receivablesSection).getByText(/FAC-2026-00120/)).toBeInTheDocument();
    expect(within(receivablesSection).getByText(/FAC-2026-00142/)).toBeInTheDocument();

    // Excluded: cancelled (inv-1c) and fully paid (inv-1b, inv-2) invoices — checked page-wide, they never render anywhere.
    expect(screen.queryByText(/FAC-2026-00075/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAC-2026-00099/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAC-2026-00098/)).not.toBeInTheDocument();

    const rows = within(receivablesSection).getAllByRole("link", { name: /Voir la facture/ });
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/FAC-2026-00120/)).toBeInTheDocument(); // overdue first
  });

  it("navigates a receivable row to the existing patient invoice workspace, never a duplicate drawer", () => {
    renderDashboard("fr");

    const overdueRow = screen.getByRole("link", { name: /Mehdi Berrada/ });
    expect(overdueRow).toHaveAttribute("href", "/app/patients/pat-9/invoices");
  });

  it("'Voir toutes les factures' navigates to the real global invoice workspace (UI-006B)", () => {
    renderDashboard("fr");

    expect(screen.getByRole("link", { name: "Voir toutes les factures" })).toHaveAttribute(
      "href",
      "/app/finance/invoices",
    );
  });

  it("renders recent payment and expense activity, newest first, excluding reversed/cancelled entries", () => {
    renderDashboard("fr");

    const activitySection = screen.getByText("Activité récente").closest("section")!;

    expect(within(activitySection).getByText("Fournitures médicales")).toBeInTheDocument();
    // 3 posted payments for Ahmed (pat-1) fall inside August: pay-3, pay-5, pay-6.
    expect(within(activitySection).getAllByText("Ahmed El Mansouri")).toHaveLength(3);

    // The reversed payment (pay-4, Mehdi, 2 200 MAD) must never appear as activity, even though it's dated inside August.
    expect(within(activitySection).queryByText("2 200 MAD")).not.toBeInTheDocument();
    expect(within(activitySection).queryByText("Matériel informatique (commande annulée)")).not.toBeInTheDocument();

    const activityRows = within(activitySection).getAllByRole("listitem");
    expect(activityRows).toHaveLength(6);
    expect(within(activityRows[0]).getByText("Fournitures médicales")).toBeInTheDocument(); // 2026-08-23, newest
  });

  it("shows a concise inline empty state when there are no outstanding invoices at all", () => {
    renderDashboard("fr", { invoices: [] });

    expect(screen.getByText("Aucun montant à encaisser.")).toBeInTheDocument();
  });

  it("shows the empty-activity state and a 500 MAD opening-only cash position when nothing moved in the period", () => {
    renderDashboard("fr", { invoices: [], payments: [], expenses: [] });

    expect(screen.getByText("Aucune activité financière pour cette période.")).toBeInTheDocument();
    expect(screen.getAllByText("0 MAD")).toHaveLength(4); // collected/receivable/overdue/disbursed all 0
    expect(screen.getByText("500 MAD")).toBeInTheDocument(); // opening cash position only
  });

  it("renders a shape-matched skeleton while loading", () => {
    renderDashboard("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders an error state with retry", () => {
    const onRetry = vi.fn();
    renderDashboard("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les informations financières.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders in Arabic with RTL direction", () => {
    renderDashboard("ar");

    expect(screen.getByRole("heading", { level: 1, name: "المالية" })).toBeInTheDocument();
    // "قيد التحصيل" appears twice: the KPI label and the Receivables section heading.
    expect(screen.getAllByText("قيد التحصيل")).toHaveLength(2);
    // Patient names are Unicode exactly as entered (CLAUDE.md §40) — never translated per locale.
    expect(screen.getByText("Mehdi Berrada")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();
  });

  it("never introduces accounting terminology, Caisse operations, or expense-entry controls", () => {
    renderDashboard("fr");

    for (const forbidden of ["Profit", "Marge", "Résultat net", "EBITDA", "Débit", "Crédit", "Grand livre"]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
    for (const control of [/Ouvrir la caisse/i, /Fermer la caisse/i, /Nouveau décaissement/i, /Encaisser/i]) {
      expect(screen.queryByRole("button", { name: control })).not.toBeInTheDocument();
    }
  });
});

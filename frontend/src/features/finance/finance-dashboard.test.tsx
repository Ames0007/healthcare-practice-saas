import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { CashSession } from "@/components/domain/finance/types";
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

const OPEN_SESSION: CashSession = {
  id: "cs-2026-08-23",
  businessDate: "2026-08-23",
  status: "open",
  openedAt: "08:15",
  openedBy: "Meryem Bakkali",
  openingBalance: 500,
};

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("FinanceDashboard", () => {
  it("renders the header, FinanceNav (Vue d'ensemble active) and defaults to the 'Ce mois' period", () => {
    renderDashboard("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Finance" })).toBeInTheDocument();
    expect(screen.getByText("Vue d'ensemble de l'activité financière du cabinet.")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Factures" })).toHaveAttribute("href", "/app/finance/invoices");
    expect(screen.getByRole("link", { name: "Caisse" })).toHaveAttribute("href", "/app/finance/caisse");
    expect(screen.getByRole("link", { name: "Décaissements" })).toHaveAttribute("href", "/app/finance/expenses");

    const periodGroup = screen.getByRole("group", { name: "Période" });
    expect(within(periodGroup).getByRole("button", { name: "Ce mois" })).toHaveAttribute("aria-pressed", "true");
    expect(within(periodGroup).getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the four core financial KPIs for the default (month) period, without a 'Position caisse' projection", () => {
    renderDashboard("fr", { caisseSession: null });

    expect(screen.getByText("Encaissé")).toBeInTheDocument();
    // "En retard" appears twice: the KPI label and the overdue invoice's status badge.
    expect(screen.getAllByText("En retard")).toHaveLength(2);
    // "Décaissements" appears twice: the FinanceNav tab and the KPI label.
    expect(screen.getAllByText("Décaissements")).toHaveLength(2);
    // "À encaisser" is the KPI label only now — the receivables section heading changed to "À traiter".
    expect(screen.getByText("À encaisser")).toBeInTheDocument();
    expect(screen.queryByText("Position caisse")).not.toBeInTheDocument();
    expect(screen.queryByText(/Projection prototype/)).not.toBeInTheDocument();

    const periodGroup = screen.getByRole("group", { name: "Période" });
    const kpiGrid = periodGroup.nextElementSibling as HTMLElement;

    expect(within(kpiGrid).getByText("1 500 MAD")).toBeInTheDocument(); // collected
    expect(within(kpiGrid).getByText("3 700 MAD")).toBeInTheDocument(); // receivable
    expect(within(kpiGrid).getByText("2 200 MAD")).toBeInTheDocument(); // overdue
    expect(within(kpiGrid).getByText("900 MAD")).toBeInTheDocument(); // disbursed
  });

  it("switching period recomputes Encaissé/Décaissements but leaves À encaisser/En retard unchanged", () => {
    renderDashboard("fr", { caisseSession: null });

    fireEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));
    expect(screen.getByRole("button", { name: "Aujourd'hui" })).toHaveAttribute("aria-pressed", "true");

    const periodGroup = screen.getByRole("group", { name: "Période" });
    const kpiGrid = periodGroup.nextElementSibling as HTMLElement;

    expect(within(kpiGrid).getByText("0 MAD")).toBeInTheDocument(); // collected — no payment fixture is dated today
    expect(within(kpiGrid).getByText("150 MAD")).toBeInTheDocument(); // disbursed — exp-1 only

    // Point-in-time balances stay the same regardless of period.
    expect(within(kpiGrid).getByText("3 700 MAD")).toBeInTheDocument();
    expect(within(kpiGrid).getByText("2 200 MAD")).toBeInTheDocument();
  });

  it("renders the real open-Caisse summary derived from Caisse's own calculations, with a link to /app/finance/caisse", () => {
    renderDashboard("fr", { caisseSession: OPEN_SESSION, payments: [], expenses: [] });

    const caisseSection = screen.getByText("Caisse aujourd'hui").closest("section")!;
    expect(within(caisseSection).getByText("Ouverte")).toBeInTheDocument();
    expect(within(caisseSection).getByText("Solde initial")).toBeInTheDocument();
    expect(within(caisseSection).getByText("Encaissements")).toBeInTheDocument();
    expect(within(caisseSection).getByText("Décaissements")).toBeInTheDocument();
    expect(within(caisseSection).getByText("Solde théorique")).toBeInTheDocument();
    // Opening (500) and theoretical (500 + 0 - 0) both render 500 MAD.
    expect(within(caisseSection).getAllByText("500 MAD")).toHaveLength(2);
    expect(within(caisseSection).getByText("08:15")).toBeInTheDocument();
    expect(within(caisseSection).getByText("Meryem Bakkali")).toBeInTheDocument();

    const caisseLink = within(caisseSection).getByRole("link", { name: "Voir la caisse" });
    expect(caisseLink).toHaveAttribute("href", "/app/finance/caisse");
  });

  it("derives the open-Caisse incoming/outgoing/theoretical from the same buildCashMovements pipeline as UI-006C", () => {
    renderDashboard("fr", { caisseSession: OPEN_SESSION });
    // Live default payments/expenses: no payment fixture on 2026-08-23, exp-1 (150 MAD) is.
    const caisseSection = screen.getByText("Caisse aujourd'hui").closest("section")!;

    expect(within(caisseSection).getByText("0 MAD")).toBeInTheDocument(); // incoming
    expect(within(caisseSection).getByText("150 MAD")).toBeInTheDocument(); // outgoing
    expect(within(caisseSection).getByText("350 MAD")).toBeInTheDocument(); // theoretical: 500 + 0 - 150
  });

  it("renders the closed-Caisse note with a link to /app/finance/caisse when no session is open", () => {
    renderDashboard("fr", { caisseSession: null });

    const caisseSection = screen.getByText("Caisse aujourd'hui").closest("section")!;
    expect(within(caisseSection).getByText("Fermée")).toBeInTheDocument();
    expect(within(caisseSection).getByText("La caisse n'est pas ouverte.")).toBeInTheDocument();
    expect(within(caisseSection).queryByText("Solde théorique")).not.toBeInTheDocument();

    const caisseLink = within(caisseSection).getByRole("link", { name: "Voir la caisse" });
    expect(caisseLink).toHaveAttribute("href", "/app/finance/caisse");
  });

  it("renders 'À traiter' with an overdue-vs-to-collect summary derived from the receivables read model", () => {
    renderDashboard("fr", { caisseSession: null });

    const receivablesSection = screen.getByRole("heading", { name: "À traiter" }).closest("section")!;

    // inv-3 (overdue, 2 200 MAD) and inv-1 (partially_paid/to-collect, 1 500 MAD) — see aggregations.test.ts.
    // Counts are not pluralized (matches every other "{{count}} X" string in this codebase).
    expect(within(receivablesSection).getByText("1 factures en retard")).toBeInTheDocument();
    expect(within(receivablesSection).getByText("1 factures à encaisser")).toBeInTheDocument();
    expect(within(receivablesSection).getByText("Mehdi Berrada")).toBeInTheDocument();
    expect(within(receivablesSection).getByText("Ahmed El Mansouri")).toBeInTheDocument();
    expect(within(receivablesSection).getByText(/FAC-2026-00120/)).toBeInTheDocument();
    expect(within(receivablesSection).getByText(/FAC-2026-00142/)).toBeInTheDocument();

    // Excluded: cancelled (inv-1c) and fully paid (inv-1b, inv-2) invoices — checked page-wide.
    expect(screen.queryByText(/FAC-2026-00075/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAC-2026-00099/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FAC-2026-00098/)).not.toBeInTheDocument();

    const rows = within(receivablesSection).getAllByRole("link", { name: /Voir la facture/ });
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/FAC-2026-00120/)).toBeInTheDocument(); // overdue first
  });

  it("navigates a receivable row to the existing patient invoice workspace, never a duplicate drawer", () => {
    renderDashboard("fr", { caisseSession: null });

    const overdueRow = screen.getByRole("link", { name: /Mehdi Berrada/ });
    expect(overdueRow).toHaveAttribute("href", "/app/patients/pat-9/invoices");
  });

  it("'Voir toutes les factures' navigates to the real global invoice workspace (UI-006B)", () => {
    renderDashboard("fr", { caisseSession: null });

    expect(screen.getByRole("link", { name: "Voir toutes les factures" })).toHaveAttribute(
      "href",
      "/app/finance/invoices",
    );
  });

  it("renders recent payment and expense activity, newest first, and navigates payment/expense rows", () => {
    renderDashboard("fr", { caisseSession: null });

    const activitySection = screen.getByText("Activité récente").closest("section")!;

    expect(within(activitySection).getByText("Fournitures médicales")).toBeInTheDocument();
    expect(within(activitySection).getAllByText("Ahmed El Mansouri")).toHaveLength(3);

    // The reversed payment (pay-4, Mehdi, 2 200 MAD) must never appear as activity.
    expect(within(activitySection).queryByText("2 200 MAD")).not.toBeInTheDocument();
    expect(within(activitySection).queryByText("Matériel informatique (commande annulée)")).not.toBeInTheDocument();

    const activityRows = within(activitySection).getAllByRole("listitem");
    expect(activityRows).toHaveLength(6);
    expect(within(activityRows[0]).getByText("Fournitures médicales")).toBeInTheDocument(); // 2026-08-23, newest

    // Expense row navigates to the Décaissements workspace, never a duplicate detail system.
    const expenseLink = within(activityRows[0]).getByRole("link");
    expect(expenseLink).toHaveAttribute("href", "/app/finance/expenses");

    // A payment row navigates to the existing patient Paiements route.
    const paymentRow = within(activitySection).getAllByText("Ahmed El Mansouri")[0].closest("li")!;
    expect(within(paymentRow).getByRole("link")).toHaveAttribute("href", "/app/patients/pat-1/payments");
  });

  it("shows a concise inline empty state when there are no outstanding invoices at all", () => {
    renderDashboard("fr", { invoices: [], caisseSession: null });

    expect(screen.getByText("Aucun montant à encaisser.")).toBeInTheDocument();
  });

  it("shows the empty-activity state when nothing moved in the period", () => {
    renderDashboard("fr", { invoices: [], payments: [], expenses: [], caisseSession: null });

    expect(screen.getByText("Aucune activité financière pour cette période.")).toBeInTheDocument();
    expect(screen.getAllByText("0 MAD").length).toBeGreaterThan(0); // collected/receivable/overdue/disbursed all 0
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
    renderDashboard("ar", { caisseSession: null });

    expect(screen.getByRole("heading", { level: 1, name: "المالية" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "نظرة عامة" })).toHaveAttribute("aria-current", "page");
    // Patient names are Unicode exactly as entered (CLAUDE.md §40) — never translated per locale.
    expect(screen.getByText("Mehdi Berrada")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();
  });

  it("never introduces accounting terminology, Caisse operations, or expense-entry controls", () => {
    renderDashboard("fr", { caisseSession: null });

    for (const forbidden of ["Profit", "Marge", "Résultat net", "EBITDA", "Débit", "Crédit", "Grand livre"]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
    for (const control of [/Ouvrir la caisse/i, /Fermer la caisse/i, /Nouveau décaissement/i, /Encaisser/i]) {
      expect(screen.queryByRole("button", { name: control })).not.toBeInTheDocument();
    }
  });
});

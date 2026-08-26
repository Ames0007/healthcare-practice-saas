import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { CabinetExpense, CashSession, Payment } from "@/components/domain/finance/types";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { CaissePage } from "./caisse-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/finance/caisse",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof CaissePage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <CaissePage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("CaissePage", () => {
  it("renders the header", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Caisse" })).toBeInTheDocument();
  });

  it("renders FinanceNav with Caisse marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("link", { name: "Caisse" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("href", "/app/finance");
    expect(screen.getByRole("link", { name: "Décaissements" })).not.toHaveAttribute("aria-current");
  });

  it("renders CLOSED with an opening-balance input and no movements/summary", () => {
    renderPage("fr", { initialSession: null });

    expect(screen.getByText("Fermée")).toBeInTheDocument();
    expect(screen.getByText("La caisse doit être ouverte avant d'enregistrer les mouvements.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Solde initial/)).toHaveValue("500");
    expect(screen.getByRole("button", { name: "Ouvrir la caisse" })).toBeInTheDocument();
    expect(screen.queryByText("Mouvements")).not.toBeInTheDocument();
  });

  it("rejects a negative opening balance and stays closed", () => {
    renderPage("fr", { initialSession: null });

    fireEvent.change(screen.getByLabelText(/Solde initial/), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la caisse" }));

    expect(screen.getByText("Montant invalide.")).toBeInTheDocument();
    expect(screen.getByText("Fermée")).toBeInTheDocument();
  });

  it("accepts a zero opening balance and opens the register with success feedback", () => {
    renderPage("fr", { initialSession: null, payments: [], expenses: [] });

    fireEvent.change(screen.getByLabelText(/Solde initial/), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la caisse" }));

    expect(screen.getByText("Ouverte")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Caisse ouverte.");
    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.getByText("Meryem Bakkali")).toBeInTheDocument();
  });

  it("opens with a custom valid opening balance and represents it in the summary", () => {
    renderPage("fr", { initialSession: null, payments: [], expenses: [] });

    fireEvent.change(screen.getByLabelText(/Solde initial/), { target: { value: "700" } });
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la caisse" }));

    // Opening (700) and theoretical (700 + 0 - 0) both render 700 MAD, on their own cards.
    expect(screen.getAllByText("700 MAD")).toHaveLength(2);
  });

  it("prevents opening a second session while one is already open", () => {
    renderPage("fr"); // default live session is already open

    expect(screen.getByText("Ouverte")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ouvrir la caisse" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Solde initial/)).not.toBeInTheDocument();
  });

  it("renders opened-at, opened-by, opening balance, incoming/outgoing/theoretical for a combined payment+expense day", () => {
    const businessDate = "2026-08-22";
    const session: CashSession = {
      id: "cs-test",
      businessDate,
      status: "open",
      openedAt: "08:15",
      openedBy: "Meryem Bakkali",
      openingBalance: 500,
    };
    const syntheticExpense: CabinetExpense = {
      id: "exp-test",
      date: businessDate,
      label: "Fournitures test",
      category: "supplies",
      amount: 200,
      status: "posted",
    };

    renderPage("fr", {
      initialSession: session,
      payments: getPaymentsMockData(), // includes pay-6, 500 MAD, Ahmed, dated 2026-08-22
      expenses: [syntheticExpense],
    });

    expect(screen.getByText("Ouverte")).toBeInTheDocument();
    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.getByText("Meryem Bakkali")).toBeInTheDocument();

    // Movement row amounts always carry a +/− sign prefix (e.g. "+500 MAD"), so these
    // exact, sign-free strings are unambiguous: they can only be summary-card values.
    // "500 MAD" appears twice here: Solde initial (500) and Encaissements (500, pay-6).
    expect(screen.getAllByText("500 MAD")).toHaveLength(2);
    expect(screen.getByText("200 MAD")).toBeInTheDocument(); // outgoing
    expect(screen.getByText("800 MAD")).toBeInTheDocument(); // theoretical: 500 + 500 - 200

    // Both movement types render, newest synthetic time first: the expense's own
    // deterministic time sorts after the payment's (see calculations.test.ts).
    const movementItems = screen.getAllByRole("listitem");
    expect(movementItems).toHaveLength(2);
    expect(within(movementItems[0]).getByText("Ahmed El Mansouri")).toBeInTheDocument();
    expect(within(movementItems[0]).getByText(/REC-2026-00382/)).toBeInTheDocument();
    expect(within(movementItems[1]).getByText("Fournitures test")).toBeInTheDocument();

    // Payment movement navigates to the existing patient Payments surface.
    expect(screen.getByRole("link", { name: /Ahmed El Mansouri/ })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/payments",
    );
  });

  it("excludes a reversed payment on the session's own business date", () => {
    const businessDate = "2026-08-05";
    const reversed: Payment = {
      id: "p-rev",
      patientId: "pat-9",
      paymentNumber: "PAY-2026-9999",
      paymentDate: businessDate,
      amount: 2200,
      method: "cash",
      status: "reversed",
      allocations: [],
      reversalReason: "test",
    };

    renderPage("fr", {
      initialSession: { id: "cs-test", businessDate, status: "open", openingBalance: 500 },
      payments: [reversed],
      expenses: [],
    });

    expect(screen.getByText("Aucun mouvement de caisse aujourd'hui.")).toBeInTheDocument();
    expect(screen.queryByText("2 200 MAD")).not.toBeInTheDocument();
  });

  it("excludes a cancelled expense (real exp-5 fixture) and shows the open/no-movement state with the summary still rendered", () => {
    renderPage("fr", {
      initialSession: { id: "cs-test", businessDate: "2026-08-18", status: "open", openingBalance: 500 },
      payments: [],
      expenses: getExpensesMockData(), // exp-5 is dated 2026-08-18 but cancelled
    });

    expect(screen.getByText("Aucun mouvement de caisse aujourd'hui.")).toBeInTheDocument();
    // Summary keeps rendering — the page is not replaced by a full-page empty state (§44).
    expect(screen.getByText("Solde théorique")).toBeInTheDocument();
    expect(screen.getAllByText("500 MAD").length).toBeGreaterThan(0); // opening === theoretical, nothing moved
  });

  it("'Fermer la caisse' shows the UI-006E future-feature notice and never actually closes the session", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Fermer la caisse" }));

    expect(screen.getByRole("status")).toHaveTextContent("La clôture de caisse sera implémentée dans UI-006E.");
    expect(screen.getByText("Ouverte")).toBeInTheDocument(); // still open, no state mutation
  });

  it("renders a shape-matched skeleton while loading", () => {
    renderPage("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders an error state with retry", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger la caisse.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الصندوق" })).toBeInTheDocument();
    expect(screen.getByText("مفتوح")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();
  });

  it("never introduces manual movement creation, payment capture, expense entry, cash counting, reconciliation, a functional close, or accounting terminology", () => {
    renderPage("fr");

    for (const control of [/\+ Mouvement/i, /\+ Encaissement/i, /\+ Décaissement/i, /Ajouter une dépense/i, /Nouveau décaissement/i]) {
      expect(screen.queryByRole("button", { name: control })).not.toBeInTheDocument();
    }
    for (const forbidden of [
      "Montant reçu",
      "Mode de paiement",
      "Espèces comptées",
      "Montant compté",
      "Écart",
      "Solde réel",
      "Profit",
      "Marge",
      "EBITDA",
      "Débit",
      "Crédit",
      "Grand livre",
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });
});

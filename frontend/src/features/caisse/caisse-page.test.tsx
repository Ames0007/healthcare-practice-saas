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

  describe("closing/reconciliation", () => {
    // opening 500 + incoming 500 (pay-6) - outgoing 200 (syntheticExpense) = 800 theoretical.
    const businessDate = "2026-08-22";
    const openSession: CashSession = {
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

    function renderOpenCaisse() {
      return renderPage("fr", {
        initialSession: openSession,
        payments: getPaymentsMockData(),
        expenses: [syntheticExpense],
      });
    }

    function openCashCountDialog() {
      fireEvent.click(screen.getByRole("button", { name: "Fermer la caisse" }));
      return screen.getByRole("dialog", { name: "Clôture de caisse" });
    }

    it("'Fermer la caisse' opens the real closing dialog instead of closing immediately", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      expect(within(dialog).getByText("800 MAD")).toBeInTheDocument(); // Solde théorique
      expect(screen.getByText("Ouverte")).toBeInTheDocument(); // no state mutation yet
    });

    it("requires a physical count and rejects a negative or invalid one", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(within(dialog).getByText("Ce champ est requis.")).toBeInTheDocument();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "-10" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
    });

    it("accepts a zero physical count (valid per §12)", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "0" } });
      expect(within(dialog).getByText(/^-800 MAD$/)).toBeInTheDocument();
    });

    it("shows the balanced state and no reason field when the physical count matches the theoretical balance", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "800" } });

      expect(within(dialog).getByText("0 MAD")).toBeInTheDocument();
      expect(within(dialog).getByText("La caisse est équilibrée.")).toBeInTheDocument();
      expect(within(dialog).queryByLabelText(/Justification/)).not.toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(screen.getByRole("alertdialog", { name: "Fermer la caisse ?" })).toBeInTheDocument();
    });

    it("computes the difference as physical minus theoretical, not the reverse (§13 — CRITICAL)", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "750" } });
      expect(within(dialog).getByText("-50 MAD")).toBeInTheDocument(); // 750 - 800

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "850" } });
      expect(within(dialog).getByText("+50 MAD")).toBeInTheDocument(); // 850 - 800
    });

    it("requires a reason for a shortage and blocks Continuer until provided", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "750" } });
      expect(within(dialog).getByText("Écart de caisse constaté.")).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(within(dialog).getByText("Ce champ est requis.")).toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Fermer la caisse ?" })).not.toBeInTheDocument();

      fireEvent.change(within(dialog).getByLabelText(/Justification/), { target: { value: "Erreur de rendu monnaie." } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(screen.getByRole("alertdialog", { name: "Fermer la caisse ?" })).toBeInTheDocument();
    });

    it("also requires a reason for an overage and never treats it as a success state", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();

      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "850" } });
      const badge = within(dialog).getByText("Écart de caisse constaté.").closest("span")!;
      expect(badge.className).not.toMatch(/success/);

      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      expect(within(dialog).getByText("Ce champ est requis.")).toBeInTheDocument();
    });

    it("the confirmation step shows théorique/compté/écart and the consequence notice, and cancel discards it without mutating", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();
      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "750" } });
      fireEvent.change(within(dialog).getByLabelText(/Justification/), { target: { value: "Erreur de caisse." } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));

      const confirm = screen.getByRole("alertdialog", { name: "Fermer la caisse ?" });
      expect(within(confirm).getByText("800 MAD")).toBeInTheDocument();
      expect(within(confirm).getByText("750 MAD")).toBeInTheDocument();
      expect(within(confirm).getByText("-50 MAD")).toBeInTheDocument();
      expect(within(confirm).getByText("Erreur de caisse.")).toBeInTheDocument();
      expect(
        within(confirm).getByText("Une fois clôturée, cette session de caisse deviendra en lecture seule."),
      ).toBeInTheDocument();

      fireEvent.click(within(confirm).getByRole("button", { name: "Annuler" }));
      expect(screen.queryByRole("dialog", { name: "Fermer la caisse ?" })).not.toBeInTheDocument();
      expect(screen.getByText("Ouverte")).toBeInTheDocument(); // still open, no mutation
    });

    it("confirming closes the session, shows a read-only closing summary, and removes the closing/opening actions", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();
      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "750" } });
      fireEvent.change(within(dialog).getByLabelText(/Justification/), { target: { value: "Erreur de caisse." } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      const confirm = screen.getByRole("alertdialog", { name: "Fermer la caisse ?" });
      fireEvent.click(within(confirm).getByRole("button", { name: "Fermer la caisse" }));

      expect(screen.getByRole("status")).toHaveTextContent("Caisse clôturée.");
      // "Fermée" appears in both the header StatusBadge and (implicitly) nowhere else duplicated.
      expect(screen.getByText("Fermée")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Fermer la caisse" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ouvrir la caisse" })).not.toBeInTheDocument(); // never reopens

      // Read-only recap: opened + closed metadata, frozen closing figures, justification.
      expect(screen.getByText("08:15")).toBeInTheDocument();
      expect(screen.getAllByText("Meryem Bakkali").length).toBeGreaterThan(0);
      expect(screen.getByText("18:35")).toBeInTheDocument();
      expect(screen.getByText("750 MAD")).toBeInTheDocument();
      expect(screen.getByText("-50 MAD")).toBeInTheDocument();
      expect(screen.getByText("Erreur de caisse.")).toBeInTheDocument();

      // Movement history is still shown, read-only.
      expect(screen.getByText("Mouvements")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    });

    it("closing a balanced session omits the justification section entirely", () => {
      renderOpenCaisse();
      const dialog = openCashCountDialog();
      fireEvent.change(within(dialog).getByLabelText(/Espèces comptées/), { target: { value: "800" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Continuer" }));
      const confirm = screen.getByRole("alertdialog", { name: "Fermer la caisse ?" });
      fireEvent.click(within(confirm).getByRole("button", { name: "Fermer la caisse" }));

      expect(screen.getByText("Fermée")).toBeInTheDocument();
      expect(screen.queryByText("Justification")).not.toBeInTheDocument();
    });
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

  it("renders the closing flow and the closed summary in Arabic with RTL direction", () => {
    // Same known-balanced scenario as the FR closing/reconciliation suite (theoretical = 800).
    const businessDate = "2026-08-22";
    renderPage("ar", {
      initialSession: {
        id: "cs-test",
        businessDate,
        status: "open",
        openedAt: "08:15",
        openedBy: "Meryem Bakkali",
        openingBalance: 500,
      },
      payments: getPaymentsMockData(),
      expenses: [
        { id: "exp-test", date: businessDate, label: "Fournitures test", category: "supplies", amount: 200, status: "posted" },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "إغلاق الصندوق" }));
    const dialog = screen.getByRole("dialog", { name: "إغلاق الصندوق" });
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();

    fireEvent.change(within(dialog).getByLabelText(/النقد المعدود/), { target: { value: "800" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "متابعة" }));

    const confirm = screen.getByRole("alertdialog", { name: "إغلاق الصندوق؟" });
    fireEvent.click(within(confirm).getByRole("button", { name: "إغلاق الصندوق" }));

    expect(screen.getByText("مغلق")).toBeInTheDocument();
    expect(screen.getByText("وقت الإغلاق")).toBeInTheDocument();
    expect(screen.getByText("أُغلق بواسطة")).toBeInTheDocument();
  });

  it("never introduces manual movement creation, payment capture, expense entry, or accounting terminology on the default open view (before opening the closing dialog)", () => {
    renderPage("fr");

    for (const control of [/\+ Mouvement/i, /\+ Encaissement/i, /\+ Décaissement/i, /Ajouter une dépense/i, /Nouveau décaissement/i]) {
      expect(screen.queryByRole("button", { name: control })).not.toBeInTheDocument();
    }
    // Closing/reconciliation UI (UI-006E) is real now, but only appears once "Fermer la
    // caisse" is actually clicked — the default view stays exactly as bounded as before.
    for (const notYetVisible of ["Espèces comptées", "Écart", "Solde réel", "Comptage physique"]) {
      expect(screen.queryByText(notYetVisible)).not.toBeInTheDocument();
    }
    for (const forbidden of [
      "Montant reçu",
      "Mode de paiement",
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

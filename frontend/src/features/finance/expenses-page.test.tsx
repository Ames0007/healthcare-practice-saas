import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { CabinetExpense, CashSession } from "@/components/domain/finance/types";
import { ExpensesPage } from "./expenses-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/finance/expenses",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ExpensesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ExpensesPage {...props} />
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

function openNewExpenseDialog() {
  // The "+ Nouveau décaissement" action can render twice (header + empty-state)
  // when there are no décaissements yet today — both open the same dialog.
  fireEvent.click(screen.getAllByRole("button", { name: "+ Nouveau décaissement" })[0]);
  return screen.findByRole("dialog", { name: "Nouveau décaissement" });
}

async function fillAndSubmit(overrides: { category?: string; amount?: string; description?: string; file?: File } = {}) {
  const dialog = await openNewExpenseDialog();

  fireEvent.change(within(dialog).getByLabelText(/Catégorie/), { target: { value: overrides.category ?? "supplies" } });
  fireEvent.change(within(dialog).getByLabelText(/Montant/), { target: { value: overrides.amount ?? "350" } });
  fireEvent.change(within(dialog).getByLabelText(/Description/), {
    target: { value: overrides.description ?? "Papeterie cabinet" },
  });
  if (overrides.file) {
    fireEvent.change(within(dialog).getByLabelText("Justificatif"), { target: { files: [overrides.file] } });
  }
  fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

  return dialog;
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ExpensesPage", () => {
  it("renders the header and today's expense summary", () => {
    renderPage("fr", { initialSession: OPEN_SESSION });

    expect(screen.getByRole("heading", { level: 1, name: "Décaissements" })).toBeInTheDocument();
    expect(screen.getByText("Total aujourd'hui")).toBeInTheDocument();
    // exp-1 (150 MAD, 2026-08-23) is the only live fixture dated today — "150 MAD"
    // appears twice: the summary total and the row's own amount.
    expect(screen.getAllByText("150 MAD")).toHaveLength(2);
  });

  it("renders the existing today's expense history with category/description/amount", () => {
    renderPage("fr", { initialSession: OPEN_SESSION });

    expect(screen.getByText("Fournitures médicales")).toBeInTheDocument();
    expect(screen.getByText("Fournitures")).toBeInTheDocument();
  });

  it("excludes a cancelled expense from today's total even when dated today", () => {
    const expenses: CabinetExpense[] = [
      { id: "exp-a", date: "2026-08-23", time: "09:00", label: "Posted", category: "other", amount: 100, status: "posted" },
      { id: "exp-b", date: "2026-08-23", time: "09:05", label: "Cancelled", category: "other", amount: 999, status: "cancelled" },
    ];
    renderPage("fr", { initialSession: OPEN_SESSION, expenses });

    // "100 MAD" appears twice: the summary total and the sole surviving row.
    expect(screen.getAllByText("100 MAD")).toHaveLength(2);
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
    expect(screen.queryByText("999 MAD")).not.toBeInTheDocument();
  });

  it("orders today's expenses newest-first", () => {
    const expenses: CabinetExpense[] = [
      { id: "exp-a", date: "2026-08-23", time: "09:00", label: "Earlier", category: "other", amount: 100, status: "posted" },
      { id: "exp-b", date: "2026-08-23", time: "11:00", label: "Later", category: "other", amount: 200, status: "posted" },
    ];
    renderPage("fr", { initialSession: OPEN_SESSION, expenses });

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]).getByText("Later")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Earlier")).toBeInTheDocument();
  });

  it("shows the '+ Nouveau décaissement' action and allows opening the form when Caisse is open", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION });
    await openNewExpenseDialog();
    expect(screen.getByRole("dialog", { name: "Nouveau décaissement" })).toBeInTheDocument();
  });

  it("blocks expense creation and shows closed guidance with a link to Caisse when the register is closed", () => {
    renderPage("fr", { initialSession: null, expenses: [] });

    expect(screen.queryByRole("button", { name: "+ Nouveau décaissement" })).not.toBeInTheDocument();
    expect(screen.getByText("La caisse doit être ouverte avant d'enregistrer un décaissement.")).toBeInTheDocument();
    const caisseLinks = screen.getAllByRole("link", { name: "Voir la caisse" });
    expect(caisseLinks.length).toBeGreaterThan(0);
    for (const link of caisseLinks) {
      expect(link).toHaveAttribute("href", "/app/finance/caisse");
    }
  });

  it("requires category, amount and description", async () => {
    const dialog = await (async () => {
      renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
      const d = await openNewExpenseDialog();
      fireEvent.click(within(d).getByRole("button", { name: "Enregistrer" }));
      return d;
    })();

    expect(within(dialog).getAllByText("Ce champ est requis.")).toHaveLength(3);
  });

  it("rejects a zero amount", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    const dialog = await fillAndSubmit({ amount: "0" });
    expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
  });

  it("rejects a negative amount", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    const dialog = await fillAndSubmit({ amount: "-10" });
    expect(within(dialog).getByText("Montant invalide.")).toBeInTheDocument();
  });

  it("rejects a disallowed supporting-document MIME type", async () => {
    const file = new File(["x"], "malware.exe", { type: "application/x-msdownload" });
    const dialog = await (async () => {
      renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
      return fillAndSubmit({ file });
    })();

    expect(within(dialog).getByText("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG.")).toBeInTheDocument();
  });

  it("succeeds without a supporting document (optional)", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    await fillAndSubmit();

    expect(screen.queryByRole("dialog", { name: "Nouveau décaissement" })).not.toBeInTheDocument();
    expect(screen.getByText("Décaissement enregistré.")).toBeInTheDocument();
  });

  it("adds exactly one new row and updates the local total immediately on valid submit", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });

    expect(screen.getByText("0 MAD")).toBeInTheDocument();
    await fillAndSubmit({ amount: "350", description: "Papeterie cabinet" });

    expect(screen.getByText("Papeterie cabinet")).toBeInTheDocument();
    // "350 MAD" appears twice: the updated summary total and the new row's own amount.
    expect(screen.getAllByText("350 MAD")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("attributes the newly created expense to the open session's own openedBy", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    await fillAndSubmit();

    fireEvent.click(screen.getByText("Papeterie cabinet"));
    const drawer = await screen.findByRole("dialog", { name: "Décaissement" });
    expect(within(drawer).getByText("Meryem Bakkali")).toBeInTheDocument();
  });

  it("opens a read-only detail drawer with supporting-document metadata and a future-only download", async () => {
    const file = new File(["x"], "recu-papeterie.pdf", { type: "application/pdf" });
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    await fillAndSubmit({ file });

    fireEvent.click(screen.getByText("Papeterie cabinet"));
    const drawer = await screen.findByRole("dialog", { name: "Décaissement" });

    expect(within(drawer).getByText("Fournitures")).toBeInTheDocument();
    expect(within(drawer).getByText("Papeterie cabinet")).toBeInTheDocument();
    expect(within(drawer).getByText("recu-papeterie.pdf")).toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Télécharger le justificatif" }));
    expect(
      screen.getByText("Le téléchargement sécurisé sera connecté au stockage documentaire ultérieurement."),
    ).toBeInTheDocument();
  });

  it("shows 'no supporting document' when none was attached", async () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });
    await fillAndSubmit();

    fireEvent.click(screen.getByText("Papeterie cabinet"));
    const drawer = await screen.findByRole("dialog", { name: "Décaissement" });
    expect(within(drawer).getByText("Aucun justificatif.")).toBeInTheDocument();
  });

  it("renders an empty state for no décaissements today, with a create action while Caisse is open", () => {
    renderPage("fr", { initialSession: OPEN_SESSION, expenses: [] });

    expect(screen.getByText("Aucun décaissement aujourd'hui.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "+ Nouveau décaissement" }).length).toBeGreaterThan(0);
  });

  it("renders the empty state without a create action while Caisse is closed", () => {
    renderPage("fr", { initialSession: null, expenses: [] });

    expect(screen.getByText("Aucun décaissement aujourd'hui.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Nouveau décaissement" })).not.toBeInTheDocument();
  });

  it("renders a shape-matched skeleton while loading", () => {
    renderPage("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders an error state with retry", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les décaissements.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar", { initialSession: OPEN_SESSION });

    expect(screen.getByRole("heading", { level: 1, name: "المصروفات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).not.toBeNull();
  });

  it("never introduces supplier/procurement, accounting or Caisse-closing/reconciliation UI", () => {
    renderPage("fr", { initialSession: OPEN_SESSION });

    for (const forbidden of [
      "Bénéficiaire",
      "Fournisseur",
      "Bon de commande",
      "Profit",
      "Marge",
      "EBITDA",
      "Débit",
      "Crédit",
      "Grand livre",
      "Écart",
      "Solde réel",
      "Espèces comptées",
      "Montant compté",
      "Confirmer la fermeture",
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Fermer la caisse" })).not.toBeInTheDocument();
  });
});

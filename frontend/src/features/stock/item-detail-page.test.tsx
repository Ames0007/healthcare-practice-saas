import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ItemDetailPage } from "./item-detail-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ItemDetailPage>) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ItemDetailPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ItemDetailPage", () => {
  it("renders the header for the task's own worked example item", () => {
    renderPage("fr", { itemId: "item-02" });

    expect(screen.getByRole("heading", { level: 1, name: "Compresses stériles 10×10" })).toBeInTheDocument();
    expect(screen.getAllByText("STK-0002").length).toBeGreaterThan(0);
    expect(screen.getByText("Stock faible")).toBeInTheDocument();
  });

  it("renders the Aperçu tab marked active", () => {
    renderPage("fr", { itemId: "item-02" });
    expect(screen.getByRole("link", { name: "Aperçu" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the stock section with every configured threshold", () => {
    renderPage("fr", { itemId: "item-02" });

    const stockSection = screen.getByText("Stock").closest("div.rounded-lg")! as HTMLElement;
    expect(within(stockSection).getByText("18 Boîte")).toBeInTheDocument();
    expect(within(stockSection).getByText("Stock de sécurité")).toBeInTheDocument();
    expect(within(stockSection).getByText("Point de commande")).toBeInTheDocument();
    expect(within(stockSection).getByText("Maximum")).toBeInTheDocument();
  });

  it("renders the replenishment section", () => {
    renderPage("fr", { itemId: "item-02" });
    expect(screen.getByText("Approvisionnement")).toBeInTheDocument();
    expect(screen.getByText("5 jours")).toBeInTheDocument();
    expect(screen.getByText("30 Boîte")).toBeInTheDocument();
  });

  it("hides threshold rows that are not configured (item-01 has no safetyStock/reorderPoint labeled as such beyond reorderPoint)", () => {
    renderPage("fr", { itemId: "item-03" });
    expect(screen.queryByText("Stock de sécurité")).not.toBeInTheDocument();
    expect(screen.queryByText("Maximum")).not.toBeInTheDocument();
  });

  it("renders medicine metadata only for a medicines-category item", () => {
    renderPage("fr", { itemId: "item-06" });
    expect(screen.getByText("Médicament")).toBeInTheDocument();
    expect(screen.getByText("Solution injectable")).toBeInTheDocument();
    expect(screen.getByText("2 %")).toBeInTheDocument();
  });

  it("does not render the medicine section for a non-medicines item", () => {
    renderPage("fr", { itemId: "item-02" });
    expect(screen.queryByText("Médicament")).not.toBeInTheDocument();
  });

  it("renders the not-found state for an unknown item id", () => {
    renderPage("fr", { itemId: "does-not-exist" });
    expect(screen.getByText("Article introuvable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour aux articles" })).toHaveAttribute("href", "/app/stock/items");
  });

  it("edits the item through the form dialog and reflects the change immediately", () => {
    renderPage("fr", { itemId: "item-01" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Stock minimum *"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Article mis à jour.")).toBeInTheDocument();
    const stockSection = screen.getByText("Stock").closest("div.rounded-lg")! as HTMLElement;
    expect(within(stockSection).getByText("12")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar", { itemId: "item-02" });
    expect(screen.getAllByText("STK-0002").length).toBeGreaterThan(0);
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });

  it("shows the Lots tab only for a lot-tracked item", () => {
    renderPage("fr", { itemId: "item-02" });
    expect(screen.getByRole("link", { name: "Lots" })).toBeInTheDocument();
  });

  it("hides the Lots tab for a non-lot-tracked item", () => {
    renderPage("fr", { itemId: "item-01" });
    expect(screen.queryByRole("link", { name: "Lots" })).not.toBeInTheDocument();
  });

  it("renders the item's own lot with balance/expiry status on the Lots tab", () => {
    renderPage("fr", { itemId: "item-02", activeTab: "lots" });

    expect(screen.getByRole("link", { name: "Lots" })).toHaveAttribute("aria-current", "page");
    const table = screen.getByRole("table");
    const row = within(table).getByText("LOT-2026-0102").closest("tr") as HTMLElement;
    expect(within(row).getByText("18 Boîte")).toBeInTheDocument();
    expect(within(row).getByText("Expire bientôt")).toBeInTheDocument();
  });

  it("shows an empty state on the Lots tab when the item has no lots yet", () => {
    renderPage("fr", { itemId: "item-02", activeTab: "lots", lots: [] });
    expect(screen.getByText("Aucun lot")).toBeInTheDocument();
  });

  it("shows the Mouvements tab for every item, lot-tracked or not", () => {
    renderPage("fr", { itemId: "item-01" });
    expect(screen.getByRole("link", { name: "Mouvements" })).toBeInTheDocument();
  });

  it("renders movement history with a running balance, most recent first (worked-example item)", () => {
    renderPage("fr", { itemId: "item-02", activeTab: "movements" });

    expect(screen.getByRole("link", { name: "Mouvements" })).toHaveAttribute("aria-current", "page");
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText("-7")).toBeInTheDocument();
    expect(within(firstDataRow).getByText("18 Boîte")).toBeInTheDocument();
    expect(within(firstDataRow).getByText("LOT-2026-0102")).toBeInTheDocument();
  });

  it("records a Stock IN for a non-lot-tracked item and increases the header balance", () => {
    renderPage("fr", { itemId: "item-01", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Entrée" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Mouvement enregistré.")).toBeInTheDocument();
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("+5")).toBeInTheDocument();
    expect(within(rows[1]).getByText("25 Boîte")).toBeInTheDocument();
  });

  it("blocks a Stock OUT that would exceed the available balance", () => {
    renderPage("fr", { itemId: "item-01", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Sortie" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Quantité supérieure au stock disponible.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("records an adjustment", () => {
    renderPage("fr", { itemId: "item-01", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Ajustement" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("+3")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Ajustement")).toBeInTheDocument();
  });

  it("records a Stock IN for a lot-tracked item by creating a new lot inline", () => {
    renderPage("fr", { itemId: "item-02", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Entrée" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Numéro du nouveau lot"), { target: { value: "LOT-2026-0103" } });
    fireEvent.change(screen.getByLabelText("Date de péremption *"), { target: { value: "2027-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("+5")).toBeInTheDocument();
    expect(within(rows[1]).getByText("LOT-2026-0103")).toBeInTheDocument();
    expect(within(rows[1]).getByText("23 Boîte")).toBeInTheDocument();
  });

  it("requires selecting an existing lot for a Stock OUT on a lot-tracked item", () => {
    renderPage("fr", { itemId: "item-02", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Sortie" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Sélectionnez un lot.")).toBeInTheDocument();
  });

  it("Stock OUT excludes a fully depleted lot from the selectable options (item-07's lot-07-1, balance 0)", () => {
    renderPage("fr", { itemId: "item-07", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Sortie" }));
    const lotSelect = screen.getByLabelText("Lot *") as HTMLSelectElement;
    expect(within(lotSelect).queryByText(/LOT-2026-0501/)).not.toBeInTheDocument();
  });

  it("Stock OUT for a lot-tracked item records against the selected lot", () => {
    renderPage("fr", { itemId: "item-13", activeTab: "movements" });

    fireEvent.click(screen.getByRole("button", { name: "Sortie" }));
    fireEvent.change(screen.getByLabelText("Lot *"), { target: { value: "lot-13-2" } });
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("-1")).toBeInTheDocument();
  });
});

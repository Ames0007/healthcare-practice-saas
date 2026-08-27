import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { StockMovementsPage } from "./stock-movements-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/stock/movements",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof StockMovementsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <StockMovementsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("StockMovementsPage", () => {
  it("renders the header and the Mouvements tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Mouvements" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mouvements" })).toHaveAttribute("aria-current", "page");
  });

  it("shows a no-selection empty state before an article is chosen", () => {
    renderPage("fr");
    expect(screen.getByText("Aucun article sélectionné")).toBeInTheDocument();
  });

  it("shows the selected article's movement history and actions once chosen", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Article"), { target: { value: "item-02" } });

    expect(screen.getByRole("link", { name: "Voir la fiche de l'article" })).toHaveAttribute("href", "/app/stock/items/item-02");
    expect(screen.getByRole("button", { name: "Entrée" })).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("LOT-2026-0102").length).toBeGreaterThan(0);
  });

  it("records a movement for the selected article", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Article"), { target: { value: "item-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrée" }));
    fireEvent.change(screen.getByLabelText("Quantité *"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getByText("+5")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "الحركات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

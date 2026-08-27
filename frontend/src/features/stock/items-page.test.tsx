import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ItemsPage } from "./items-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/stock/items",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ItemsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ItemsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ItemsPage", () => {
  it("renders the header and the Articles tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Articles" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Articles" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reproduces the task's own worked example row (Compresses stériles: stock 18, minimum 25, Stock faible)", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const row = within(table).getByText("Compresses stériles 10×10").closest("tr")!;
    expect(within(row).getByText("18")).toBeInTheDocument();
    expect(within(row).getByText("25")).toBeInTheDocument();
    expect(within(row).getByText("Stock faible")).toBeInTheDocument();
  });

  it("filters by search (name or item number)", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Rechercher un article"), { target: { value: "STK-0002" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("Compresses stériles 10×10")).toBeInTheDocument();
    expect(within(table).queryByText("Gants nitrile M")).not.toBeInTheDocument();
  });

  it("filters by category", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Catégorie"), { target: { value: "medicines" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("Lidocaïne 2 %")).toBeInTheDocument();
    expect(within(table).queryByText("Gants nitrile M")).not.toBeInTheDocument();
  });

  it("filters by attention status", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "out_of_stock" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("Antiseptique Bétadine")).toBeInTheDocument();
    expect(within(table).queryByText("Gants nitrile M")).not.toBeInTheDocument();
  });

  it("marks an inactive item distinctly", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const row = within(table).getByText("Papier ECG").closest("tr")!;
    expect(within(row).getByText(/Inactif/)).toBeInTheDocument();
  });

  it("adds a new article through the form dialog and shows it in the list with a generated item number", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Ajouter un article" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Thermomètre auriculaire" } });
    fireEvent.change(screen.getByLabelText("Stock minimum *"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    const table = screen.getByRole("table");
    const row = within(table).getByText("Thermomètre auriculaire").closest("tr")!;
    expect(within(row).getByText("STK-0025")).toBeInTheDocument();
  });

  it("rejects submitting the add form without a required name", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Ajouter un article" }));
    fireEvent.change(screen.getByLabelText("Stock minimum *"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getAllByText("Ce champ est obligatoire.").length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "المواد" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

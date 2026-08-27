import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { StockLotsPage } from "./stock-lots-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/stock/lots",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof StockLotsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <StockLotsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("StockLotsPage", () => {
  it("renders the header and the Lots & expirations tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Lots & expirations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lots & expirations" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Articles" })).not.toHaveAttribute("aria-current");
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists an expired lot that still holds remaining quantity, linked to its item", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const row = within(table).getByText("LOT-2026-0901").closest("tr") as HTMLElement;
    expect(within(row).getByRole("link", { name: "Tubes de prélèvement" })).toHaveAttribute("href", "/app/stock/items/item-13");
    expect(within(row).getByText("Expiré")).toBeInTheDocument();
  });

  it("still lists a fully depleted expired lot (this is the full browsing/audit list, unlike the narrower Gate 4 attention subset)", () => {
    renderPage("fr");

    const table = screen.getByRole("table");
    const row = within(table).getByText("LOT-2026-0501").closest("tr") as HTMLElement;
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(within(row).getByText("Expiré")).toBeInTheDocument();
  });

  it("filters by search (lot number or article name)", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Rechercher un lot"), { target: { value: "Lidocaïne" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("LOT-2026-0401")).toBeInTheDocument();
    expect(within(table).queryByText("LOT-2026-0102")).not.toBeInTheDocument();
  });

  it("filters by expiry status", () => {
    renderPage("fr");

    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "expired" } });
    const table = screen.getByRole("table");
    expect(within(table).getByText("LOT-2026-0901")).toBeInTheDocument();
    expect(within(table).queryByText("LOT-2026-0102")).not.toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "الدفعات والصلاحية" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { StockDashboard } from "./stock-dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/stock",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof StockDashboard> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <StockDashboard {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("StockDashboard", () => {
  it("renders the header and the Vue d'ensemble tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Pharmacie & Stock" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Articles" })).not.toHaveAttribute("aria-current");
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the three Spec #2 §42.5 KPIs with their real derived counts", () => {
    renderPage("fr");

    expect(screen.getByText("Articles en stock faible")).toBeInTheDocument();
    const expiringLotsCard = screen.getByText("Lots à échéance").closest("div.rounded-lg") as HTMLElement;
    expect(within(expiringLotsCard).getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Mouvements (30 derniers jours)")).toBeInTheDocument();
  });

  it("lists the task's own worked example item (Compresses stériles) under attention items, linked to its detail page", () => {
    renderPage("fr");

    const attentionSection = screen.getByText("Articles à surveiller").closest("div.rounded-lg") as HTMLElement;
    const link = within(attentionSection).getByRole("link", { name: "Compresses stériles 10×10" });
    expect(link).toHaveAttribute("href", "/app/stock/items/item-02");
    expect(within(link.closest("li") as HTMLElement).getByText("Stock faible")).toBeInTheDocument();
  });

  it("lists an expiring/expired lot under expiry attention, linked to its item", () => {
    renderPage("fr");

    const expirySection = screen.getByText("Lots proches de la péremption").closest("div.rounded-lg") as HTMLElement;
    const link = within(expirySection).getByRole("link", { name: "Tubes de prélèvement" });
    expect(link).toHaveAttribute("href", "/app/stock/items/item-13");
    expect(within(link.closest("li") as HTMLElement).getByText("Expiré")).toBeInTheDocument();
  });

  it("does not list a fully healthy item under attention", () => {
    renderPage("fr");
    expect(screen.queryByRole("link", { name: "Solution hydroalcoolique" })).not.toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "الصيدلية والمخزون" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

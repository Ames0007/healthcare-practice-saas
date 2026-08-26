import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { FinanceNav } from "./finance-nav";

const mockUsePathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

function renderNav() {
  return render(
    <LocaleProvider initialLocale="fr">
      <FinanceNav />
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("FinanceNav", () => {
  it("renders all four Finance workspace items with the correct hrefs", () => {
    mockUsePathname.mockReturnValue("/app/finance");
    renderNav();

    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("href", "/app/finance");
    expect(screen.getByRole("link", { name: "Factures" })).toHaveAttribute("href", "/app/finance/invoices");
    expect(screen.getByRole("link", { name: "Caisse" })).toHaveAttribute("href", "/app/finance/caisse");
    expect(screen.getByRole("link", { name: "Décaissements" })).toHaveAttribute("href", "/app/finance/expenses");
  });

  it("marks 'Vue d'ensemble' active only on the exact /app/finance route, not every nested route", () => {
    mockUsePathname.mockReturnValue("/app/finance");
    renderNav();

    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Factures" })).not.toHaveAttribute("aria-current");
  });

  it("marks Factures active on /app/finance/invoices", () => {
    mockUsePathname.mockReturnValue("/app/finance/invoices");
    renderNav();

    expect(screen.getByRole("link", { name: "Factures" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).not.toHaveAttribute("aria-current");
  });

  it("marks Caisse active on /app/finance/caisse", () => {
    mockUsePathname.mockReturnValue("/app/finance/caisse");
    renderNav();

    expect(screen.getByRole("link", { name: "Caisse" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).not.toHaveAttribute("aria-current");
  });

  it("marks Décaissements active on /app/finance/expenses", () => {
    mockUsePathname.mockReturnValue("/app/finance/expenses");
    renderNav();

    expect(screen.getByRole("link", { name: "Décaissements" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).not.toHaveAttribute("aria-current");
  });

  it("renders in Arabic with the reused Finance/Caisse/Décaissements vocabulary", () => {
    mockUsePathname.mockReturnValue("/app/finance/caisse");
    render(
      <LocaleProvider initialLocale="ar">
        <FinanceNav />
      </LocaleProvider>,
    );

    expect(screen.getByRole("link", { name: "نظرة عامة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الصندوق" })).toHaveAttribute("aria-current", "page");
  });
});

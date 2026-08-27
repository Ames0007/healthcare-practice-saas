import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { StockReportPage } from "./stock-report-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/rapports/stock",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof StockReportPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <StockReportPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("StockReportPage", () => {
  it("renders the header and the Stock tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rapports — Stock" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Stock" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Lots proches expiration")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reproduces the exact expiring-lots reconciliation (4) and links out to /app/stock", () => {
    renderPage("fr");

    const card = screen.getByText("Lots proches expiration").closest("div.rounded-lg") as HTMLElement;
    expect(within(card).getByText("4")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Voir le stock" })).toHaveAttribute("href", "/app/stock");
  });
});

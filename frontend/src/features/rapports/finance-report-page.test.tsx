import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { FinanceReportPage } from "./finance-report-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/rapports/finance",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof FinanceReportPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <FinanceReportPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

function expectMetric(label: string, value: string) {
  const card = screen.getByText(label).closest("div.rounded-lg") as HTMLElement;
  expect(within(card).getByText(value)).toBeInTheDocument();
}

describe("FinanceReportPage", () => {
  it("renders the header and the Finance tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rapports — Finance" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Facturé")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("defaults to Ce mois and reproduces the exact August 2026 fixture reconciliation (3000 invoiced, 1500 collected, 50% collection rate)", () => {
    renderPage("fr");

    expect(screen.getByRole("button", { name: "Ce mois", pressed: true })).toBeInTheDocument();
    expectMetric("Facturé", "3 000 MAD");
    expectMetric("Encaissé", "1 500 MAD");
    expectMetric("À encaisser", "3 700 MAD");
    expectMetric("En retard", "2 200 MAD");
    expectMetric("Taux de recouvrement", "50 %");
  });
});

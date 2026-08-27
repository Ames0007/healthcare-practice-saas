import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ReportsDashboard } from "./reports-dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/rapports",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ReportsDashboard> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ReportsDashboard {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

/** Mirrors `stock-dashboard.test.tsx`'s own precedent: locate the MetricCard via its label, then assert the expected value within that same card. */
function expectMetric(label: string, value: string) {
  const card = screen.getByText(label).closest("div.rounded-lg") as HTMLElement;
  expect(within(card).getByText(value)).toBeInTheDocument();
}

describe("ReportsDashboard", () => {
  it("renders the header and the Vue d'ensemble tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rapports" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vue d'ensemble" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("defaults to Ce mois and shows every category block with its own real fixture-derived value", () => {
    renderPage("fr");

    expect(screen.getByRole("button", { name: "Ce mois", pressed: true })).toBeInTheDocument();
    expectMetric("Rendez-vous", "14");
    expectMetric("Patients vus", "4");
    expectMetric("À encaisser", "3 700 MAD");
    expectMetric("En retard", "2 200 MAD");
    expectMetric("Lots proches expiration", "4");
  });
});

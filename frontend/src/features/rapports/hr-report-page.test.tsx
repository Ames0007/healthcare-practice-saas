import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { HrReportPage } from "./hr-report-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/rapports/equipe",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof HrReportPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <HrReportPage {...props} />
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

describe("HrReportPage", () => {
  it("renders the header and the Équipe tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rapports — Équipe" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Équipe" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Effectif actif")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("defaults to Ce mois and reproduces the exact August fixture reconciliation (6 active, 68.1h worked, 3 late, 0.8h overtime)", () => {
    renderPage("fr");

    expect(screen.getByRole("button", { name: "Ce mois", pressed: true })).toBeInTheDocument();
    expectMetric("Effectif actif", "6");
    expectMetric("Heures travaillées", "68,1 h");
    expectMetric("Retards", "3");
    expectMetric("Heures supplémentaires", "0,8 h");
  });
});

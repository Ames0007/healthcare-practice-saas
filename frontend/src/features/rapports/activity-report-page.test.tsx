import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ActivityReportPage } from "./activity-report-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/rapports/activite",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof ActivityReportPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ActivityReportPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ActivityReportPage", () => {
  it("renders the header and the Activité tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rapports — Activité" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Activité" })).toHaveAttribute("aria-current", "page");
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

  it("defaults to Ce mois and shows the real fixture-derived KPIs (14 appointments, 4 patients seen)", () => {
    renderPage("fr");

    const appointmentsCard = screen.getByText("Rendez-vous", { selector: "span" }).closest("div.rounded-lg") as HTMLElement;
    expect(within(appointmentsCard).getByText("14")).toBeInTheDocument();

    const patientsCard = screen.getByText("Patients vus").closest("div.rounded-lg") as HTMLElement;
    expect(within(patientsCard).getByText("4")).toBeInTheDocument();
  });

  it("renders both practitioners in the performance table", () => {
    renderPage("fr");

    const table = screen.getByText("Performance par praticien").closest("div")!.querySelector("table")!;
    expect(within(table).getByText("Dr. Benali")).toBeInTheDocument();
    expect(within(table).getByText("Dr. Amal")).toBeInTheDocument();
  });

  it("renders the status breakdown table with every status present in the period", () => {
    renderPage("fr");

    const table = screen.getByText("Répartition par statut").closest("div")!.querySelector("table")!;
    expect(within(table).getByText("Terminé")).toBeInTheDocument();
    expect(within(table).getByText("Absent")).toBeInTheDocument();
  });
});

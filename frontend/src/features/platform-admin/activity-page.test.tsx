import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { ActivityPage } from "./activity-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <ActivityPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("ActivityPage", () => {
  it("renders the page title and every non-zero attention item", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Activité" })).toBeInTheDocument();
    expect(screen.getByText(/abonnement\(s\) expiré\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/cabinet\(s\) suspendu\(s\)/)).toBeInTheDocument();
  });

  it("lists all 5 real static audit events, newest first", () => {
    renderPage("fr");
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(6); // header + 5 events
    expect(within(rows[1]).getByText("2026-08-20")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Cabinet suspendu")).toBeInTheDocument();
  });

  it("links each event's tenant to its Tenant 360° page", () => {
    renderPage("fr");
    const row = screen.getByText("Cabinet suspendu").closest("tr") as HTMLElement;
    expect(within(row).getByRole("link", { name: "Cabinet Zenith" })).toHaveAttribute("href", "/admin/tenants/tenant-6");
  });

  it("shows the reason column when a reason is recorded", () => {
    renderPage("fr");
    expect(screen.getByText("Cabinet fermé à la demande du propriétaire.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "النشاط" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

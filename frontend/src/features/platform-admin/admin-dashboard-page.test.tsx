import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { AdminDashboardPage } from "./admin-dashboard-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <AdminDashboardPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

function section(headingText: string) {
  return screen.getByText(headingText).closest("section") as HTMLElement;
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("AdminDashboardPage", () => {
  it("renders the page title", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Vue d'ensemble de la plateforme" })).toBeInTheDocument();
  });

  it("derives Cabinets KPIs (5 active, 1 trial, 1 restricted) from the real tenant/subscription fixtures", () => {
    renderPage("fr");
    const cabinets = section("Cabinets");
    expect(within(cabinets).getByText("5")).toBeInTheDocument();
    expect(within(cabinets).getByText("En essai")).toBeInTheDocument();
    expect(within(cabinets).getByText("Restreints")).toBeInTheDocument();
  });

  it("derives Abonnements KPIs (2 active, 1 expiring soon, 1 expired)", () => {
    renderPage("fr");
    const subscriptions = section("Abonnements");
    expect(within(subscriptions).getByText("2")).toBeInTheDocument();
    expect(within(subscriptions).getByText("À renouveler")).toBeInTheDocument();
    expect(within(subscriptions).getByText("Expirés")).toBeInTheDocument();
  });

  it("derives Utilisateurs KPIs (12 total, 8 active) from the platform user directory", () => {
    renderPage("fr");
    const users = section("Utilisateurs");
    expect(within(users).getByText("12")).toBeInTheDocument();
    expect(within(users).getByText("8")).toBeInTheDocument();
  });

  it("shows every non-zero attention item — expired/grace/blackout subscriptions and a suspended tenant", () => {
    renderPage("fr");
    expect(screen.getByText(/abonnement\(s\) expiré\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/période de grâce/)).toBeInTheDocument();
    expect(screen.getByText(/blackout/)).toBeInTheDocument();
    expect(screen.getByText(/cabinet\(s\) suspendu\(s\)/)).toBeInTheDocument();
  });

  it("shows the most recent activity event first", () => {
    renderPage("fr");
    const recentActivityHeading = screen.getByText("Activité récente").closest("div")!.parentElement as HTMLElement;
    expect(within(recentActivityHeading).getByText("Cabinet suspendu")).toBeInTheDocument();
  });

  it("links to the full activity workspace", () => {
    renderPage("fr");
    expect(screen.getByRole("link", { name: "Voir toute l'activité" })).toHaveAttribute("href", "/admin/activity");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "نظرة عامة على المنصة" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

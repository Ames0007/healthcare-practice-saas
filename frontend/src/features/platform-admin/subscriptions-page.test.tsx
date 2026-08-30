import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { SubscriptionsPage } from "./subscriptions-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <SubscriptionsPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("SubscriptionsPage", () => {
  it("lists every real platform subscription", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Abonnements" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(8); // header + 7 subscriptions
  });

  it("tenant-1's row links straight to its Tenant 360° page — no separate subscription detail route", () => {
    renderPage("fr");
    const row = screen.getByText("Cabinet (exemple)").closest("tr") as HTMLElement;
    expect(within(row).getByRole("link", { name: "Voir" })).toHaveAttribute("href", "/admin/tenants/tenant-1");
  });

  it("filters by exact subscription status", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "trialing" } });
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + Cabinet Atlas
    expect(screen.getByText("Cabinet Atlas")).toBeInTheDocument();
  });

  it("filters by exact plan code", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "solo" } });
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 solo-plan subscriptions
  });

  it("shows an empty state when no subscription matches the filters", () => {
    renderPage("fr");
    fireEvent.change(screen.getByLabelText("Statut"), { target: { value: "trialing" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "solo" } });
    expect(screen.getByText("Aucun abonnement ne correspond à ces critères.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "الاشتراكات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

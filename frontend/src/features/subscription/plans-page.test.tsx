import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { getSubscriptionMockData } from "./mock-subscription-data";
import { PlansPage } from "./plans-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/abonnement/plans",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof PlansPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PlansPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("PlansPage", () => {
  it("renders the header and the Plans tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Plans" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plans" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Solo")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows both plan columns with price marked as not yet defined, never an invented MAD figure", () => {
    renderPage("fr");

    expect(screen.getByRole("columnheader", { name: "Solo" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cabinet" })).toBeInTheDocument();
    expect(screen.getAllByText("À définir")).toHaveLength(2);
  });

  it("shows Cabinet's own wireframe-evidenced limits (3 practitioners, 5 staff)", () => {
    renderPage("fr");

    const practitionerRow = screen.getByText("Praticiens").closest("tr") as HTMLElement;
    expect(within(practitionerRow).getByText("3")).toBeInTheDocument();
    const staffRow = screen.getByText("Personnel").closest("tr") as HTMLElement;
    expect(within(staffRow).getByText("5")).toBeInTheDocument();
  });

  it("shows Solo's undefined staff limit as the neutral placeholder, never an invented number", () => {
    renderPage("fr");
    const staffRow = screen.getByText("Personnel").closest("tr") as HTMLElement;
    expect(within(staffRow).getByText("Non défini dans ce prototype")).toBeInTheDocument();
  });

  it("marks every boolean entitlement as Inclus on both plans", () => {
    renderPage("fr");
    expect(screen.getAllByText("Inclus")).toHaveLength(6);
    expect(screen.queryByText("Non inclus")).not.toBeInTheDocument();
  });

  it("shows the current-usage summary derived from real Team fixtures", () => {
    renderPage("fr");
    expect(screen.getByText("Utilisation actuelle : 2 praticien(s) actif(s), 4 membre(s) du personnel actif(s).")).toBeInTheDocument();
  });

  it("Cabinet (the current plan) shows a Plan actuel badge, never a Choisir ce plan button", () => {
    renderPage("fr", { subscription: getSubscriptionMockData() });
    expect(screen.getByText("Plan actuel")).toBeInTheDocument();
  });

  it("Solo is blocked from selection because real active-practitioner usage (2) exceeds its own limit (1) — WF-74's own scenario, using real data", () => {
    renderPage("fr", { subscription: getSubscriptionMockData() });
    expect(screen.getByText("Non disponible : 2 praticien(s) actif(s) dépasse la limite de ce plan (1).")).toBeInTheDocument();
  });

  it("Choisir ce plan opens an informational dialog and never mutates state — no fake payment/checkout", () => {
    renderPage("fr", {
      subscription: { ...getSubscriptionMockData(), planId: "plan-solo" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Choisir ce plan" }));
    expect(screen.getByText("Le changement de plan sera connecté à la facturation SaaS ultérieurement.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Compris" }));
    expect(screen.getByText("Message pris en compte.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الخطط" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

describe("AppShell", () => {
  it("renders the sidebar, topbar and main content region", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <AppShell>
          <p>Demo content</p>
        </AppShell>
      </LocaleProvider>,
    );

    // Sidebar navigation (desktop/tablet) — all primary modules present.
    // Scoped to the sidebar landmark: some items (Aujourd'hui/Agenda/
    // Patients) also render in the mobile bottom nav, which coexists in
    // the DOM in jsdom (no real CSS breakpoint hiding).
    const sidebar = screen.getByRole("complementary");
    expect(within(sidebar).getByText("Aujourd'hui")).toBeInTheDocument();
    expect(within(sidebar).getByText("Agenda")).toBeInTheDocument();
    expect(within(sidebar).getByText("Patients")).toBeInTheDocument();
    expect(within(sidebar).getByText("Finance")).toBeInTheDocument();
    expect(within(sidebar).getByText("Abonnement")).toBeInTheDocument();

    // Topbar
    expect(
      screen.getByPlaceholderText("Rechercher un patient, un numéro, une facture..."),
    ).toBeInTheDocument();

    // Main content is rendered and reachable via the skip link target.
    expect(screen.getByText("Demo content")).toBeInTheDocument();
    expect(document.getElementById("main-content")).toContainElement(
      screen.getByText("Demo content"),
    );
  });

  it("renders a structural mobile bottom nav with the four primary destinations", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <AppShell>
          <p>Demo content</p>
        </AppShell>
      </LocaleProvider>,
    );

    const mobileNav = screen.getByRole("navigation", { name: "Plus" });
    expect(mobileNav).toBeInTheDocument();

    // Aujourd'hui/Agenda/Patients are links, Plus is the fourth item (a
    // non-navigating placeholder button per Spec 06 TASK-003 §20/§28).
    expect(mobileNav.querySelectorAll("a")).toHaveLength(3);
    expect(mobileNav.querySelector("button")).toHaveTextContent("Plus");
  });
});

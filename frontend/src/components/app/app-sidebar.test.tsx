import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { AppSidebar } from "./app-sidebar";

const mockUsePathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

function renderSidebar() {
  return render(
    <LocaleProvider initialLocale="fr">
      <AppSidebar />
    </LocaleProvider>,
  );
}

/**
 * UI-006A §6: `/app/finance` must show a real selected sidebar state now
 * that it is a real route, not the generic catch-all. UI-006B §6, UI-006C
 * §6 and UI-006D §6 extend this to the nested `/app/finance/invoices`,
 * `/app/finance/caisse` and `/app/finance/expenses` routes — Finance must
 * remain the active main-sidebar section there too (the sidebar's own
 * generic `pathname.startsWith` logic already handles this unmodified;
 * there is no separate top-level "Caisse"/"Décaissements" nav item —
 * Spec #2's own IA sitemap nests both under Finance).
 */
describe("AppSidebar", () => {
  it("marks Finance as the current page when the route is /app/finance", () => {
    mockUsePathname.mockReturnValue("/app/finance");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Finance as the current page for the nested /app/finance/invoices route", () => {
    mockUsePathname.mockReturnValue("/app/finance/invoices");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Finance as the current page for the nested /app/finance/caisse route", () => {
    mockUsePathname.mockReturnValue("/app/finance/caisse");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Finance as the current page for the nested /app/finance/expenses route", () => {
    mockUsePathname.mockReturnValue("/app/finance/expenses");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });

  /**
   * UI-007A §6: `/app/equipe` must show a real selected sidebar state now
   * that it is a real route, not the generic catch-all, and the nested
   * `/app/equipe/[id]` employee profile route keeps it active too — the
   * sidebar's own generic `pathname.startsWith` logic already handles this
   * unmodified.
   */
  it("marks Équipe as the current page when the route is /app/equipe", () => {
    mockUsePathname.mockReturnValue("/app/equipe");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Équipe" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Équipe as the current page for the nested /app/equipe/[id] route", () => {
    mockUsePathname.mockReturnValue("/app/equipe/team-3");
    renderSidebar();

    expect(screen.getByRole("link", { name: "Équipe" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });
});

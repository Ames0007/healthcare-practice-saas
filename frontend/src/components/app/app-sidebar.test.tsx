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
 * that it is a real route, not the generic catch-all. UI-006B §6 extends
 * this to the nested `/app/finance/invoices` route — Finance must remain
 * the active main-sidebar section there too (the sidebar's own generic
 * `pathname.startsWith` logic already handles this unmodified).
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
});

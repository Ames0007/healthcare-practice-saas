import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { AppSidebar } from "./app-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/finance",
}));

/** UI-006A §6: `/app/finance` must show a real selected sidebar state now that it is a real route, not the generic catch-all. */
describe("AppSidebar", () => {
  it("marks Finance as the current page when the route is /app/finance", () => {
    render(
      <LocaleProvider initialLocale="fr">
        <AppSidebar />
      </LocaleProvider>,
    );

    expect(screen.getByRole("link", { name: "Finance" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute("aria-current");
  });
});

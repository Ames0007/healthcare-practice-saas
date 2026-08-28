import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { HistoriquePage } from "./historique-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/access/historique",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof HistoriquePage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <HistoriquePage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("HistoriquePage", () => {
  it("renders the header and the Historique tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Historique" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Historique" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Rôle attribué")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists events newest-first — delegation_created (2026-08-17) appears before role_assigned (2025-03-01)", () => {
    renderPage("fr");

    const rows = screen.getAllByRole("row").slice(1);
    const firstRowText = rows[0].textContent ?? "";
    expect(firstRowText).toContain("Délégation créée");
  });

  it("resolves a permission-key detail to its own catalog label", () => {
    renderPage("fr");

    const row = screen.getByText("Permission restreinte").closest("tr") as HTMLElement;
    expect(within(row).getByText("Modifier les informations administratives")).toBeInTheDocument();
  });

  it("shows the real actor/target names, not raw membership ids", () => {
    renderPage("fr");

    const row = screen.getByText("Utilisateur désactivé").closest("tr") as HTMLElement;
    expect(within(row).getByText("Youssef Benali")).toBeInTheDocument();
    expect(within(row).getByText("Othmane Zouiten")).toBeInTheDocument();
  });

  it("renders an empty state when there is no history", () => {
    renderPage("fr", { events: [] });
    expect(screen.getByText("Aucun changement d'accès enregistré.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "السجل" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

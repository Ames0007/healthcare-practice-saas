import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { PermissionsPage } from "./permissions-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/access/permissions",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof PermissionsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PermissionsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("PermissionsPage", () => {
  it("renders the header and the Permissions tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Permissions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Permissions" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Gérer la caisse")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("groups permissions by domain, matching the task's own domain list", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { name: "Caisse" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dossier santé" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accès & permissions" })).toBeInTheDocument();
  });

  it("shows caisse.manage as Critique and never delegatable", () => {
    renderPage("fr");

    const row = screen.getByText("Gérer la caisse").closest("tr") as HTMLElement;
    expect(within(row).getByText("Critique")).toBeInTheDocument();
    expect(within(row).getByText("Non")).toBeInTheDocument();
  });

  it("shows patients.view_admin as delegatable", () => {
    renderPage("fr");

    const row = screen.getByText("Voir les informations administratives").closest("tr") as HTMLElement;
    expect(within(row).getByText("Oui")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الصلاحيات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

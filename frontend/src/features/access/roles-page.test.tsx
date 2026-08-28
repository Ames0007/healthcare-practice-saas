import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { RolesPage } from "./roles-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/access/roles",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof RolesPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <RolesPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("RolesPage", () => {
  it("renders the header and the Rôles tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rôles" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rôles" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Praticien")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders all 3 roles, each marked as a system role", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { name: "Propriétaire / Administrateur" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Praticien" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Réceptionniste / Personnel" })).toBeInTheDocument();
    expect(screen.getAllByText("Rôle système")).toHaveLength(3);
  });

  it("Receptionist's checklist shows Dossier santé access unchecked by default", () => {
    renderPage("fr");

    const receptionistCard = screen.getByRole("heading", { name: "Réceptionniste / Personnel" }).closest("div.rounded-lg") as HTMLElement;
    const checkbox = within(receptionistCard).getByLabelText("Accéder au dossier santé") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("toggling a checkbox updates the role's own checklist immediately", () => {
    renderPage("fr");

    const receptionistCard = screen.getByRole("heading", { name: "Réceptionniste / Personnel" }).closest("div.rounded-lg") as HTMLElement;
    const checkbox = within(receptionistCard).getByLabelText("Voir les factures") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it("Enregistrer shows a confirmation toast naming the role", () => {
    renderPage("fr");

    const practitionerCard = screen.getByRole("heading", { name: "Praticien" }).closest("div.rounded-lg") as HTMLElement;
    fireEvent.click(within(practitionerCard).getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Rôle « Praticien » mis à jour.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الأدوار" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

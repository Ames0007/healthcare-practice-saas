import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { UsersPage } from "./users-page";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(locale: Locale) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirRoot>
        <UsersPage />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("UsersPage", () => {
  it("lists all 12 platform users (5 real tenant-1 users + 7 across the other 6 tenants)", () => {
    renderPage("fr");
    expect(screen.getByRole("heading", { level: 1, name: "Utilisateurs" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(13); // header + 12
  });

  it("shows tenant-1's own real user carrying its real tenant relationship", () => {
    renderPage("fr");
    const row = screen.getByText("Youssef Benali").closest("tr") as HTMLElement;
    expect(within(row).getByText("Cabinet (exemple)")).toBeInTheDocument();
  });

  it("Gérer opens a drawer for a disabled user (Othmane Zouiten) offering only Reactivate", () => {
    renderPage("fr");
    const row = screen.getByText("Othmane Zouiten").closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Gérer" }));

    expect(screen.getByRole("heading", { name: "Othmane Zouiten" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réactiver le compte" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Désactiver le compte" })).not.toBeInTheDocument();
  });

  it("confirming Reactivate updates the status badge and shows a toast", () => {
    renderPage("fr");
    const row = screen.getByText("Othmane Zouiten").closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Gérer" }));
    fireEvent.click(screen.getByRole("button", { name: "Réactiver le compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(screen.getByText("Statut de l'utilisateur mis à jour.")).toBeInTheDocument();
    const updatedRow = screen.getByText("Othmane Zouiten").closest("tr") as HTMLElement;
    expect(within(updatedRow).getByText("Actif")).toBeInTheDocument();
  });

  it("an invited user (never logged in) offers no status action", () => {
    renderPage("fr");
    const row = screen.getByText("Nadia Chraibi").closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Gérer" }));
    expect(screen.queryByRole("button", { name: /compte/ })).not.toBeInTheDocument();
  });

  it("a locked user offers only Unlock", () => {
    renderPage("fr");
    const row = screen.getByText("Omar Bensaid").closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Gérer" }));
    expect(screen.getByRole("button", { name: "Déverrouiller le compte" })).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");
    expect(screen.getByRole("heading", { level: 1, name: "المستخدمون" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

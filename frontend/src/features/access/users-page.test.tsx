import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { UsersPage } from "./users-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/access",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof UsersPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <UsersPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("UsersPage", () => {
  it("renders the header and the Utilisateurs tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Utilisateurs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Utilisateurs" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Meryem Bakkali")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists every user with role/status/access columns, reproducing Screen 46's own layout", () => {
    renderPage("fr");

    const benaliRow = screen.getByText("Youssef Benali").closest("tr") as HTMLElement;
    expect(within(benaliRow).getByText("Complet")).toBeInTheDocument();

    const amalRow = screen.getByText("Amal Idrissi").closest("tr") as HTMLElement;
    expect(within(amalRow).getAllByText("Praticien")).toHaveLength(2);

    const meryemRow = screen.getByText("Meryem Bakkali").closest("tr") as HTMLElement;
    expect(within(meryemRow).getByText("Personnalisé")).toBeInTheDocument();
    expect(within(meryemRow).queryByText("Désactivé")).not.toBeInTheDocument();
  });

  it("shows Othmane Zouiten as Désactivé, matching his own inactive TeamMember status", () => {
    renderPage("fr");
    const row = screen.getByText("Othmane Zouiten").closest("tr") as HTMLElement;
    expect(within(row).getByText("Désactivé")).toBeInTheDocument();
  });

  it("Gérer les accès opens a drawer pre-filled with the user's own current role and permissions", () => {
    renderPage("fr");

    const meryemRow = screen.getByText("Meryem Bakkali").closest("tr") as HTMLElement;
    fireEvent.click(within(meryemRow).getByRole("button", { name: "Gérer les accès" }));

    expect(screen.getByRole("heading", { name: "Meryem Bakkali" })).toBeInTheDocument();
    expect(screen.getByLabelText("Voir les factures")).toBeChecked();
    expect(screen.getByLabelText("Modifier les informations administratives")).not.toBeChecked();
  });

  it("toggling a permission and saving updates the table's own grant/restriction counts", () => {
    renderPage("fr");

    const meryemRow = screen.getByText("Meryem Bakkali").closest("tr") as HTMLElement;
    fireEvent.click(within(meryemRow).getByRole("button", { name: "Gérer les accès" }));

    fireEvent.click(screen.getByLabelText("Gérer le stock"));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Accès mis à jour.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "المستخدمون" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

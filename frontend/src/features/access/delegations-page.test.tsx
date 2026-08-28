import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { DelegationsPage } from "./delegations-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/access/delegations",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof DelegationsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <DelegationsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("DelegationsPage", () => {
  it("renders the header and the Délégations tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Délégations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Délégations" })).toHaveAttribute("aria-current", "page");
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

  it("shows all 4 lifecycle states across the fixture rows", () => {
    renderPage("fr");

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Programmée")).toBeInTheDocument();
    expect(screen.getByText("Expirée")).toBeInTheDocument();
    expect(screen.getByText("Révoquée")).toBeInTheDocument();
  });

  it("only Révoquer is offered on scheduled/active rows, never on expired/revoked ones", () => {
    renderPage("fr");

    const activeRow = screen.getByText("Active").closest("tr") as HTMLElement;
    expect(within(activeRow).getByRole("button", { name: "Révoquer" })).toBeInTheDocument();

    const expiredRow = screen.getByText("Expirée").closest("tr") as HTMLElement;
    expect(within(expiredRow).queryByRole("button", { name: "Révoquer" })).not.toBeInTheDocument();

    const revokedRow = screen.getByText("Révoquée").closest("tr") as HTMLElement;
    expect(within(revokedRow).queryByRole("button", { name: "Révoquer" })).not.toBeInTheDocument();
  });

  it("revoking the active delegation moves it to Révoquée after confirmation", () => {
    renderPage("fr");

    const activeRow = screen.getByText("Active").closest("tr") as HTMLElement;
    fireEvent.click(within(activeRow).getByRole("button", { name: "Révoquer" }));

    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Révoquer" }));
    expect(screen.getByText("Délégation révoquée.")).toBeInTheDocument();
  });

  it("+ Nouvelle délégation creates a new delegation and it appears in the table", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle délégation" }));

    fireEvent.change(screen.getByLabelText("Délégué par *"), { target: { value: "Youssef" } });
    fireEvent.click(screen.getByRole("option", { name: "Youssef Benali" }));

    fireEvent.change(screen.getByLabelText("Délégué à *"), { target: { value: "Amal" } });
    fireEvent.click(screen.getByRole("option", { name: "Amal Idrissi" }));

    fireEvent.change(screen.getByLabelText("Permission *"), { target: { value: "reports.view" } });
    fireEvent.change(screen.getByLabelText("Début *"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Fin *"), { target: { value: "2026-10-10" } });

    fireEvent.click(screen.getByRole("button", { name: "Créer la délégation" }));

    expect(screen.getByText("Délégation créée.")).toBeInTheDocument();
    expect(screen.getAllByText("Voir les rapports").length).toBeGreaterThan(0);
  });

  it("rejects creating a delegation for a non-delegatable permission", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle délégation" }));

    fireEvent.change(screen.getByLabelText("Délégué par *"), { target: { value: "Youssef" } });
    fireEvent.click(screen.getByRole("option", { name: "Youssef Benali" }));
    fireEvent.change(screen.getByLabelText("Délégué à *"), { target: { value: "Amal" } });
    fireEvent.click(screen.getByRole("option", { name: "Amal Idrissi" }));
    fireEvent.change(screen.getByLabelText("Début *"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Fin *"), { target: { value: "2026-10-10" } });

    fireEvent.click(screen.getByRole("button", { name: "Créer la délégation" }));

    expect(screen.getByText("Ce champ est obligatoire.")).toBeInTheDocument();
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar");

    expect(screen.getByRole("heading", { level: 1, name: "التفويضات" })).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
  });
});

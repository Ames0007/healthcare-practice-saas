import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { CabinetSettingsPage } from "./cabinet-settings-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof CabinetSettingsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <CabinetSettingsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("CabinetSettingsPage", () => {
  it("renders the header and the Cabinet tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Paramètres" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cabinet" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Cabinet (exemple)")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the fixture's own values in view mode, including the fixed currency/timezone", () => {
    renderPage("fr");

    expect(screen.getByText("Cabinet (exemple)")).toBeInTheDocument();
    expect(screen.getByText("05 22 34 56 78")).toBeInTheDocument();
    expect(screen.getByText("MAD")).toBeInTheDocument();
    expect(screen.getByText("Africa/Casablanca")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nom du cabinet")).not.toBeInTheDocument();
  });

  it("Modifier reveals the bounded edit form pre-filled with current values", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(screen.getByLabelText("Nom du cabinet *")).toHaveValue("Cabinet (exemple)");
    expect(screen.getByLabelText("Téléphone *")).toHaveValue("05 22 34 56 78");
  });

  it("blocks submit and shows an error when the name is cleared", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Nom du cabinet *"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Ce champ est obligatoire.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom du cabinet *")).toBeInTheDocument();
  });

  it("saving valid changes returns to view mode showing the updated value", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Nom du cabinet *"), { target: { value: "Cabinet Al Amal" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Cabinet Al Amal")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nom du cabinet")).not.toBeInTheDocument();
    expect(screen.getByText("MAD")).toBeInTheDocument();
  });

  it("Annuler discards changes without saving", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Nom du cabinet *"), { target: { value: "Nom temporaire" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("Cabinet (exemple)")).toBeInTheDocument();
    expect(screen.queryByText("Nom temporaire")).not.toBeInTheDocument();
  });
});

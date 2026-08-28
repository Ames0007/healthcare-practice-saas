import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { DocumentSettingsPage } from "./document-settings-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/documents",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof DocumentSettingsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <DocumentSettingsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("DocumentSettingsPage", () => {
  const profile = getCabinetProfileMockData();
  const expectedFooter = `${profile.name} — ${profile.phone} — ${profile.address}`;

  it("renders the header and the Documents tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText(expectedFooter)).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the footer derived from the Cabinet profile fixture in view mode", () => {
    renderPage("fr");
    expect(screen.getByText(expectedFooter)).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("Modifier reveals the bounded edit form pre-filled with current values", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(screen.getByLabelText("Pied de page *")).toHaveValue(expectedFooter);
  });

  it("blocks submit and shows an error when the footer is cleared", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Pied de page *"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Ce champ est obligatoire.")).toBeInTheDocument();
  });

  it("saving valid changes returns to view mode showing the updated value", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Pied de page *"), { target: { value: "Nouveau pied de page" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Nouveau pied de page")).toBeInTheDocument();
  });

  it("Annuler discards changes without saving", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Pied de page *"), { target: { value: "Texte temporaire" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText(expectedFooter)).toBeInTheDocument();
    expect(screen.queryByText("Texte temporaire")).not.toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { AppointmentSettingsPage } from "./appointment-settings-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/rendez-vous",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof AppointmentSettingsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <AppointmentSettingsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("AppointmentSettingsPage", () => {
  it("renders the header and the Rendez-vous tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Rendez-vous" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rendez-vous" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("30 min")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the fixture's own default values in view mode", () => {
    renderPage("fr");

    expect(screen.getByText("Heure fixe")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });

  it("Modifier reveals the bounded edit form pre-filled with current values", () => {
    renderPage("fr");

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(screen.getByLabelText("Durée par défaut *")).toHaveValue("30");
  });

  it("blocks submit and shows an error when the duration is cleared", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Durée par défaut *"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Valeur numérique invalide.")).toBeInTheDocument();
  });

  it("saving valid changes returns to view mode showing the updated value", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Durée par défaut *"), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("Annuler discards changes without saving", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getByLabelText("Durée par défaut *"), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.queryByText("99 min")).not.toBeInTheDocument();
  });
});

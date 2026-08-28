import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { WorkingHoursPage } from "./working-hours-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/horaires",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof WorkingHoursPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <WorkingHoursPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("WorkingHoursPage", () => {
  it("renders the header and the Horaires tab marked active", () => {
    renderPage("fr");

    expect(screen.getByRole("heading", { level: 1, name: "Horaires du cabinet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Horaires" })).toHaveAttribute("aria-current", "page");
  });

  it("also renders HorairesNav with Horaires habituels active (UI-AGENDA-X)", () => {
    renderPage("fr");

    expect(screen.getByRole("link", { name: "Horaires habituels" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Calendrier & exceptions" })).not.toHaveAttribute("aria-current");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Lundi")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("view mode shows 08:30 – 18:00 for Monday and Fermé for Sunday", () => {
    renderPage("fr");

    expect(screen.getByText("Lundi").closest("li")).toHaveTextContent("08:30 – 18:00");
    expect(screen.getByText("Dimanche").closest("li")).toHaveTextContent("Fermé");
  });

  it("Modifier reveals an editable weekly form pre-filled with current values", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    const startInputs = screen.getAllByLabelText("Ouverture");
    expect(startInputs.length).toBeGreaterThan(0);
    expect((startInputs[0] as HTMLInputElement).value).toBe("08:30");
  });

  it("rejects an end time before the start time and shows an error without saving", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getAllByLabelText("Ouverture")[0], { target: { value: "18:00" } });
    fireEvent.change(screen.getAllByLabelText("Fermeture")[0], { target: { value: "08:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText(/heure de fermeture doit être après/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText("Ouverture").length).toBeGreaterThan(0);
  });

  it("saving valid changes returns to view mode with the updated hours", () => {
    renderPage("fr");
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    fireEvent.change(screen.getAllByLabelText("Ouverture")[0], { target: { value: "09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Lundi").closest("li")).toHaveTextContent("09:00 – 18:00");
  });
});

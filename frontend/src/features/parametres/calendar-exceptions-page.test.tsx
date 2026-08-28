import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { CabinetCalendarException } from "@/components/domain/settings/types";
import { CalendarExceptionsPage } from "./calendar-exceptions-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/parametres/horaires/exceptions",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(initialLocale: Locale, props: React.ComponentProps<typeof CalendarExceptionsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <CalendarExceptionsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const PAST_EXCEPTION: CabinetCalendarException = {
  id: "cal-exc-past",
  date: "2026-07-30",
  type: "public_holiday",
  reason: "Fête du Trône",
  intervals: [],
  createdAt: "2026-07-01",
  active: true,
};

const FUTURE_EXCEPTION: CabinetCalendarException = {
  id: "cal-exc-future",
  date: "2026-11-06",
  type: "public_holiday",
  reason: "Marche Verte",
  intervals: [],
  createdAt: "2026-08-01",
  active: true,
};

describe("CalendarExceptionsPage", () => {
  it("renders both ParametresNav and HorairesNav, with Horaires/Calendrier & exceptions active", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION] });

    expect(screen.getByRole("link", { name: "Horaires" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Calendrier & exceptions" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Horaires habituels" })).not.toHaveAttribute("aria-current");
  });

  it("renders the loading skeleton", () => {
    renderPage("fr", { state: "loading" });
    expect(screen.queryByText("Marche Verte")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderPage("fr", { state: "error", onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state when there are no exceptions", () => {
    renderPage("fr", { exceptions: [] });
    expect(screen.getByText("Aucune exception au calendrier.")).toBeInTheDocument();
  });

  it("groups exceptions by month and shows type/reason", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION] });

    expect(screen.getByText("novembre 2026")).toBeInTheDocument();
    expect(screen.getByText("Jour férié")).toBeInTheDocument();
    expect(screen.getByText("Marche Verte")).toBeInTheDocument();
    expect(screen.getByText("Fermé")).toBeInTheDocument();
  });

  it("a past exception shows the read-only notice and no Modifier/Supprimer actions", () => {
    renderPage("fr", { exceptions: [PAST_EXCEPTION], businessDate: "2026-08-23" });

    expect(screen.getByText("Exception passée — lecture seule.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
  });

  it("a future exception offers Modifier/Supprimer and no read-only notice", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION], businessDate: "2026-08-23" });

    expect(screen.queryByText("Exception passée — lecture seule.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeInTheDocument();
  });

  it("adds a closed-type exception (no interval fields shown) and shows a success toast", () => {
    renderPage("fr", { exceptions: [] });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une exception" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Date *"), { target: { value: "2026-09-15" } });
    fireEvent.change(within(dialog).getByLabelText("Motif"), { target: { value: "Test fermeture" } });
    expect(within(dialog).queryByText("Horaires")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Exception ajoutée.")).toBeInTheDocument();
    expect(screen.getByText("Test fermeture")).toBeInTheDocument();
  });

  it("rejects submitting an open-type exception with no intervals", () => {
    renderPage("fr", { exceptions: [] });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une exception" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Date *"), { target: { value: "2026-09-15" } });
    fireEvent.change(within(dialog).getByLabelText("Type *"), { target: { value: "modified_hours" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(within(dialog).getByText("Au moins un horaire est requis pour ce type d'exception.")).toBeInTheDocument();
  });

  it("rejects a duplicate active date", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION] });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une exception" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Date *"), { target: { value: FUTURE_EXCEPTION.date } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(within(dialog).getByText("Une exception existe déjà pour cette date. Modifiez-la plutôt que d'en créer une nouvelle.")).toBeInTheDocument();
  });

  it("editing a future exception pre-fills the form and updates the row on save", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByLabelText("Date *") as HTMLInputElement).value).toBe("2026-11-06");
    fireEvent.change(within(dialog).getByLabelText("Motif"), { target: { value: "Marche Verte (mise à jour)" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Exception modifiée.")).toBeInTheDocument();
    expect(screen.getByText("Marche Verte (mise à jour)")).toBeInTheDocument();
  });

  it("removing a future exception asks for confirmation and falls back to the weekly schedule", () => {
    renderPage("fr", { exceptions: [FUTURE_EXCEPTION] });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    const confirmDialog = screen.getByRole("alertdialog");
    fireEvent.click(within(confirmDialog).getByRole("button", { name: "Supprimer" }));

    expect(screen.getByText("Exception supprimée.")).toBeInTheDocument();
    expect(screen.queryByText("Marche Verte")).not.toBeInTheDocument();
    expect(screen.getByText("Aucune exception au calendrier.")).toBeInTheDocument();
  });

  it("shows a real appointment-conflict warning when adding an exceptional closure on a date with real Agenda appointments", () => {
    renderPage("fr", { exceptions: [] });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une exception" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Date *"), { target: { value: "2026-08-26" } });
    fireEvent.change(within(dialog).getByLabelText("Type *"), { target: { value: "exceptional_closure" } });

    expect(within(dialog).getByText("1 rendez-vous existant(s) sur cette période.")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Voir les rendez-vous" })).toHaveAttribute("href", "/app/agenda");
  });

  it("renders in Arabic with RTL direction", () => {
    renderPage("ar", { exceptions: [FUTURE_EXCEPTION] });

    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
    expect(screen.getByText("عيد رسمي")).toBeInTheDocument();
  });
});

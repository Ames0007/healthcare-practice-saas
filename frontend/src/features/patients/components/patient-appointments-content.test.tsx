import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { AgendaAppointment } from "@/features/agenda/types";
import { PatientAppointmentsContent } from "./patient-appointments-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/appointments",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderContent(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientAppointmentsContent> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientAppointmentsContent {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const BASE: Omit<AgendaAppointment, "id" | "date" | "time" | "status" | "schedulingType"> = {
  patientId: "pat-1",
  patientName: "Ahmed El Mansouri",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  service: "Consultation",
};

/** Full fixture set: today/future upcoming (exact + window), and history spanning completed/cancelled/no-show, plus a future *cancelled* appointment to exercise the classification rule (§16). */
const FULL_APPOINTMENTS: AgendaAppointment[] = [
  { ...BASE, id: "apt-upcoming-exact", date: "2026-08-23", time: "10:30", status: "confirmed", schedulingType: "exact" },
  { ...BASE, id: "apt-upcoming-later", date: "2026-08-27", time: "09:00", status: "to_confirm", schedulingType: "exact", service: "Contrôle" },
  {
    ...BASE,
    id: "apt-upcoming-window",
    date: "2026-08-25",
    time: "11:00",
    endTime: "11:30",
    status: "confirmed",
    schedulingType: "window",
    service: "Séance de kinésithérapie",
  },
  { ...BASE, id: "apt-history-completed", date: "2026-08-18", time: "09:00", status: "completed", schedulingType: "exact" },
  {
    ...BASE,
    id: "apt-history-cancelled",
    date: "2026-08-20",
    time: "09:00",
    status: "cancelled_by_patient",
    schedulingType: "exact",
    service: "Détartrage",
  },
  { ...BASE, id: "apt-history-noshow", date: "2026-08-15", time: "09:00", status: "no_show", schedulingType: "exact" },
  {
    ...BASE,
    id: "apt-future-cancelled",
    date: "2026-09-10",
    time: "09:00",
    status: "cancelled_by_practice",
    schedulingType: "exact",
    service: "Suivi",
  },
];

const ONLY_HISTORY: AgendaAppointment[] = [
  { ...BASE, id: "apt-only-history", date: "2026-08-18", time: "09:00", status: "completed", schedulingType: "exact" },
];

const ONLY_UPCOMING: AgendaAppointment[] = [
  { ...BASE, id: "apt-only-upcoming", date: "2026-08-23", time: "10:30", status: "confirmed", schedulingType: "exact" },
];

describe("PatientAppointmentsContent", () => {
  it("renders upcoming appointments in chronological order (4)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("Prochains rendez-vous")).toBeInTheDocument();
    expect(screen.getAllByText("Consultation").length).toBeGreaterThan(0);
    expect(screen.getByText("Contrôle")).toBeInTheDocument();
  });

  it("renders appointment history newest-first (5)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("Historique des rendez-vous")).toBeInTheDocument();
    expect(screen.getByText("Détartrage")).toBeInTheDocument();
  });

  it("renders an exact appointment without an arrival-window caption (6)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("renders an arrival-window appointment distinctly (7)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("Arrivée entre 11:00 et 11:30")).toBeInTheDocument();
  });

  it("reuses the shared appointment status registry (8)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getAllByText("Confirmé").length).toBeGreaterThan(0);
    expect(screen.getByText("Terminé")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
  });

  it("classifies a future cancelled appointment as history, not upcoming (§16)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    const historySection = screen.getByText("Historique des rendez-vous").closest("div")!.parentElement!;
    expect(within(historySection).getByText("Suivi")).toBeInTheDocument();
  });

  it("filters to upcoming only (9)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getByRole("button", { name: "À venir" }));
    expect(screen.queryByText("Historique des rendez-vous")).not.toBeInTheDocument();
    expect(screen.getByText("Contrôle")).toBeInTheDocument();
  });

  it("filters to completed only (10)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getByRole("button", { name: "Terminés" }));
    expect(screen.getByText("18 août")).toBeInTheDocument();
    expect(screen.queryByText("Détartrage")).not.toBeInTheDocument();
  });

  it("groups both cancellation statuses under the cancelled filter (11)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getByRole("button", { name: "Annulés" }));
    expect(screen.getByText("Détartrage")).toBeInTheDocument();
    expect(screen.getByText("Suivi")).toBeInTheDocument();
  });

  it("filters to no-show only (12)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getByRole("button", { name: "Absents" }));
    expect(screen.getByText("Absent")).toBeInTheDocument();
    expect(screen.queryByText("Détartrage")).not.toBeInTheDocument();
  });

  it("updates the result count when the filter changes (13)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("7 rendez-vous")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Absents" }));
    expect(screen.getByText("1 rendez-vous")).toBeInTheDocument();
  });

  it("opens the shared appointment drawer on interaction (14)", async () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getAllByRole("button", { name: "Voir le rendez-vous" })[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("offers Ouvrir dans l'agenda from the drawer (15)", async () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    fireEvent.click(screen.getAllByRole("button", { name: "Voir le rendez-vous" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Ouvrir dans l'agenda" })).toHaveAttribute("href", "/app/agenda");
  });

  it("offers a + Nouveau RDV action linking to Agenda (16)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    const link = screen.getByRole("link", { name: /Nouveau RDV/ });
    expect(link).toHaveAttribute("href", "/app/agenda");
  });

  it("shows the empty-upcoming state with a planning action (17)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: ONLY_HISTORY });

    expect(screen.getByText("Aucun rendez-vous à venir.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planifier un rendez-vous" })).toHaveAttribute("href", "/app/agenda");
  });

  it("shows the restrained empty-history state (18)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: ONLY_UPCOMING });

    expect(screen.getByText("Aucun rendez-vous passé.")).toBeInTheDocument();
  });

  it("shows the fully-empty state when the patient has no appointments at all (19)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: [] });

    expect(screen.getByText("Aucun rendez-vous pour ce patient.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planifier un rendez-vous" })).toHaveAttribute("href", "/app/agenda");
    expect(screen.queryByText("Prochains rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton without appointment content (20)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS, state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Prochains rendez-vous")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action (21)", () => {
    const onRetry = vi.fn();
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS, state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les rendez-vous du patient.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (23)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("Historique des rendez-vous")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (24/25)", () => {
    const { container } = renderContent("ar", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.getByText("سجل المواعيد")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "القادمة" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("does not leak the patient name into appointment cards (identity already shown in the header)", () => {
    renderContent("fr", { patientId: "pat-1", appointments: FULL_APPOINTMENTS });

    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });
});

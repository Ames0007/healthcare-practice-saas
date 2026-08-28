import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import type { TodayAppointment } from "@/features/today/types";
import { NextAppointmentSection } from "./next-appointment-section";

const APPOINTMENT: TodayAppointment = {
  id: "apt-4",
  time: "10:30",
  patientName: "Ahmed El Mansouri",
  service: "Consultation",
  status: "confirmed",
  practitioner: "Dr Amal Idrissi",
};

function renderSection(appointment: TodayAppointment = APPOINTMENT, onMarkArrived = vi.fn()) {
  return render(
    <LocaleProvider initialLocale="fr">
      <NextAppointmentSection appointment={appointment} onMarkArrived={onMarkArrived} />
    </LocaleProvider>,
  );
}

/**
 * UI-FIX regression guard: "Ouvrir" previously had no `onClick`/`href` at
 * all — a genuinely dead control (Aujourd'hui's own `TodayAppointment.id`
 * is a reduced fixture id, not a real Agenda appointment id, so this must
 * navigate to Agenda generically rather than guess a specific appointment).
 */
describe("NextAppointmentSection", () => {
  it("renders Ouvrir as a real link to Agenda", () => {
    renderSection();

    const openLink = screen.getByRole("link", { name: "Ouvrir" });
    expect(openLink).toHaveAttribute("href", "/app/agenda");
  });

  it("still calls onMarkArrived when the appointment can be marked arrived", () => {
    const onMarkArrived = vi.fn();
    renderSection(APPOINTMENT, onMarkArrived);

    fireEvent.click(screen.getByRole("button", { name: "Patient arrivé" }));
    expect(onMarkArrived).toHaveBeenCalledWith("apt-4");
  });

  it("does not render Patient arrivé for a completed appointment", () => {
    renderSection({ ...APPOINTMENT, status: "completed" });
    expect(screen.queryByRole("button", { name: "Patient arrivé" })).not.toBeInTheDocument();
  });
});

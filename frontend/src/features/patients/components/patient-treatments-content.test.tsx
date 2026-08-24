import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { TreatmentPlan } from "@/components/domain/treatments/types";
import { PatientTreatmentsContent } from "./patient-treatments-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/treatments",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderContent(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientTreatmentsContent> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientTreatmentsContent {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

function buildSession(planId: string, n: number, overrides: Partial<TreatmentPlan["sessions"][number]> = {}) {
  return {
    id: `${planId}-s${n}`,
    treatmentPlanId: planId,
    sequenceNumber: n,
    status: "unscheduled" as const,
    ...overrides,
  };
}

const ACTIVE_PLAN: TreatmentPlan = {
  id: "tp-active",
  patientId: "pat-1",
  title: "Rééducation genou",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  startDate: "2026-08-10",
  plannedSessions: 20,
  status: "active",
  sessions: [
    ...Array.from({ length: 12 }, (_, i) =>
      buildSession("tp-active", i + 1, {
        status: "completed",
        scheduledDate: "2026-08-11",
        scheduledTime: "15:00",
        completedAt: "2026-08-11",
        practitionerName: "Dr. Benali",
        appointmentId: "RDV-2026-1000",
      }),
    ),
    buildSession("tp-active", 13, {
      status: "scheduled",
      scheduledDate: "2026-08-26",
      scheduledTime: "15:00",
      practitionerName: "Dr. Benali",
    }),
    ...Array.from({ length: 7 }, (_, i) => buildSession("tp-active", 14 + i)),
  ],
};

const COMPLETED_PLAN: TreatmentPlan = {
  id: "tp-completed",
  patientId: "pat-1",
  title: "Rééducation épaule",
  practitionerId: "pr-2",
  practitionerName: "Dr. Amal",
  startDate: "2026-07-01",
  plannedSessions: 10,
  status: "completed",
  completedDate: "2026-07-15",
  sessions: Array.from({ length: 10 }, (_, i) =>
    buildSession("tp-completed", i + 1, { status: "completed", scheduledDate: "2026-07-05", practitionerName: "Dr. Amal" }),
  ),
};

describe("PatientTreatmentsContent", () => {
  it("renders the active treatment with practitioner and start date (4)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    expect(screen.getByText("Rééducation genou")).toBeInTheDocument();
    expect(screen.getByText("Dr. Benali")).toBeInTheDocument();
  });

  it("renders planned/completed session counts (5/6)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    expect(screen.getByText("12 / 20 séances")).toBeInTheDocument();
  });

  it("exposes an accessible progress bar (7)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    const bar = screen.getByRole("progressbar", { name: "Progression du traitement" });
    expect(bar).toHaveAttribute("aria-valuenow", "12");
    expect(bar).toHaveAttribute("aria-valuemax", "20");
  });

  it("renders the next session (8)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    expect(screen.getByText(/26 août/)).toBeInTheDocument();
  });

  it("renders the completed-treatment section in a dense presentation (10)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN, COMPLETED_PLAN] });

    expect(screen.getByText("Traitements terminés")).toBeInTheDocument();
    expect(screen.getByText("Rééducation épaule")).toBeInTheDocument();
    expect(screen.getByText(/Terminé le 15 juillet/)).toBeInTheDocument();
  });

  it("shows the no-active-treatment message while still listing completed plans (11)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [COMPLETED_PLAN] });

    expect(screen.getByText("Aucun traitement actif.")).toBeInTheDocument();
    expect(screen.getByText("Rééducation épaule")).toBeInTheDocument();
  });

  it("shows the fully-empty state when the patient has no treatment plans (12)", () => {
    renderContent("fr", { patientId: "pat-2", plans: [ACTIVE_PLAN, COMPLETED_PLAN] });

    expect(screen.getByText("Aucun traitement pour ce patient.")).toBeInTheDocument();
    expect(screen.queryByText("Traitement actif")).not.toBeInTheDocument();
  });

  it("opens and closes the treatment drawer with the session tracker (9/13/14)", async () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: "Voir le traitement" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Séances")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Séance 13/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows completed session detail without clinical content (15/21)", async () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: "Voir le traitement" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /Séance 1 —/ }));
    expect(within(dialog).getByText("Séance 1 / 20")).toBeInTheDocument();
    expect(within(dialog).getByText("Terminée")).toBeInTheDocument();
    expect(within(dialog).getByText("RDV-2026-1000")).toBeInTheDocument();
    expect(within(dialog).queryByText(/diagnostic/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/allerg/i)).not.toBeInTheDocument();
  });

  it("shows scheduled session detail with an Open-in-Agenda action (16/18)", async () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: "Voir le traitement" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /Séance 13 —/ }));
    expect(within(dialog).getByText("Séance 13 / 20")).toBeInTheDocument();
    expect(within(dialog).getByText("Planifiée")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Ouvrir dans l'agenda" })).toHaveAttribute("href", "/app/agenda");
  });

  it("shows unscheduled session detail with a Plan-session action (17/19)", async () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: "Voir le traitement" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /Séance 14 —/ }));
    expect(within(dialog).getByText("Séance 14 / 20")).toBeInTheDocument();
    expect(within(dialog).getByText("À planifier")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Planifier la séance" })).toHaveAttribute("href", "/app/agenda");
  });

  it("shows a billing link but no finance figures inside the treatment drawer (20)", async () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: "Voir le traitement" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("link", { name: "Voir la facturation" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/invoices",
    );
    expect(within(dialog).queryByText(/Facturé/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Payé/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Reste/)).not.toBeInTheDocument();
  });

  it("shows the loading skeleton without treatment content (22)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN], state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Rééducation genou")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action (23)", () => {
    const onRetry = vi.fn();
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN], state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les traitements du patient.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (25)", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    expect(screen.getByText("Traitement actif")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (26/27)", () => {
    const { container } = renderContent("ar", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    expect(screen.getByText("العلاج الجاري")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض العلاج" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("shows a future-feature notice for + Nouveau traitement instead of a creation form", () => {
    renderContent("fr", { patientId: "pat-1", plans: [ACTIVE_PLAN] });

    fireEvent.click(screen.getByRole("button", { name: /Nouveau traitement/ }));
    expect(screen.getByText("La création d'un traitement sera connectée au workflow métier ultérieurement.")).toBeInTheDocument();
  });
});

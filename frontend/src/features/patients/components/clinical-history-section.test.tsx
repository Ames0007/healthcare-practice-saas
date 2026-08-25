import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { ClinicalEncounter } from "@/components/domain/clinical/types";
import { ClinicalHistorySection } from "./clinical-history-section";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderSection(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof ClinicalHistorySection> = { patientId: "pat-1", patientName: "Ahmed El Mansouri" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ClinicalHistorySection {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

const CONSULTATION_WITH_APPOINTMENT: ClinicalEncounter = {
  id: "enc-c1",
  patientId: "pat-1",
  encounterType: "consultation",
  date: "2026-08-23",
  time: "10:00",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  appointmentId: "RDV-2026-1042",
  status: "completed",
  reason: "Douleur au genou",
  observations: "Douleur à la flexion.",
  assessment: "Gonalgie mécanique.",
  plan: "Réévaluation dans 2 semaines.",
};

const CONSULTATION_NO_APPOINTMENT: ClinicalEncounter = {
  id: "enc-c2",
  patientId: "pat-1",
  encounterType: "consultation",
  date: "2026-08-18",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  status: "completed",
  reason: "Suivi",
  observations: "Amélioration.",
  assessment: "Évolution favorable.",
  plan: "Poursuite du programme.",
};

const SESSION_WITH_TREATMENT: ClinicalEncounter = {
  id: "enc-s1",
  patientId: "pat-1",
  encounterType: "session",
  date: "2026-08-15",
  time: "15:00",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  appointmentId: "RDV-2026-1005",
  status: "completed",
  treatmentPlanId: "tp-1",
  treatmentPlanTitle: "Rééducation genou",
  sessionSequenceNumber: 6,
  sessionTotalCount: 20,
};

const FULL_HISTORY = [CONSULTATION_WITH_APPOINTMENT, CONSULTATION_NO_APPOINTMENT, SESSION_WITH_TREATMENT];

describe("ClinicalHistorySection", () => {
  it("renders the Historique clinique heading (3)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByText("Historique clinique")).toBeInTheDocument();
  });

  it("renders consultation events with motif preview (4)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getAllByText("Consultation")).toHaveLength(2);
    expect(screen.getByText("Douleur au genou")).toBeInTheDocument();
    expect(screen.getByText("Suivi")).toBeInTheDocument();
  });

  it("renders session events (5)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByText("Séance 6 / 20")).toBeInTheDocument();
    expect(screen.getByText("Rééducation genou")).toBeInTheDocument();
  });

  it("orders history newest first regardless of prop insertion order (6)", () => {
    renderSection("fr", {
      patientId: "pat-1",
      patientName: "Ahmed El Mansouri",
      encounters: [SESSION_WITH_TREATMENT, CONSULTATION_NO_APPOINTMENT, CONSULTATION_WITH_APPOINTMENT],
    });
    const dateHeadings = screen.getAllByText(/août 2026/).map((node) => node.textContent);
    expect(dateHeadings).toEqual(["23 août 2026", "18 août 2026", "15 août 2026"]);
  });

  it("groups events under one date heading (7)", () => {
    const sameDaySession: ClinicalEncounter = { ...SESSION_WITH_TREATMENT, id: "enc-s2", date: "2026-08-23", time: "16:00" };
    renderSection("fr", {
      patientId: "pat-1",
      patientName: "Ahmed El Mansouri",
      encounters: [CONSULTATION_WITH_APPOINTMENT, sameDaySession],
    });
    expect(screen.getAllByText("23 août 2026")).toHaveLength(1);
  });

  it("filters to consultations only (9)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getByRole("button", { name: "Consultations" }));
    expect(screen.getAllByText("Consultation")).toHaveLength(2);
    expect(screen.queryByText("Séance 6 / 20")).not.toBeInTheDocument();
  });

  it("filters to sessions only (10)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getByRole("button", { name: "Séances" }));
    expect(screen.getByText("Séance 6 / 20")).toBeInTheDocument();
    expect(screen.queryByText("Consultation")).not.toBeInTheDocument();
  });

  it("shows the filtered-empty message, not the global empty state, when a filter yields nothing (11)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: [CONSULTATION_WITH_APPOINTMENT] });
    fireEvent.click(screen.getByRole("button", { name: "Séances" }));
    expect(screen.getByText("Aucun élément ne correspond à ce filtre.")).toBeInTheDocument();
    expect(screen.queryByText("Aucun historique clinique pour ce patient.")).not.toBeInTheDocument();
  });

  it("shows the result count and updates it per filter (12)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByText("3 événements")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Consultations" }));
    expect(screen.getByText("2 événements")).toBeInTheDocument();
  });

  it("opens the read-only consultation detail via Voir la consultation (13)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(dialog).toBeInTheDocument();
  });

  it("closes the consultation detail drawer (14)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog", { name: "Consultation" })).not.toBeInTheDocument();
  });

  it("renders the structured reason (15)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Motif")).toBeInTheDocument();
    expect(within(dialog).getByText("Douleur au genou")).toBeInTheDocument();
  });

  it("renders the structured observations (16)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Observations")).toBeInTheDocument();
    expect(within(dialog).getByText("Douleur à la flexion.")).toBeInTheDocument();
  });

  it("renders the structured assessment (17)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Évaluation")).toBeInTheDocument();
    expect(within(dialog).getByText("Gonalgie mécanique.")).toBeInTheDocument();
  });

  it("renders the structured plan (18)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Plan")).toBeInTheDocument();
    expect(within(dialog).getByText("Réévaluation dans 2 semaines.")).toBeInTheDocument();
  });

  it("renders patient/practitioner/date context in the drawer (19)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Ahmed El Mansouri")).toBeInTheDocument();
    expect(within(dialog).getByText("Dr. Benali")).toBeInTheDocument();
    expect(within(dialog).getByText(/23 août 2026/)).toBeInTheDocument();
  });

  it("shows the associated appointment only when present (20)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });

    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    let dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).getByText("Rendez-vous associé")).toBeInTheDocument();
    expect(within(dialog).getByText("RDV-2026-1042")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Voir le rendez-vous" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/appointments",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Fermer" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[1]);
    dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).queryByText("Rendez-vous associé")).not.toBeInTheDocument();
  });

  it("links a session to its treatment plan (21)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByRole("link", { name: "Voir le traitement" })).toHaveAttribute("href", "/app/patients/pat-1/treatments");
  });

  it("never exposes edit/delete/reopen on a historical consultation (22)", async () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    fireEvent.click(screen.getAllByRole("button", { name: "Voir la consultation" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Consultation" });
    expect(within(dialog).queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Réouvrir/ })).not.toBeInTheDocument();
  });

  it("shows no prescription/document UI (23)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.queryByText(/Prescription/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Document/)).not.toBeInTheDocument();
  });

  it("shows no finance content in the clinical history (24)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.queryByText(/Facturé/)).not.toBeInTheDocument();
    expect(screen.queryByText(/MAD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Solde/)).not.toBeInTheDocument();
  });

  it("shows no consultation-creation affordance (37)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.queryByText(/Nouvelle consultation/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nouvelle entrée/)).not.toBeInTheDocument();
  });

  it("shows the empty-history state for a patient with no clinical encounters (27)", () => {
    renderSection("fr", { patientId: "pat-2", patientName: "Sara Alaoui", encounters: [] });
    expect(screen.getByText("Aucun historique clinique pour ce patient.")).toBeInTheDocument();
    expect(screen.getByText("Les consultations et séances terminées apparaîtront ici.")).toBeInTheDocument();
  });

  it("renders French content by default (31)", () => {
    renderSection("fr", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByText("Historique clinique")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (32/33)", () => {
    const { container } = renderSection("ar", { patientId: "pat-1", patientName: "Ahmed El Mansouri", encounters: FULL_HISTORY });
    expect(screen.getByText("السجل السريري")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "عرض الاستشارة" })).toHaveLength(2);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

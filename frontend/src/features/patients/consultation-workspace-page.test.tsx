import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { ActiveConsultation, MedicalProfile } from "@/components/domain/clinical/types";
import type { Patient } from "@/features/patients/types";
import { ConsultationWorkspacePage } from "./consultation-workspace-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/consultations/cons-1",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPage(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof ConsultationWorkspacePage> = { patientId: "pat-1", consultationId: "cons-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <ConsultationWorkspacePage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const PATIENT_1: Patient = {
  id: "pat-1",
  patientNumber: "PAT-00281",
  firstName: "Ahmed",
  lastName: "El Mansouri",
  phone: "06 12 34 56 78",
  responsiblePractitionerId: "pr-1",
  responsiblePractitionerName: "Dr. Benali",
  lastVisit: "2026-08-23",
  nextAppointment: null,
  outstandingBalance: 1500,
};

const PATIENT_4: Patient = {
  id: "pat-4",
  patientNumber: "PAT-00284",
  firstName: "Youssef",
  lastName: "Amrani",
  phone: "06 45 67 89 01",
  responsiblePractitionerId: "pr-2",
  responsiblePractitionerName: "Dr. Amal",
  lastVisit: "2026-08-23",
  nextAppointment: null,
  outstandingBalance: 0,
};

const DRAFT_CONSULTATION: ActiveConsultation = {
  id: "cons-1",
  patientId: "pat-1",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  appointmentId: "RDV-2026-1043",
  date: "2026-08-23",
  time: "15:30",
  status: "draft",
  reason: "Contrôle post-traitement",
  observations: "Amélioration progressive.",
  assessment: "",
  plan: "",
};

const COMPLETED_CONSULTATION: ActiveConsultation = {
  id: "cons-2",
  patientId: "pat-4",
  practitionerId: "pr-2",
  practitionerName: "Dr. Amal",
  date: "2026-08-20",
  time: "09:30",
  status: "completed",
  reason: "Contrôle dentaire de routine",
  observations: "Aucune carie détectée.",
  assessment: "Bonne hygiène bucco-dentaire.",
  plan: "Prochain contrôle dans 6 mois.",
  completedAt: "2026-08-20",
};

const PROFILE_PAT1: MedicalProfile = {
  patientId: "pat-1",
  allergies: [{ id: "a1", masterDataId: "mdi-allergy-penicilline", label: "Pénicilline", custom: false, importance: "important" }],
  medicalHistory: [{ id: "h1", masterDataId: "mdi-history-hta", label: "Hypertension artérielle", custom: false }],
  currentMedications: [{ id: "m1", masterDataId: "mdi-medication-amlodipine", label: "Amlodipine", custom: false }],
  importantNotes: ["Précaution particulière avant intervention."],
  lastUpdatedAt: "2026-08-23",
  lastUpdatedBy: "Dr. Benali",
};

const PATIENTS = [PATIENT_1, PATIENT_4];

describe("ConsultationWorkspacePage", () => {
  it("renders the active consultation route with patient context (1/2)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    expect(screen.getByText("PAT-00281")).toBeInTheDocument();
    expect(screen.getByText("Dr. Benali")).toBeInTheDocument();
  });

  it("renders the important MedicalProfile context read-only (3/4)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Informations importantes")).toBeInTheDocument();
    expect(screen.getByText("Pénicilline")).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Hypertension artérielle")).toBeInTheDocument();
    expect(screen.getByText("Amlodipine")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
  });

  it("renders the draft status badge (5)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("renders the reason/observations/assessment/plan fields (6/7/8/9)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByLabelText("Motif de consultation *")).toHaveValue("Contrôle post-traitement");
    expect(screen.getByLabelText("Observations")).toHaveValue("Amélioration progressive.");
    expect(screen.getByLabelText("Évaluation")).toHaveValue("");
    expect(screen.getByLabelText("Plan")).toHaveValue("");
  });

  it("saves a draft and shows success feedback while remaining editable (10/11/12)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    fireEvent.change(screen.getByLabelText("Observations"), { target: { value: "Nouvelle observation." } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));

    expect(screen.getByText("Brouillon enregistré.")).toBeInTheDocument();
    expect(screen.getByLabelText("Observations")).toHaveValue("Nouvelle observation.");
    expect(screen.getByLabelText("Observations")).not.toBeDisabled();
  });

  it("shows the unsaved-changes indicator only while dirty", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.queryByText("Modifications non enregistrées")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "Nouveau plan." } });
    expect(screen.getByText("Modifications non enregistrées")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));
    expect(screen.queryByText("Modifications non enregistrées")).not.toBeInTheDocument();
  });

  it("blocks completion without a required reason (13)", () => {
    const draftNoReason: ActiveConsultation = { ...DRAFT_CONSULTATION, reason: "" };
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [draftNoReason],
      profiles: [PROFILE_PAT1],
    });

    fireEvent.click(screen.getByRole("button", { name: "Terminer la consultation" }));

    expect(screen.getByText("Le motif de consultation est requis.")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", { name: "Terminer la consultation ?" })).not.toBeInTheDocument();
  });

  it("opens a confirmation dialog before completing (14)", async () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    fireEvent.click(screen.getByRole("button", { name: "Terminer la consultation" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Terminer la consultation ?" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/historique clinique/)).toBeInTheDocument();
  });

  it("cancelling the confirmation keeps the consultation in draft (15)", async () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    fireEvent.click(screen.getByRole("button", { name: "Terminer la consultation" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Terminer la consultation ?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("alertdialog", { name: "Terminer la consultation ?" })).not.toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    expect(screen.getByLabelText("Motif de consultation *")).toBeInTheDocument();
  });

  it("confirming completion changes state and uses current form values (16/24)", async () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    fireEvent.change(screen.getByLabelText("Évaluation"), { target: { value: "Évaluation finale." } });
    fireEvent.click(screen.getByRole("button", { name: "Terminer la consultation" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Terminer la consultation ?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Terminer" }));

    expect(screen.getByText("Consultation terminée.")).toBeInTheDocument();
    expect(screen.getByText("Terminée")).toBeInTheDocument();
    expect(screen.getByText("Évaluation finale.")).toBeInTheDocument();
  });

  it("renders the completed status and a read-only form (17/18)", () => {
    renderPage("fr", {
      patientId: "pat-4",
      consultationId: "cons-2",
      patients: PATIENTS,
      consultations: [COMPLETED_CONSULTATION],
      profiles: [],
    });

    expect(screen.getByText("Terminée")).toBeInTheDocument();
    expect(screen.queryByLabelText("Motif de consultation *")).not.toBeInTheDocument();
    expect(screen.getByText("Motif")).toBeInTheDocument();
    expect(screen.getByText("Contrôle dentaire de routine")).toBeInTheDocument();
  });

  it("hides draft/complete actions once completed (19/20)", () => {
    renderPage("fr", {
      patientId: "pat-4",
      consultationId: "cons-2",
      patients: PATIENTS,
      consultations: [COMPLETED_CONSULTATION],
      profiles: [],
    });

    expect(screen.queryByRole("button", { name: "Enregistrer le brouillon" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Terminer la consultation" })).not.toBeInTheDocument();
  });

  it("never exposes edit/delete/reopen on a completed consultation (21/22/23)", () => {
    renderPage("fr", {
      patientId: "pat-4",
      consultationId: "cons-2",
      patients: PATIENTS,
      consultations: [COMPLETED_CONSULTATION],
      profiles: [],
    });

    expect(screen.queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Réouvrir/ })).not.toBeInTheDocument();
  });

  it("shows the associated appointment when present (25)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Rendez-vous associé")).toBeInTheDocument();
    expect(screen.getByText("RDV-2026-1043")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voir le rendez-vous" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/appointments",
    );
  });

  it("omits the associated-appointment note when absent", () => {
    renderPage("fr", {
      patientId: "pat-4",
      consultationId: "cons-2",
      patients: PATIENTS,
      consultations: [COMPLETED_CONSULTATION],
      profiles: [],
    });

    expect(screen.queryByText("Rendez-vous associé")).not.toBeInTheDocument();
  });

  it("shows no prescription/document UI (26/27)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.queryByText(/Ordonnance/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Prescription/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Document/)).not.toBeInTheDocument();
  });

  it("shows no finance content (28)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.queryByText(/Solde/)).not.toBeInTheDocument();
    expect(screen.queryByText(/MAD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Facturé/)).not.toBeInTheDocument();
  });

  it("shows the consultation-not-found state for an invalid consultation id (29)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-missing",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Consultation introuvable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour au dossier santé" })).toHaveAttribute(
      "href",
      "/app/patients/pat-1/health",
    );
  });

  it("shows the consultation-not-found state when the consultation belongs to a different patient", () => {
    renderPage("fr", {
      patientId: "pat-4",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [],
    });

    expect(screen.getByText("Consultation introuvable")).toBeInTheDocument();
  });

  it("patient-not-found takes precedence over consultation-not-found (30)", () => {
    renderPage("fr", {
      patientId: "pat-999",
      consultationId: "cons-missing",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Patient introuvable")).toBeInTheDocument();
    expect(screen.queryByText("Consultation introuvable")).not.toBeInTheDocument();
  });

  it("shows the loading skeleton without consultation content (31)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
      state: "loading",
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Informations importantes")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action (32)", () => {
    const onRetry = vi.fn();
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
      state: "error",
      onRetry,
    });

    expect(screen.getByText("Impossible de charger la consultation.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (33)", () => {
    renderPage("fr", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (34/35)", () => {
    const { container } = renderPage("ar", {
      patientId: "pat-1",
      consultationId: "cons-1",
      patients: PATIENTS,
      consultations: [DRAFT_CONSULTATION],
      profiles: [PROFILE_PAT1],
    });

    expect(screen.getByText("استشارة")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إنهاء الاستشارة" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { MedicalProfile } from "@/components/domain/clinical/types";
import { PatientHealthContent } from "./patient-health-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1/health",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderContent(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientHealthContent> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientHealthContent {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

const POPULATED_PROFILE: MedicalProfile = {
  patientId: "pat-1",
  allergies: [{ id: "a1", masterDataId: "mdi-allergy-penicilline", label: "Pénicilline", custom: false, importance: "important" }],
  medicalHistory: [{ id: "h1", masterDataId: "mdi-history-hta", label: "Hypertension artérielle", custom: false }],
  currentMedications: [{ id: "m1", masterDataId: "mdi-medication-amlodipine", label: "Amlodipine", custom: false }],
  importantNotes: ["Précaution particulière avant intervention."],
  lastUpdatedAt: "2026-08-23",
  lastUpdatedBy: "Dr. Benali",
};

const PARTIAL_PROFILE: MedicalProfile = {
  patientId: "pat-3",
  allergies: [],
  medicalHistory: [{ id: "h2", masterDataId: "mdi-history-asthme", label: "Asthme", custom: false }],
  currentMedications: [],
  importantNotes: [],
  lastUpdatedAt: "2026-07-10",
  lastUpdatedBy: "Dr. Amal",
};

describe("PatientHealthContent", () => {
  it("renders the allergy section with the important badge (4/18/21)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Allergies")).toBeInTheDocument();
    expect(screen.getByText("Pénicilline")).toBeInTheDocument();
    expect(screen.getByText("Important")).toBeInTheDocument();
  });

  it("renders the medical-history section (5)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Antécédents")).toBeInTheDocument();
    expect(screen.getByText("Hypertension artérielle")).toBeInTheDocument();
  });

  it("renders the current-medication section, distinct from TreatmentPlan (6)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Traitements en cours")).toBeInTheDocument();
    expect(screen.getByText("Amlodipine")).toBeInTheDocument();
  });

  it("renders the important-note section (7)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Notes importantes")).toBeInTheDocument();
    expect(screen.getByText("Précaution particulière avant intervention.")).toBeInTheDocument();
  });

  it("renders the last-updated metadata (8)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Dernière mise à jour 23 août 2026 · Dr. Benali")).toBeInTheDocument();
  });

  it("shows an inline empty sentence for Patient B's allergies while history stays populated (9)", () => {
    renderContent("fr", { patientId: "pat-3", profiles: [PARTIAL_PROFILE] });

    expect(screen.getByText("Aucune allergie renseignée.")).toBeInTheDocument();
    expect(screen.getByText("Asthme")).toBeInTheDocument();
  });

  it("shows the fully empty profile state with a Compléter action (10)", () => {
    renderContent("fr", { patientId: "pat-2", profiles: [POPULATED_PROFILE, PARTIAL_PROFILE] });

    expect(screen.getByText("Aucune information médicale importante renseignée.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compléter le dossier santé" })).toBeInTheDocument();
  });

  it("opens the edit drawer via Modifier (11)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    expect(dialog).toBeInTheDocument();
  });

  it("prefills existing entries as removable chips (12)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    expect(within(dialog).getByRole("button", { name: "Retirer Pénicilline" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Retirer Hypertension artérielle" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Retirer Amlodipine" })).toBeInTheDocument();
  });

  it("searches a predefined allergy (13)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    expect(within(dialog).getByRole("option", { name: "Amoxicilline" })).toBeInTheDocument();
  });

  it("searches a predefined history item (14)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Antécédents"), { target: { value: "Diab" } });
    expect(within(dialog).getByRole("option", { name: "Diabète" })).toBeInTheDocument();
  });

  it("searches a predefined medication (15)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Traitements en cours"), { target: { value: "Insu" } });
    expect(within(dialog).getByRole("option", { name: "Insuline" })).toBeInTheDocument();
  });

  it("adds a predefined entry (16)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    fireEvent.click(within(dialog).getByRole("option", { name: "Amoxicilline" }));
    expect(within(dialog).getByRole("button", { name: "Retirer Amoxicilline" })).toBeInTheDocument();
  });

  it("adds a custom entry not present in master data (17)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Réaction cutanée sévère" } });
    fireEvent.click(within(dialog).getByRole("option", { name: "+ Ajouter une valeur personnalisée" }));
    expect(within(dialog).getByRole("button", { name: "Retirer Réaction cutanée sévère" })).toBeInTheDocument();
  });

  it("removes an existing entry (18)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Retirer Pénicilline" }));
    expect(within(dialog).queryByRole("button", { name: "Retirer Pénicilline" })).not.toBeInTheDocument();
  });

  it("prevents selecting the same predefined entry twice (24)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    fireEvent.click(within(dialog).getByRole("option", { name: "Amoxicilline" }));

    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    expect(within(dialog).queryByRole("option", { name: "Amoxicilline" })).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "Retirer Amoxicilline" })).toHaveLength(1);
  });

  it("saves and updates the local profile, showing success and closing the drawer (19)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    fireEvent.click(within(dialog).getByRole("option", { name: "Amoxicilline" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    expect(screen.queryByRole("dialog", { name: "Modifier le dossier santé" })).not.toBeInTheDocument();
    expect(screen.getByText("Dossier santé mis à jour.")).toBeInTheDocument();
    expect(screen.getByText("Amoxicilline")).toBeInTheDocument();
  });

  it("cancel discards unsaved changes (20)", async () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const dialog = await screen.findByRole("dialog", { name: "Modifier le dossier santé" });
    fireEvent.change(within(dialog).getByLabelText("Allergies"), { target: { value: "Amox" } });
    fireEvent.click(within(dialog).getByRole("option", { name: "Amoxicilline" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog", { name: "Modifier le dossier santé" })).not.toBeInTheDocument();
    expect(screen.queryByText("Amoxicilline")).not.toBeInTheDocument();
    expect(screen.getByText("Pénicilline")).toBeInTheDocument();
  });

  it("shows no finance content in the clinical workspace (22)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.queryByText(/Facturé/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Encaisser/)).not.toBeInTheDocument();
    expect(screen.queryByText(/MAD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Solde/)).not.toBeInTheDocument();
  });

  it("shows no consultation-creation affordance or active-consultation UI (UI-005B §37)", () => {
    // UI-005A's own boundary test used to assert the entire absence of "Historique
    // clinique"/"Motif" content on this tab; UI-005B now legitimately adds a
    // read-only clinical-history timeline with exactly that content (see
    // clinical-history-section.test.tsx), so those two assertions are superseded,
    // not weakened. What remains genuinely out of scope is any consultation
    // *creation* affordance (§37) — never added here.
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE], encounters: [] });

    expect(screen.queryByText(/Nouvelle entrée/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nouvelle consultation/)).not.toBeInTheDocument();
  });

  it("renders the Documents and Prescriptions sections below Historique clinique (UI-005D)", () => {
    // UI-005B/C's own boundary test used to assert the entire absence of "Prescription"/
    // "Document" text on this tab; UI-005D now legitimately adds real Documents and
    // Ordonnances sections (see documents-section.test.tsx/prescriptions-section.test.tsx
    // for their own dedicated coverage), so that assertion is superseded, not weakened.
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ordonnances" })).toBeInTheDocument();
  });

  it("shows the loading skeleton without health content (25)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE], state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Informations importantes")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action (26)", () => {
    const onRetry = vi.fn();
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE], state: "error", onRetry });

    expect(screen.getByText("Impossible de charger le dossier santé.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (28)", () => {
    renderContent("fr", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("Informations importantes")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (29/30)", () => {
    const { container } = renderContent("ar", { patientId: "pat-1", profiles: [POPULATED_PROFILE] });

    expect(screen.getByText("المعلومات المهمة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تعديل" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

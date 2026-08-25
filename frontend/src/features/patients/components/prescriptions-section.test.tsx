import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import type { ClinicalEncounter, Prescription } from "@/components/domain/clinical/types";
import { PrescriptionsSection } from "./prescriptions-section";

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderSection(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PrescriptionsSection> = {
    patientId: "pat-1",
    practitionerId: "pr-1",
    practitionerName: "Dr. Benali",
  },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PrescriptionsSection {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

const PRESCRIPTION_1: Prescription = {
  id: "presc-1",
  prescriptionNumber: "ORD-2026-0018",
  patientId: "pat-1",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  issuedAt: "2026-08-23",
  consultationId: "enc-1",
  status: "issued",
  items: [
    { id: "presc-1-item-1", medication: "Paracétamol", dosage: "500 mg", frequency: "3 fois par jour", duration: "5 jours" },
    { id: "presc-1-item-2", medication: "Ibuprofène", dosage: "200 mg", frequency: "2 fois par jour" },
  ],
  instructions: "Arrêter en cas de douleur abdominale.",
};

const ENCOUNTER_1: ClinicalEncounter = {
  id: "enc-1",
  patientId: "pat-1",
  encounterType: "consultation",
  date: "2026-08-23",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  status: "completed",
  reason: "Douleur au genou",
};

describe("PrescriptionsSection", () => {
  it("renders the Ordonnances heading (14)", () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    expect(screen.getByText("Ordonnances")).toBeInTheDocument();
  });

  it("renders the prescription history (15)", () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    expect(screen.getByText("ORD-2026-0018")).toBeInTheDocument();
    expect(screen.getByText("2 médicaments")).toBeInTheDocument();
  });

  it("opens the prescription detail with structured items (16/17)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
      encounters: [ENCOUNTER_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "ORD-2026-0018" });
    expect(within(dialog).getByText("Paracétamol")).toBeInTheDocument();
    expect(within(dialog).getByText("Dosage: 500 mg")).toBeInTheDocument();
    expect(within(dialog).getByText("Fréquence: 3 fois par jour")).toBeInTheDocument();
    expect(within(dialog).getByText("Durée: 5 jours")).toBeInTheDocument();
    expect(within(dialog).getByText("Ibuprofène")).toBeInTheDocument();
    expect(within(dialog).getByText("Arrêter en cas de douleur abdominale.")).toBeInTheDocument();
  });

  it("shows the associated consultation date when resolvable (consultation relationship)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
      encounters: [ENCOUNTER_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "ORD-2026-0018" });
    expect(within(dialog).getByText("Consultation associée")).toBeInTheDocument();
    // The prescription's own issuedAt and the associated consultation's date are the
    // same day in this fixture (both 2026-08-23), so both render "23 août 2026".
    expect(within(dialog).getAllByText("23 août 2026")).toHaveLength(2);
  });

  it("never exposes edit/delete on an issued prescription (18)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "ORD-2026-0018" });
    expect(within(dialog).queryByRole("button", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Supprimer/ })).not.toBeInTheDocument();
  });

  it("PDF and print are future-feature notices only (29)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "Voir" }));
    const dialog = await screen.findByRole("dialog", { name: "ORD-2026-0018" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Télécharger PDF" }));
    expect(
      screen.getByText("La génération de l'ordonnance PDF sera connectée au moteur documentaire ultérieurement."),
    ).toBeInTheDocument();
  });

  it("opens the new-prescription form (19)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });
    expect(dialog).toBeInTheDocument();
  });

  it("requires medication, dosage and frequency (20/21/22)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Créer l'ordonnance" }));
    expect(within(dialog).getByText("Le médicament est requis.")).toBeInTheDocument();
    expect(within(dialog).getByText("Le dosage est requis.")).toBeInTheDocument();
    expect(within(dialog).getByText("La fréquence est requise.")).toBeInTheDocument();
  });

  it("adds and removes a second medication (23/24)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });

    fireEvent.click(within(dialog).getByRole("button", { name: "+ Ajouter un médicament" }));
    expect(within(dialog).getByText("Médicament 2")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Retirer le médicament 2" }));
    expect(within(dialog).queryByText("Médicament 2")).not.toBeInTheDocument();
  });

  it("cannot save with zero items (25)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });

    fireEvent.click(within(dialog).getByRole("button", { name: "Retirer le médicament 1" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Créer l'ordonnance" }));
    expect(within(dialog).getByText("Au moins un médicament est requis.")).toBeInTheDocument();
  });

  it("creates a valid prescription, closes the form, and shows the new prescription (26/27/28)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });

    fireEvent.change(within(dialog).getByLabelText("Médicament *"), { target: { value: "Amoxicilline" } });
    fireEvent.change(within(dialog).getByLabelText("Dosage *"), { target: { value: "1 g" } });
    fireEvent.change(within(dialog).getByLabelText("Fréquence *"), { target: { value: "2 fois par jour" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Créer l'ordonnance" }));

    expect(screen.queryByRole("dialog", { name: "Nouvelle ordonnance" })).not.toBeInTheDocument();
    expect(screen.getByText("Ordonnance créée.")).toBeInTheDocument();
    // Appears both in the refreshed list row and in the now-open detail drawer's heading.
    expect(screen.getAllByText("ORD-2026-0002").length).toBeGreaterThanOrEqual(1);

    const detailDialog = await screen.findByRole("dialog", { name: "ORD-2026-0002" });
    expect(within(detailDialog).getByText("Amoxicilline")).toBeInTheDocument();
  });

  it("shows the empty-prescriptions state (30)", () => {
    renderSection("fr", { patientId: "pat-2", practitionerId: "pr-1", practitionerName: "Dr. Benali", prescriptions: [] });
    expect(screen.getByText("Aucune ordonnance.")).toBeInTheDocument();
    expect(screen.getByText("Les ordonnances du patient apparaîtront ici.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nouvelle ordonnance" })).toBeInTheDocument();
  });

  it("shows no drug-recommendation, dosage-suggestion or interaction-checking UI (31/32)", async () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Nouvelle ordonnance" }));
    const dialog = await screen.findByRole("dialog", { name: "Nouvelle ordonnance" });
    expect(within(dialog).queryByRole("listbox")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/interaction/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/recommand/i)).not.toBeInTheDocument();
  });

  it("renders French content by default (38)", () => {
    renderSection("fr", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    expect(screen.getByText("Ordonnances")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (39/40)", () => {
    const { container } = renderSection("ar", {
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      prescriptions: [PRESCRIPTION_1],
    });
    expect(screen.getByText("الوصفات الطبية")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

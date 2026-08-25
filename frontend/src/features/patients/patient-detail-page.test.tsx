import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { PatientDetailPage } from "./patient-detail-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients/pat-1",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPatientDetail(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof PatientDetailPage> = { patientId: "pat-1" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientDetailPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("PatientDetailPage", () => {
  it("renders a valid patient route: identity, reference, phone and practitioner (1/2/3)", () => {
    renderPatientDetail();

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    expect(screen.getByText("PAT-00281")).toBeInTheDocument();
    expect(screen.getByText("06 12 34 56 78")).toBeInTheDocument();
    expect(screen.getByText("Dr. Benali")).toBeInTheDocument();
    expect(screen.getByText("34 ans")).toBeInTheDocument();
  });

  it("shows the next-appointment summary in both the header and the overview card (4)", () => {
    renderPatientDetail();

    expect(screen.getAllByText(/27 août/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10:30/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Consultation").length).toBeGreaterThan(0);
  });

  it("shows the balance summary in both the header and the overview card (5)", () => {
    renderPatientDetail();

    expect(screen.getAllByText("1 500 MAD").length).toBeGreaterThan(0);
  });

  it("shows the active-treatment summary with session progress (6)", () => {
    renderPatientDetail();

    expect(screen.getByText("Rééducation genou")).toBeInTheDocument();
    expect(screen.getByText("12 / 20 séances")).toBeInTheDocument();
  });

  it("shows the no-active-treatment state for a patient without one (7)", () => {
    renderPatientDetail("fr", { patientId: "pat-2" });

    expect(screen.getByText("Aucun traitement actif")).toBeInTheDocument();
  });

  it("shows the no-balance state for a patient without an outstanding balance (8)", () => {
    renderPatientDetail("fr", { patientId: "pat-2" });

    expect(screen.getAllByText("Aucun solde à payer").length).toBeGreaterThan(0);
  });

  it("shows the next-installment summary (9)", () => {
    renderPatientDetail();

    expect(screen.getByText("1 septembre")).toBeInTheDocument();
    expect(screen.getAllByText("500 MAD").length).toBeGreaterThan(0);
  });

  it("renders all six patient tabs with Aperçu active by default (10/11)", () => {
    renderPatientDetail();

    const nav = screen.getByRole("navigation", { name: "Sections du patient" });
    ["Aperçu", "Dossier Santé", "Rendez-vous", "Traitements / Séances", "Factures", "Paiements"].forEach((label) => {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    });

    expect(within(nav).getByRole("link", { name: "Aperçu" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Dossier Santé" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the header and tabs visible on a future-placeholder tab (12)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "health" });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sections du patient" })).toBeInTheDocument();
    expect(screen.getByText("Cette section sera implémentée dans UI-005.")).toBeInTheDocument();
  });

  it("renders the recent-activity timeline without leaking clinical detail (13/14)", () => {
    renderPatientDetail();

    expect(screen.getByText("Consultation terminée")).toBeInTheDocument();
    expect(screen.getByText("Document ajouté")).toBeInTheDocument();
    expect(screen.getByText("Rendez-vous confirmé")).toBeInTheDocument();
    expect(screen.getByText("Séance effectuée")).toBeInTheDocument();
    expect(screen.getByText("Paiement")).toBeInTheDocument();

    expect(screen.queryByText(/allerg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/diagnostic/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pénicilline/i)).not.toBeInTheDocument();
  });

  it("shows a not-found state for an unknown patient id (15)", () => {
    renderPatientDetail("fr", { patientId: "pat-999" });

    expect(screen.getByText("Patient introuvable")).toBeInTheDocument();
    const backLink = screen.getByRole("link", { name: "Retour aux patients" });
    expect(backLink).toHaveAttribute("href", "/app/patients");
    expect(screen.queryByRole("navigation", { name: "Sections du patient" })).not.toBeInTheDocument();
  });

  it("renders the loading skeleton without patient content (16)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action (17)", () => {
    const onRetry = vi.fn();
    renderPatientDetail("fr", { patientId: "pat-1", state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les informations du patient.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (18)", () => {
    renderPatientDetail();

    expect(screen.getAllByText("Prochain RDV").length).toBeGreaterThan(0);
    expect(screen.getByText("Activité récente")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (19/20)", () => {
    const { container } = renderPatientDetail("ar", { patientId: "pat-1" });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "نظرة عامة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الملف الصحي" })).toBeInTheDocument();
    expect(screen.getByText("النشاط الأخير")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("exposes header actions, with a future-feature notice for Facturer/Encaisser/Plus (21)", () => {
    renderPatientDetail();

    const newAppointment = screen.getByRole("link", { name: "+ RDV" });
    expect(newAppointment).toHaveAttribute("href", "/app/agenda");

    fireEvent.click(screen.getByRole("button", { name: "Facturer" }));
    expect(screen.getByText("Disponible dans une prochaine étape.")).toBeInTheDocument();
  });

  it("isolates the patient number and phone in LTR spans inside RTL layout (22)", () => {
    renderPatientDetail("ar", { patientId: "pat-1" });

    expect(screen.getByText("PAT-00281")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("06 12 34 56 78")).toHaveAttribute("dir", "ltr");
  });

  it("renders real Rendez-vous content with the header and active tab preserved (UI-004B 1/2/3)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "appointments" });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Sections du patient" });
    expect(within(nav).getByRole("link", { name: "Rendez-vous" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Prochains rendez-vous")).toBeInTheDocument();
    expect(screen.queryByText("Cette section sera implémentée dans une prochaine étape.")).not.toBeInTheDocument();
  });

  it("keeps the not-found state for an invalid patient on the Rendez-vous tab (UI-004B 22)", () => {
    renderPatientDetail("fr", { patientId: "pat-999", activeTab: "appointments" });

    expect(screen.getByText("Patient introuvable")).toBeInTheDocument();
    expect(screen.queryByText("Prochains rendez-vous")).not.toBeInTheDocument();
  });

  it("renders real Traitements/Séances content with the header and active tab preserved (UI-004C 1/2/3)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "treatments" });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Sections du patient" });
    expect(within(nav).getByRole("link", { name: "Traitements / Séances" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Traitement actif")).toBeInTheDocument();
    expect(screen.queryByText("Cette section sera implémentée dans une prochaine étape.")).not.toBeInTheDocument();
  });

  it("keeps the overview and Treatments-tab session counts consistent for the same patient (UI-004C §33)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "overview" });
    expect(screen.getByText("12 / 20 séances")).toBeInTheDocument();
  });

  it("keeps the not-found state for an invalid patient on the Treatments tab (UI-004C 24)", () => {
    renderPatientDetail("fr", { patientId: "pat-999", activeTab: "treatments" });

    expect(screen.getByText("Patient introuvable")).toBeInTheDocument();
    expect(screen.queryByText("Traitement actif")).not.toBeInTheDocument();
  });

  it("renders real Factures content with the header and active tab preserved (UI-004D 1/2/3)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "invoices" });

    expect(screen.getByRole("heading", { level: 1, name: "Ahmed El Mansouri" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Sections du patient" });
    expect(within(nav).getByRole("link", { name: "Factures" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Total facturé")).toBeInTheDocument();
    expect(screen.queryByText("Cette section sera implémentée dans une prochaine étape.")).not.toBeInTheDocument();
  });

  it("keeps the header balance consistent with the centralized invoice fixtures (UI-004D §15-16/39)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "invoices" });

    expect(screen.getAllByText("1 500 MAD").length).toBeGreaterThan(0);
  });

  it("keeps the overview next-installment consistent with the centralized invoice fixtures (UI-004D §15-16/40)", () => {
    renderPatientDetail("fr", { patientId: "pat-1", activeTab: "overview" });

    expect(screen.getByText("1 septembre")).toBeInTheDocument();
    expect(screen.getAllByText("500 MAD").length).toBeGreaterThan(0);
  });

  it("keeps the not-found state for an invalid patient on the Factures tab (UI-004D 35)", () => {
    renderPatientDetail("fr", { patientId: "pat-999", activeTab: "invoices" });

    expect(screen.getByText("Patient introuvable")).toBeInTheDocument();
    expect(screen.queryByText("Total facturé")).not.toBeInTheDocument();
  });
});

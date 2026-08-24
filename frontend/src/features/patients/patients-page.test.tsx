import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { PatientsPage } from "./patients-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/patients",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderPatients(initialLocale: Locale = "fr", props: React.ComponentProps<typeof PatientsPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <PatientsPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("PatientsPage", () => {
  it("renders the Patients route (1)", () => {
    renderPatients();

    expect(screen.getByRole("heading", { level: 1, name: "Patients" })).toBeInTheDocument();
    expect(screen.getByText("Gérez les patients de votre cabinet.")).toBeInTheDocument();
  });

  it("renders patient rows (2)", () => {
    renderPatients();

    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sara Alaoui").length).toBeGreaterThan(0);
  });

  it("renders the synthetic patient number (3)", () => {
    renderPatients();

    expect(screen.getAllByText("PAT-00281").length).toBeGreaterThan(0);
  });

  it("searches by name (4)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Karim" } });

    expect(screen.getAllByText("Karim Idrissi").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("searches by phone (5)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "06 23 45 67 89" } });

    expect(screen.getAllByText("Sara Alaoui").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("searches by patient number (6)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "PAT-00287" } });

    expect(screen.getAllByText("Omar Bennani").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("filters by practitioner (7)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("combobox", { name: "Praticien" }), { target: { value: "pr-2" } });

    expect(screen.getAllByText("Fatima Zahra").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("filters by next appointment (8)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("combobox", { name: "Prochain rendez-vous" }), {
      target: { value: "today" },
    });

    expect(screen.getAllByText("Fatima Zahra").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("clears active filters (9)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Karim" } });
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));

    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);
  });

  it("shows the filtered-empty state and can clear filters from it (10)", () => {
    renderPatients();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });

    expect(screen.getByText("Aucun patient ne correspond à vos critères.")).toBeInTheDocument();
    expect(screen.queryByText("Aucun patient pour le moment.")).not.toBeInTheDocument();

    // Both the filter bar's clear action and the empty state's own clear
    // action are present once the search yields zero results — either one
    // calls the same handler.
    fireEvent.click(screen.getAllByRole("button", { name: "Effacer les filtres" })[0]);

    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);
  });

  it("renders the global empty state when there are no patients at all (11)", () => {
    renderPatients("fr", { state: "empty" });

    expect(screen.getByText("Aucun patient pour le moment.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter un patient" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton without patient content (12)", () => {
    renderPatients("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action (13)", () => {
    const onRetry = vi.fn();
    renderPatients("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les patients.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders French content by default (14)", () => {
    renderPatients("fr");

    const table = screen.getByRole("table");
    expect(screen.getByText("Téléphone")).toBeInTheDocument();
    expect(screen.getByText("Praticien")).toBeInTheDocument();
    expect(within(table).getByText("Solde")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active (15/16)", () => {
    const { container } = renderPatients("ar");

    expect(screen.getByRole("heading", { level: 1, name: "المرضى" })).toBeInTheDocument();
    expect(screen.getByText("الهاتف")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("الرصيد")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("renders both the desktop table and the mobile card presentation structurally (17)", () => {
    renderPatients();

    // Dual-render pattern (AppShell/WaitingRoom convention): the table cell
    // and the mobile card both render the same patient name as a direct
    // text node — CSS (not React) decides which is visible at runtime.
    expect(screen.getAllByText("Ahmed El Mansouri")).toHaveLength(2);
  });

  it("links each patient row to a Patient 360° placeholder route, not a form", () => {
    renderPatients();

    const openLinks = screen.getAllByRole("link", { name: "Ouvrir" });
    expect(openLinks[0]).toHaveAttribute("href", "/app/patients/pat-1");
  });
});

function tableRowFor(name: string) {
  const cell = within(screen.getByRole("table")).getByText(name);
  return cell.closest("tr")!;
}

function editButtonFor(name: string) {
  return within(tableRowFor(name)).getByRole("button", { name: "Modifier" });
}

function fillMainFields(overrides: { firstName?: string; lastName?: string; phone?: string } = {}) {
  fireEvent.change(screen.getByLabelText("Prénom *"), { target: { value: overrides.firstName ?? "Test" } });
  fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: overrides.lastName ?? "Patient" } });
  fireEvent.change(screen.getByLabelText("Téléphone *"), { target: { value: overrides.phone ?? "0699000000" } });
}

describe("PatientsPage — create/edit (UI-003B)", () => {
  it("opens the real create-patient form from '+ Nouveau patient' (replaces the UI-003A future-feature toast)", () => {
    renderPatients();

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nouveau patient" })).toBeInTheDocument();
  });

  it("blocks submission and shows required-field errors when the primary fields are empty (2)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));

    expect(screen.getAllByText("Ce champ est requis.")).toHaveLength(3);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps complementary fields collapsed and optional, with no appointment fields leaking in (3/4)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText(/Heure|Plage horaire|Type de rendez-vous|Service \/ Motif/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Informations complémentaires" }));
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Date de naissance")).toBeInTheDocument();
    expect(screen.getByLabelText("Ville")).toBeInTheDocument();

    fillMainFields({ firstName: "Nadia", lastName: "Chraibi", phone: "0655001122" });
    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));

    expect(screen.getByText("Patient créé.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a patient that immediately appears in the list, is searchable, gets a generated number, and respects the practitioner filter (5/6/7/8/9)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    fillMainFields({ firstName: "Yasmine", lastName: "Berrada", phone: "0611223344" });
    fireEvent.change(screen.getByLabelText("Praticien responsable *"), { target: { value: "pr-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));

    expect(screen.getByText("Patient créé.")).toBeInTheDocument();
    expect(screen.getAllByText("Yasmine Berrada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PAT-00297").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "0611223344" } });
    expect(screen.getAllByText("Yasmine Berrada").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Praticien" }), { target: { value: "pr-1" } });
    expect(screen.queryByText("Yasmine Berrada")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Praticien" }), { target: { value: "pr-2" } });
    expect(screen.getAllByText("Yasmine Berrada").length).toBeGreaterThan(0);
  });

  it("warns about a probable phone duplicate and links to the existing patient (10/12)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    fillMainFields({ firstName: "Karim", lastName: "Test", phone: "06 12 34 56 78" });
    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));

    expect(screen.getByText("Un patient similaire existe peut-être")).toBeInTheDocument();
    expect(screen.getByText("Même numéro de téléphone")).toBeInTheDocument();
    const openExisting = screen.getByRole("link", { name: "Ouvrir ce patient" });
    expect(openExisting).toHaveAttribute("href", "/app/patients/pat-1");
    expect(screen.queryByText("Patient créé.")).not.toBeInTheDocument();
  });

  it("warns about a probable name duplicate, case-insensitively (11)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    fillMainFields({ firstName: "ahmed", lastName: "el mansouri", phone: "0699999999" });
    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));

    expect(screen.getByText("Un patient similaire existe peut-être")).toBeInTheDocument();
    expect(screen.getByText("Nom similaire")).toBeInTheDocument();
  });

  it("creates the patient anyway after an explicit duplicate override, without touching the existing record (13/21)", () => {
    renderPatients();
    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    fillMainFields({ firstName: "Karim", lastName: "Test", phone: "06 12 34 56 78" });
    fireEvent.click(screen.getByRole("button", { name: "Créer le patient" }));
    expect(screen.getByText("Un patient similaire existe peut-être")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Créer quand même" }));

    expect(screen.getByText("Patient créé.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByText("Karim Test").length).toBeGreaterThan(0);
    // The original patient is untouched — still present, not merged/overwritten.
    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);
  });

  it("opens the edit form prefilled with the patient's existing values, with a read-only patient number (14/16)", () => {
    renderPatients();

    fireEvent.click(editButtonFor("Ahmed El Mansouri"));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le patient" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom *")).toHaveValue("Ahmed");
    expect(screen.getByLabelText("Nom *")).toHaveValue("El Mansouri");
    expect(screen.getByText("Numéro patient : PAT-00281")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Numéro patient/)).not.toBeInTheDocument();
  });

  it("saves edits and updates the list (15)", () => {
    renderPatients();

    fireEvent.click(editButtonFor("Ahmed El Mansouri"));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Mansouri-Test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Patient modifié.")).toBeInTheDocument();
    expect(screen.getAllByText("Ahmed Mansouri-Test").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
  });

  it("does not flag a patient as a duplicate of themself when editing without changes (17)", () => {
    renderPatients();

    fireEvent.click(editButtonFor("Ahmed El Mansouri"));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Patient modifié.")).toBeInTheDocument();
    expect(screen.queryByText("Un patient similaire existe peut-être")).not.toBeInTheDocument();
  });

  it("warns when an edit collides with a different existing patient (18)", () => {
    renderPatients();

    fireEvent.click(editButtonFor("Sara Alaoui"));
    fireEvent.change(screen.getByLabelText("Téléphone *"), { target: { value: "06 12 34 56 78" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Un patient similaire existe peut-être")).toBeInTheDocument();
    expect(screen.getByText("Même numéro de téléphone")).toBeInTheDocument();
    expect(screen.queryByText("Patient modifié.")).not.toBeInTheDocument();
  });

  it("cancelling the form does not create or modify a patient (32)", () => {
    renderPatients();

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));
    fillMainFields({ firstName: "Should", lastName: "NotSave", phone: "0600000000" });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Should NotSave")).not.toBeInTheDocument();
    expect(screen.queryByText("Patient créé.")).not.toBeInTheDocument();
  });

  it("renders the form in Arabic with RTL active (20/22)", () => {
    const { container } = renderPatients("ar");

    fireEvent.click(screen.getByRole("button", { name: "+ مريض جديد" }));

    expect(screen.getByRole("heading", { level: 2, name: "مريض جديد" })).toBeInTheDocument();
    expect(screen.getByLabelText("الاسم الأول *")).toBeInTheDocument();
    expect(screen.getByLabelText("الهاتف *")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

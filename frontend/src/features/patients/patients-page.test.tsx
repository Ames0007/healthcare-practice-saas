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

  it("shows a future-feature notice instead of opening a creation form", () => {
    renderPatients();

    fireEvent.click(screen.getByRole("button", { name: "+ Nouveau patient" }));

    expect(screen.getByText("La création de patient sera disponible dans une prochaine étape.")).toBeInTheDocument();
  });

  it("links each patient row to a Patient 360° placeholder route, not a form", () => {
    renderPatients();

    const openLinks = screen.getAllByRole("link", { name: "Ouvrir" });
    expect(openLinks[0]).toHaveAttribute("href", "/app/patients/pat-1");
  });
});

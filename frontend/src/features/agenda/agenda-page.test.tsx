import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { AgendaPage } from "./agenda-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/agenda",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderAgenda(initialLocale: Locale = "fr", props: React.ComponentProps<typeof AgendaPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <AgendaPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

function appointmentButton(name: string | RegExp) {
  return screen.getByRole("button", { name });
}

function dialog() {
  return screen.getByRole("dialog");
}

/** Opens the appointment drawer and waits for it to actually mount (portal timing can lag one tick). */
async function openDrawer(name: string | RegExp) {
  fireEvent.click(appointmentButton(name));
  await screen.findByRole("dialog");
  return dialog();
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("AgendaPage", () => {
  it("renders the Agenda route with the day view and today's appointments (1/2/24 FR)", () => {
    renderAgenda();

    expect(screen.getByRole("heading", { level: 1, name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("Fatima Zahra")).toBeInTheDocument();
    expect(screen.getByText("Sara Alaoui")).toBeInTheDocument();
    expect(screen.getByText("Ahmed El Mansouri")).toBeInTheDocument();
  });

  it("renders an exact appointment without a window caption (4)", () => {
    renderAgenda();

    expect(within(appointmentButton(/Ahmed El Mansouri/)).queryByText(/Arrivée entre/)).not.toBeInTheDocument();
  });

  it("renders an arrival-window appointment distinctly (5)", () => {
    renderAgenda();

    expect(within(appointmentButton(/Karim Idrissi/)).getByText("Arrivée entre 11:00 et 11:30")).toBeInTheDocument();
  });

  it("switches between Day and Week views locally, no page reload (3)", () => {
    renderAgenda();

    expect(screen.getByText("08:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Semaine" }));
    expect(screen.getByRole("tablist", { name: "Semaine" })).toBeInTheDocument();
    expect(screen.getAllByText("Ahmed El Mansouri").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Jour" }));
    expect(screen.getByText("08:00")).toBeInTheDocument();
  });

  it("filters appointments by practitioner (6)", () => {
    renderAgenda();

    expect(screen.getByText("Ahmed El Mansouri")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Praticien"), { target: { value: "pr-2" } });

    expect(screen.queryByText("Ahmed El Mansouri")).not.toBeInTheDocument();
    expect(screen.getByText("Youssef Amrani")).toBeInTheDocument();
  });

  it("opens and closes the appointment drawer (7/8)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Ahmed El Mansouri/);

    expect(within(drawer).getByText("PAT-00281")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Patient arrivé" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Fermer" }));

    expect(screen.queryByText("PAT-00281")).not.toBeInTheDocument();
  });

  it("confirms a to-confirm appointment from the drawer (9)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Nadia Amrani/);
    expect(within(drawer).getByText("À confirmer")).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Confirmer" }));

    expect(await within(drawer).findByRole("button", { name: "Patient arrivé" })).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "Fermer" }));
  });

  it("marks a confirmed appointment as arrived from the drawer, reflected in the day view (10/16)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Ahmed El Mansouri/);
    fireEvent.click(within(drawer).getByRole("button", { name: "Patient arrivé" }));

    expect(await within(drawer).findByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Fermer" }));

    expect(within(appointmentButton(/Ahmed El Mansouri/)).getByText("Arrivé")).toBeInTheDocument();
  });

  it("moves an arrived appointment to waiting from the drawer (11)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Hicham Bennani/);
    expect(within(drawer).getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Mettre en attente" }));

    expect(await within(drawer).findByRole("button", { name: "Commencer" })).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "Fermer" }));
  });

  it("creates a new appointment via the form and shows success feedback (12/13)", async () => {
    renderAgenda();

    fireEvent.click(screen.getByRole("button", { name: "Nouveau RDV" }));
    expect(await screen.findByRole("heading", { name: "Nouveau rendez-vous" })).toBeInTheDocument();

    // 13: exact/window switch — "Heure"/"Durée" by default, "De"/"À" after switching.
    // Required-field labels render as "Label *" (the asterisk lives inside
    // the <label>), so exact matches must include it.
    expect(screen.getByLabelText("Heure *")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Plage horaire" }));
    expect(screen.getByLabelText("De *")).toBeInTheDocument();
    expect(screen.getByLabelText("À *")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Heure fixe" }));

    fireEvent.change(screen.getByLabelText("Patient *"), { target: { value: "Omar" } });
    fireEvent.click(await screen.findByRole("option", { name: /Omar El Fassi/ }));
    fireEvent.change(screen.getByLabelText("Service / Motif *"), { target: { value: "Consultation" } });
    fireEvent.change(screen.getByLabelText("Heure *"), { target: { value: "13:00" } });

    fireEvent.click(screen.getByRole("button", { name: "Créer le rendez-vous" }));

    expect(await screen.findByText("Rendez-vous créé.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nouveau rendez-vous" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Omar El Fassi")).toHaveLength(2);
  });

  it("only offers active Paramètres services and auto-fills duration from the selected service (UI-014 §20/24 — Agenda reconciles with Services & tarifs, never a disconnected list)", async () => {
    renderAgenda();

    fireEvent.click(screen.getByRole("button", { name: "Nouveau RDV" }));
    await screen.findByRole("heading", { name: "Nouveau rendez-vous" });

    const serviceSelect = screen.getByLabelText("Service / Motif *");
    // "Suivi" (svc-5) is inactive in Paramètres > Services & tarifs — it must never be offered when creating a new appointment.
    expect(within(serviceSelect).queryByRole("option", { name: "Suivi" })).not.toBeInTheDocument();
    expect(within(serviceSelect).getByRole("option", { name: "Consultation" })).toBeInTheDocument();

    fireEvent.change(serviceSelect, { target: { value: "Contrôle" } });
    // "Contrôle" is 20 minutes in Paramètres — the default 30-minute duration must update to match, not stay hardcoded.
    expect(screen.getByLabelText("Durée")).toHaveValue("20");
  });

  it("shows a conflict message with alternative slots when the requested slot overlaps (14)", async () => {
    renderAgenda();

    fireEvent.click(screen.getByRole("button", { name: "Nouveau RDV" }));
    await screen.findByRole("heading", { name: "Nouveau rendez-vous" });

    fireEvent.change(screen.getByLabelText("Patient *"), { target: { value: "Omar" } });
    fireEvent.click(await screen.findByRole("option", { name: /Omar El Fassi/ }));
    fireEvent.change(screen.getByLabelText("Service / Motif *"), { target: { value: "Consultation" } });
    // Default time 09:00 for Dr. Benali overlaps Salma Tazi's 08:55 slot.

    fireEvent.click(screen.getByRole("button", { name: "Créer le rendez-vous" }));

    expect(await screen.findByText("Ce créneau n'est plus disponible.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nouveau rendez-vous" })).toBeInTheDocument();
    expect(screen.queryByText("Rendez-vous créé.")).not.toBeInTheDocument();
  });

  it("edits an appointment from the drawer (15)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Nadia Amrani/);
    fireEvent.click(within(drawer).getByRole("button", { name: "Modifier" }));

    expect(await screen.findByRole("heading", { name: "Modifier le rendez-vous" })).toBeInTheDocument();
    expect(screen.getByLabelText("Patient *")).toHaveValue("Nadia Amrani");

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("Rendez-vous mis à jour.")).toBeInTheDocument();
  });

  it("reschedules an appointment from the drawer (30)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Ahmed El Mansouri/);
    fireEvent.click(within(drawer).getByRole("button", { name: "Reporter" }));

    // The drawer stays open behind the reschedule modal, so both are
    // role="dialog" — scope to the newly-opened one (last in DOM order).
    await screen.findByRole("heading", { name: "Reporter le rendez-vous" });
    const rescheduleDialog = screen.getAllByRole("dialog").at(-1) as HTMLElement;

    fireEvent.change(within(rescheduleDialog).getByLabelText("Nouvelle date *"), { target: { value: "2026-08-24" } });
    fireEvent.click(within(rescheduleDialog).getByRole("button", { name: "Reporter" }));

    expect(await screen.findByText("Rendez-vous reporté.")).toBeInTheDocument();
  });

  it("cancels an appointment without deleting it (17)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Ahmed El Mansouri/);
    fireEvent.click(within(drawer).getByRole("button", { name: "Annuler" }));

    expect(await screen.findByText("Annuler ce rendez-vous ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Annulé par le cabinet" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer l'annulation" }));

    expect(await screen.findByText("Rendez-vous annulé.")).toBeInTheDocument();
    expect(within(drawer).getByText("PAT-00281")).toBeInTheDocument();
    expect(within(drawer).getByText("Annulé par le cabinet")).toBeInTheDocument();
  });

  it("marks an eligible appointment as no-show (18)", async () => {
    renderAgenda();

    const drawer = await openDrawer(/Ahmed El Mansouri/);
    fireEvent.click(within(drawer).getByRole("button", { name: "Absent" }));

    expect(await screen.findByText("Marquer ce rendez-vous comme absent ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(await screen.findByText("Rendez-vous marqué absent.")).toBeInTheDocument();
  });

  it("shows the Waiting Room with derived arrival/waiting durations and updates status from it (19/20)", () => {
    renderAgenda();

    fireEvent.click(screen.getByRole("button", { name: "File d'attente" }));

    const table = screen.getByRole("table");
    expect(within(table).getByText("Salma Tazi")).toBeInTheDocument();
    expect(within(table).getByText("20 min")).toBeInTheDocument();
    expect(within(table).getByText("10 min")).toBeInTheDocument();

    const hichamRow = within(table).getByText("Hicham Bennani").closest("tr")!;
    fireEvent.click(within(hichamRow).getByRole("button", { name: "Mettre en attente" }));

    expect(within(within(table).getByText("Hicham Bennani").closest("tr")!).getByText("En attente")).toBeInTheDocument();
  });

  it("renders the empty state (21)", () => {
    renderAgenda("fr", { state: "empty" });

    expect(screen.getByText("Aucun rendez-vous aujourd'hui.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer un rendez-vous" })).toBeInTheDocument();
  });

  it("renders the loading skeleton (22)", () => {
    renderAgenda("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Agenda" })).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action (23)", () => {
    const onRetry = vi.fn();
    renderAgenda("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger l'agenda.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic translations with RTL active (25/26)", () => {
    const { container } = renderAgenda("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الأجندة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اليوم" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "موعد جديد" })).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

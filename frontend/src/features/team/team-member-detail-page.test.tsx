import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TeamMemberDetailPage } from "./team-member-detail-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/equipe/team-3",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderDetail(
  initialLocale: Locale = "fr",
  props: React.ComponentProps<typeof TeamMemberDetailPage> = { memberId: "team-3" },
) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TeamMemberDetailPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TeamMemberDetailPage", () => {
  it("renders identity, role, employee number and status for a valid member (§31)", () => {
    renderDetail();

    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
    expect(screen.getByText("EMP-0003")).toBeInTheDocument();
    expect(screen.getAllByText("Réceptionniste").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Actif").length).toBeGreaterThan(0);
  });

  it("renders contact and employment info under INFORMATIONS (§31)", () => {
    renderDetail();

    expect(screen.getByText("06 22 33 44 55")).toBeInTheDocument();
    expect(screen.getByText("meryem@cabinet-exemple.test")).toBeInTheDocument();
    expect(screen.getByText("1 mars 2025")).toBeInTheDocument();
  });

  it("renders role and status again under TRAVAIL (§31)", () => {
    renderDetail();

    expect(screen.getAllByText("Réceptionniste").length).toBe(2);
    expect(screen.getAllByText("Actif").length).toBe(2);
  });

  it("shows the professional title next to the role for a practitioner", () => {
    renderDetail("fr", { memberId: "team-1" });

    expect(screen.getByText("Médecin")).toBeInTheDocument();
  });

  it("shows a not-provided fallback for a member without an optional field", () => {
    const members = [
      {
        id: "team-x",
        employeeNumber: "EMP-0099",
        firstName: "Sans",
        lastName: "Contact",
        role: "other" as const,
        status: "active" as const,
      },
    ];
    renderDetail("fr", { memberId: "team-x", members });

    expect(screen.getAllByText("Non renseigné").length).toBe(3);
  });

  it("shows the not-found state for an unknown member id", () => {
    renderDetail("fr", { memberId: "does-not-exist" });

    expect(screen.getByText("Membre introuvable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'équipe" })).toHaveAttribute("href", "/app/equipe");
  });

  it("renders the loading skeleton without member content", () => {
    renderDetail("fr", { memberId: "team-3", state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Meryem Bakkali")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderDetail("fr", { memberId: "team-3", state: "error", onRetry });

    expect(screen.getByText("Impossible de charger les informations du membre.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderDetail("ar");

    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
    expect(screen.getAllByText("موظف استقبال").length).toBeGreaterThan(0);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe("TeamMemberDetailPage — bounded edit (UI-007A §9/§30-31)", () => {
  it("opens the edit form prefilled with the member's current values from the [Modifier] action", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le membre" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom *")).toHaveValue("Meryem");
    expect(screen.getByText("Numéro employé : EMP-0003")).toBeInTheDocument();
  });

  it("saves edits and reflects them immediately on this page", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Bakkali-Test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Membre modifié.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali-Test" })).toBeInTheDocument();
  });

  it("cancelling the edit form does not change the member", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "ShouldNotSave" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
  });
});

describe("TeamMemberDetailPage — Employee 360° navigation (UI-007B §6-9)", () => {
  it("shows Profil/Contrat/Planning as real links to the three per-member routes", () => {
    renderDetail();

    const nav = screen.getByRole("navigation", { name: "Sections de l'employé" });
    expect(within(nav).getByRole("link", { name: "Profil" })).toHaveAttribute("href", "/app/equipe/team-3");
    expect(within(nav).getByRole("link", { name: "Contrat" })).toHaveAttribute("href", "/app/equipe/team-3/contract");
    expect(within(nav).getByRole("link", { name: "Planning" })).toHaveAttribute("href", "/app/equipe/team-3/schedule");
  });

  it("marks Profil active by default, and only Profil", () => {
    renderDetail();
    const nav = screen.getByRole("navigation", { name: "Sections de l'employé" });

    expect(within(nav).getByRole("link", { name: "Profil" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Contrat" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Planning" })).not.toHaveAttribute("aria-current");
  });

  it("marks Contrat active on the contract tab, never Profil", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });
    const nav = screen.getByRole("navigation", { name: "Sections de l'employé" });

    expect(within(nav).getByRole("link", { name: "Contrat" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Profil" })).not.toHaveAttribute("aria-current");
  });

  it("marks Planning active on the schedule tab, never Profil", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });
    const nav = screen.getByRole("navigation", { name: "Sections de l'employé" });

    expect(within(nav).getByRole("link", { name: "Planning" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Profil" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the shared header (identity/status) visible on every tab", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });
    expect(screen.getByRole("heading", { level: 1, name: "Meryem Bakkali" })).toBeInTheDocument();
  });
});

describe("TeamMemberDetailPage — Contrat tab (UI-007B §23)", () => {
  it("renders the full read-only contract summary matching the task's own wireframe example", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });

    expect(screen.getByText("CDI")).toBeInTheDocument();
    expect(screen.getByText("Réceptionniste", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("1 mars 2025")).toBeInTheDocument();
    expect(screen.getByText("Sans date de fin")).toBeInTheDocument();
    expect(screen.getByText("40 h / semaine")).toBeInTheDocument();
    expect(screen.getAllByText("Actif").length).toBe(2); // header badge + contract Statut badge
  });

  it("shows a real end date for a fixed-end contract instead of 'Sans date de fin'", () => {
    renderDetail("fr", { memberId: "team-5", activeTab: "contract" });

    expect(screen.getByText("31 décembre 2026")).toBeInTheDocument();
    expect(screen.queryByText("Sans date de fin")).not.toBeInTheDocument();
  });

  it("shows the ended status for a historical contract", () => {
    renderDetail("fr", { memberId: "team-6", activeTab: "contract" });
    expect(screen.getByText("Terminé")).toBeInTheDocument();
  });

  it("shows a restrained empty state for a member with no contract on file (§21D)", () => {
    renderDetail("fr", { memberId: "team-7", activeTab: "contract" });

    expect(screen.getByText("Aucun contrat enregistré.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
  });

  it("never shows a salary/remuneration field anywhere on this tab (§20)", () => {
    renderDetail("fr", { memberId: "team-1", activeTab: "contract" });

    expect(screen.queryByText(/salaire/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rémunération/i)).not.toBeInTheDocument();
  });

  it("opens the contract edit form prefilled with its current values", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le contrat" })).toBeInTheDocument();
    expect(screen.getByLabelText("Poste *")).toHaveValue("Réceptionniste");
    expect(screen.getByText("Numéro de contrat : CTR-2025-0003")).toBeInTheDocument();
  });

  it("saves contract edits and reflects them immediately", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Poste *"), { target: { value: "Réceptionniste principale" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Contrat modifié.")).toBeInTheDocument();
    expect(screen.getByText("Réceptionniste principale")).toBeInTheDocument();
  });

  it("rejects an end date on or before the start date", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Date de fin"), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("La date de fin doit être postérieure à la date de début.")).toBeInTheDocument();
    expect(screen.queryByText("Contrat modifié.")).not.toBeInTheDocument();
  });

  it("cancelling the contract edit form does not change the contract", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "contract" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Poste *"), { target: { value: "ShouldNotSave" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Réceptionniste", { selector: "dd" })).toBeInTheDocument();
    expect(screen.queryByText("ShouldNotSave")).not.toBeInTheDocument();
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderDetail("ar", { memberId: "team-3", activeTab: "contract" });

    expect(screen.getByText("عقد غير محدد المدة")).toBeInTheDocument();
    expect(screen.getByText("بدون تاريخ انتهاء")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

function scheduleRowFor(dayLabel: string) {
  return screen.getByText(dayLabel, { selector: "dt" }).closest("div")!;
}

function scheduleFormRowFor(dayLabel: string) {
  // Not `.closest(".rounded-md")` — the `Select`'s own `<select>` element carries that
  // exact utility class too (border-radius styling), so it would match itself first.
  return screen.getByLabelText(dayLabel).closest("div.p-3")! as HTMLElement;
}

describe("TeamMemberDetailPage — Planning tab (UI-007B §5-7)", () => {
  it("renders one interval per weekday for a simple single-shift schedule, and rest days", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    expect(screen.getByText("40 h planifiées / semaine")).toBeInTheDocument();
    expect(within(scheduleRowFor("Lundi")).getByText("08:00–16:00")).toBeInTheDocument();
    expect(within(scheduleRowFor("Vendredi")).getByText("08:00–16:00")).toBeInTheDocument();
    expect(screen.getAllByText("Repos")).toHaveLength(2); // Saturday + Sunday
  });

  it("renders both intervals of a split-shift day, comma-separated (§7)", () => {
    renderDetail("fr", { memberId: "team-1", activeTab: "schedule" });

    expect(screen.getByText("44 h planifiées / semaine")).toBeInTheDocument();
    expect(within(scheduleRowFor("Lundi")).getByText("08:30–12:30, 14:30–18:30")).toBeInTheDocument();
    expect(within(scheduleRowFor("Samedi")).getByText("08:30–12:30")).toBeInTheDocument(); // Saturday, single interval
  });

  it("shows every day as rest and a zero total for a member with no schedule at all", () => {
    renderDetail("fr", { memberId: "team-7", activeTab: "schedule" });

    expect(screen.getByText("0 h planifiées / semaine")).toBeInTheDocument();
    expect(screen.getAllByText("Repos")).toHaveLength(7);
  });

  it("opens the schedule edit form prefilled with the current weekly pattern", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le planning" })).toBeInTheDocument();
    expect(screen.getByLabelText("Lundi")).toHaveValue("worked");
    expect(screen.getByLabelText("Début — Lundi 1")).toHaveValue("08:00");
    expect(screen.getByLabelText("Samedi")).toHaveValue("rest");
  });

  it("turns a rest day into a worked day and saves it", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Samedi"), { target: { value: "worked" } });
    fireEvent.change(screen.getByLabelText("Début — Samedi 1"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("Fin — Samedi 1"), { target: { value: "12:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Planning modifié.")).toBeInTheDocument();
    expect(screen.getByText("43 h planifiées / semaine")).toBeInTheDocument();
    expect(screen.getByText("09:00–12:00")).toBeInTheDocument();
  });

  it("adds a second interval (split shift) to a day via '+ Ajouter une plage'", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(within(scheduleFormRowFor("Lundi")).getByRole("button", { name: "+ Ajouter une plage" }));
    fireEvent.change(screen.getByLabelText("Début — Lundi 2"), { target: { value: "17:00" } });
    fireEvent.change(screen.getByLabelText("Fin — Lundi 2"), { target: { value: "18:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(within(scheduleRowFor("Lundi")).getByText("08:00–16:00, 17:00–18:00")).toBeInTheDocument();
    expect(screen.getByText("41 h planifiées / semaine")).toBeInTheDocument();
  });

  it("rejects an invalid interval (end before start)", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Début — Lundi 1"), { target: { value: "16:00" } });
    fireEvent.change(screen.getByLabelText("Fin — Lundi 1"), { target: { value: "08:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Plage horaire invalide.")).toBeInTheDocument();
    expect(screen.queryByText("Planning modifié.")).not.toBeInTheDocument();
  });

  it("rejects a second interval that overlaps the first", () => {
    renderDetail("fr", { memberId: "team-1", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Début — Lundi 2"), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Cette plage doit commencer après la fin de la précédente.")).toBeInTheDocument();
  });

  it("removes the second interval of a split-shift day via 'Retirer'", () => {
    renderDetail("fr", { memberId: "team-1", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(within(scheduleFormRowFor("Lundi")).getByRole("button", { name: "Retirer" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Planning modifié.")).toBeInTheDocument();
    expect(within(scheduleRowFor("Lundi")).getByText("08:30–12:30")).toBeInTheDocument();
    expect(within(scheduleRowFor("Mardi")).getByText("08:30–12:30, 14:30–18:30")).toBeInTheDocument();
  });

  it("cancelling the schedule edit form does not change the schedule", () => {
    renderDetail("fr", { memberId: "team-3", activeTab: "schedule" });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Samedi"), { target: { value: "worked" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("40 h planifiées / semaine")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderDetail("ar", { memberId: "team-3", activeTab: "schedule" });

    expect(screen.getByText("الاثنين")).toBeInTheDocument();
    expect(screen.getAllByText("راحة").length).toBeGreaterThan(0);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

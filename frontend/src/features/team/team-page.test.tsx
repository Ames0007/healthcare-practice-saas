import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { TeamPage } from "./team-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/equipe",
}));

function DirRoot({ children }: { children: React.ReactNode }) {
  const { direction } = useLocale();
  return <div dir={direction}>{children}</div>;
}

function renderTeam(initialLocale: Locale = "fr", props: React.ComponentProps<typeof TeamPage> = {}) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <DirRoot>
        <TeamPage {...props} />
      </DirRoot>
    </LocaleProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("TeamPage", () => {
  it("renders the Équipe route with a dynamic member count (1/19)", () => {
    renderTeam();

    expect(screen.getByRole("heading", { level: 1, name: "Équipe" })).toBeInTheDocument();
    expect(screen.getByText("8 membres")).toBeInTheDocument();
  });

  it("renders team member rows (2)", () => {
    renderTeam();

    expect(screen.getAllByText("Youssef Benali").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Meryem Bakkali").length).toBeGreaterThan(0);
  });

  it("renders the synthetic employee number (3/10)", () => {
    renderTeam();

    expect(screen.getAllByText("EMP-0003").length).toBeGreaterThan(0);
  });

  it("searches by name (4/20)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Meryem" } });

    expect(screen.getAllByText("Meryem Bakkali").length).toBeGreaterThan(0);
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("searches by phone, tolerating formatting differences (20)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "0622334455" } });

    expect(screen.getAllByText("Meryem Bakkali").length).toBeGreaterThan(0);
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("searches by employee number (20)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "EMP-0004" } });

    expect(screen.getAllByText("Nawal Chaoui").length).toBeGreaterThan(0);
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("filters by role, only offering roles actually represented in the data (21)", () => {
    renderTeam();

    const roleSelect = screen.getByRole("combobox", { name: "Rôle" });
    const optionLabels = within(roleSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(optionLabels).toEqual(["Tous les rôles", "Praticien", "Réceptionniste", "Assistant(e)"]);

    fireEvent.change(roleSelect, { target: { value: "receptionist" } });

    expect(screen.getAllByText("Meryem Bakkali").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Khadija Ziani").length).toBeGreaterThan(0);
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("filters by status (22)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("combobox", { name: "Statut" }), { target: { value: "inactive" } });

    expect(screen.getAllByText("Khadija Ziani").length).toBeGreaterThan(0);
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("composes search and filters together (23)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("combobox", { name: "Rôle" }), { target: { value: "assistant" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Hamza" } });

    expect(screen.getAllByText("Hamza Rifai").length).toBeGreaterThan(0);
    expect(screen.queryByText("Nawal Chaoui")).not.toBeInTheDocument();
  });

  it("clears active filters (24)", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Meryem" } });
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));

    expect(screen.getAllByText("Youssef Benali").length).toBeGreaterThan(0);
  });

  it("shows the filtered-empty state and can clear filters from it", () => {
    renderTeam();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });

    expect(screen.getByText("Aucun membre ne correspond à vos critères.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Effacer les filtres" })[0]);

    expect(screen.getAllByText("Youssef Benali").length).toBeGreaterThan(0);
  });

  it("renders the solo empty state when there are no team members at all (17)", () => {
    renderTeam("fr", { state: "empty" });

    expect(screen.getByText("Aucun membre pour le moment.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter un membre" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton without team content", () => {
    renderTeam("fr", { state: "loading" });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Youssef Benali")).not.toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    renderTeam("fr", { state: "error", onRetry });

    expect(screen.getByText("Impossible de charger l'équipe.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("presents status with an icon-paired badge, never color alone (14)", () => {
    renderTeam();

    const activeBadges = screen.getAllByText("Actif");
    expect(activeBadges.length).toBeGreaterThan(0);
    expect(activeBadges.some((badge) => badge.querySelector("svg"))).toBe(true);
  });

  it("renders French content by default", () => {
    renderTeam();

    const table = screen.getByRole("table");
    expect(within(table).getByText("Téléphone")).toBeInTheDocument();
    expect(within(table).getByText("Rôle")).toBeInTheDocument();
    expect(within(table).getByText("Statut")).toBeInTheDocument();
  });

  it("renders Arabic content with RTL active", () => {
    const { container } = renderTeam("ar");

    expect(screen.getByRole("heading", { level: 1, name: "الفريق" })).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("الهاتف")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("renders both the desktop table and the mobile card presentation structurally (dual-render pattern, §28)", () => {
    renderTeam();

    expect(screen.getAllByText("Youssef Benali")).toHaveLength(2);
  });

  it("links each member row to the real employee-profile route, not a form", () => {
    renderTeam();

    const openLinks = screen.getAllByRole("link", { name: "Ouvrir" });
    expect(openLinks[0]).toHaveAttribute("href", "/app/equipe/team-1");
  });

  it("exposes both the Présence and Agenda des congés cabinet-level workspaces (UI-LEAVE-X §3), without touching the main sidebar", () => {
    renderTeam();

    expect(screen.getByRole("link", { name: "Présence du jour" })).toHaveAttribute("href", "/app/equipe/attendance");
    expect(screen.getByRole("link", { name: "Agenda des congés" })).toHaveAttribute("href", "/app/equipe/leave-calendar");
  });
});

function tableRowFor(name: string) {
  const cell = within(screen.getByRole("table")).getByText(name);
  return cell.closest("tr")!;
}

function editButtonFor(name: string) {
  return within(tableRowFor(name)).getByRole("button", { name: "Modifier" });
}

describe("TeamPage — create/edit (UI-007A §6/§9)", () => {
  it("opens the create-member form from '+ Ajouter un membre'", () => {
    renderTeam();

    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un membre" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nouveau membre" })).toBeInTheDocument();
  });

  it("blocks submission and shows required-field errors when the primary fields are empty", () => {
    renderTeam();
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un membre" }));

    fireEvent.click(screen.getByRole("button", { name: "Ajouter le membre" }));

    expect(screen.getAllByText("Ce champ est requis.")).toHaveLength(2);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("rejects an invalid phone/email without blocking on optional fields being empty", () => {
    renderTeam();
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un membre" }));

    fireEvent.change(screen.getByLabelText("Prénom *"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Membre" } });
    fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter le membre" }));

    expect(screen.getByText("Numéro de téléphone invalide.")).toBeInTheDocument();
    expect(screen.getByText("Adresse email invalide.")).toBeInTheDocument();
  });

  it("creates a member that immediately appears in the list, gets a generated employee number, and is searchable", () => {
    renderTeam();
    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un membre" }));

    fireEvent.change(screen.getByLabelText("Prénom *"), { target: { value: "Salma" } });
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Testouni" } });
    fireEvent.change(screen.getByLabelText("Rôle *"), { target: { value: "assistant" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter le membre" }));

    expect(screen.getByText("Membre ajouté.")).toBeInTheDocument();
    expect(screen.getAllByText("Salma Testouni").length).toBeGreaterThan(0);
    expect(screen.getAllByText("EMP-0009").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Testouni" } });
    expect(screen.getAllByText("Salma Testouni").length).toBeGreaterThan(0);
  });

  it("opens the edit form prefilled with the member's existing values, with a read-only employee number", () => {
    renderTeam();

    fireEvent.click(editButtonFor("Meryem Bakkali"));

    expect(screen.getByRole("heading", { level: 2, name: "Modifier le membre" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom *")).toHaveValue("Meryem");
    expect(screen.getByLabelText("Nom *")).toHaveValue("Bakkali");
    expect(screen.getByText("Numéro employé : EMP-0003")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Numéro employé/)).not.toBeInTheDocument();
  });

  it("saves edits and updates the list", () => {
    renderTeam();

    fireEvent.click(editButtonFor("Meryem Bakkali"));
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "Bakkali-Test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Membre modifié.")).toBeInTheDocument();
    expect(screen.getAllByText("Meryem Bakkali-Test").length).toBeGreaterThan(0);
    expect(screen.queryByText("Meryem Bakkali")).not.toBeInTheDocument();
  });

  it("can change a member's status from the edit form", () => {
    renderTeam();

    fireEvent.click(editButtonFor("Nawal Chaoui"));
    fireEvent.change(screen.getByLabelText("Statut *"), { target: { value: "inactive" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    fireEvent.change(screen.getByRole("combobox", { name: "Statut" }), { target: { value: "inactive" } });
    expect(screen.getAllByText("Nawal Chaoui").length).toBeGreaterThan(0);
  });

  it("cancelling the form does not create a member", () => {
    renderTeam();

    fireEvent.click(screen.getByRole("button", { name: "+ Ajouter un membre" }));
    fireEvent.change(screen.getByLabelText("Prénom *"), { target: { value: "Should" } });
    fireEvent.change(screen.getByLabelText("Nom *"), { target: { value: "NotSave" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Should NotSave")).not.toBeInTheDocument();
    expect(screen.queryByText("Membre ajouté.")).not.toBeInTheDocument();
  });

  it("renders the form in Arabic with RTL active", () => {
    const { container } = renderTeam("ar");

    fireEvent.click(screen.getByRole("button", { name: "+ إضافة عضو" }));

    expect(screen.getByRole("heading", { level: 2, name: "عضو جديد" })).toBeInTheDocument();
    expect(screen.getByLabelText("الاسم الأول *")).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
